import assert from 'node:assert/strict';
import { mockGameConfiguration, openGame } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5187';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const touch of [false, true]) {
    const page = await browser.newPage({ viewport: touch ? { width: 390, height: 900 } : { width: 1280, height: 900 }, hasTouch: touch, isMobile: touch, reducedMotion: touch ? 'reduce' : 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockGameConfiguration(page);
    await openGame(page, origin, '/merge-battle');
    await page.getByRole('button', { name: /Gioca in due/ }).click();
    const wheel = page.locator('.wheel');
    await wheel.scrollIntoViewIfNeeded();
    let rect = await wheel.boundingBox();
    const point = angle => ({ x: rect.x + rect.width / 2 + Math.cos(angle * Math.PI / 180) * rect.width * .4, y: rect.y + rect.height / 2 + Math.sin(angle * Math.PI / 180) * rect.height * .4 });
    const cdp = touch ? await page.context().newCDPSession(page) : null;
    async function drag(from, to, cancel = false) {
      await wheel.scrollIntoViewIfNeeded();
      rect = await wheel.boundingBox();
      const initialRotation = await wheel.evaluate(el => parseFloat(el.style.getPropertyValue('--rotation')));
      const start = point(from);
      if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
      else { await page.mouse.move(start.x, start.y); await page.mouse.down(); }
      for (let step = 1; step <= 12; step++) {
        const next = point(from + (to - from) * step / 12);
        if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [next] });
        else await page.mouse.move(next.x, next.y);
      }
      const rotation = await wheel.evaluate(el => parseFloat(el.style.getPropertyValue('--rotation')));
      assert.ok(Math.abs(rotation - initialRotation) > 30, 'wheel must follow the pointer before release');
      assert.equal(await page.getByRole('button', { name: 'Conferma personaggio' }).isDisabled(), true);
      if (touch) await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
    }
    const scrollBefore = await page.evaluate(() => scrollY);
    await drag(-90, 0);
    assert.equal(await page.getByRole('button', { name: 'Data Scientist', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => scrollY), scrollBefore, 'touch drag must rotate rather than scroll the page');
    await page.getByRole('button', { name: 'Conferma personaggio' }).click();
    await page.locator('[data-phase="character2"]').waitFor();
    await drag(-90, 0);
    assert.equal(await page.getByRole('button', { name: 'Data Scientist', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: 'Data Scientist', exact: true }).getAttribute('aria-pressed'), 'false');
    if (touch) {
      const before = await wheel.evaluate(el => el.style.getPropertyValue('--rotation'));
      const selected = await page.locator('.mb-character[aria-pressed="true"]').getAttribute('aria-label');
      await drag(0, -90, true);
      assert.ok(Math.abs(await wheel.evaluate(el => parseFloat(el.style.getPropertyValue('--rotation'))) - parseFloat(before)) < 0.001);
      assert.equal(await page.locator('.mb-character[aria-pressed="true"]').getAttribute('aria-label'), selected);
      // Interrupt a settling animation: cancellation must restore its target, not an intermediate angle.
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.getByRole('button', { name: 'Backend Developer', exact: true }).click();
      const target = await wheel.evaluate(el => el.style.getPropertyValue('--rotation'));
      await page.waitForTimeout(50);
      await drag(0, -90, true);
      assert.equal(await wheel.evaluate(el => el.style.getPropertyValue('--rotation')), target);
      assert.equal(await page.getByRole('button', { name: 'Backend Developer', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    await drag(0, -90);
    assert.equal(await page.locator('.mb-character[aria-pressed="true"]').count(), 1);
    await page.getByRole('button', { name: 'Conferma personaggio' }).click();
    await page.locator('[data-phase="brief"]').waitFor();
    assert.deepEqual(errors, []);
    console.log(`${touch ? 'Touch' : 'Mouse'}: live drag, snapping, no accidental click, occupied role exclusion and confirmation PASS`);
    await page.close();
  }
} finally { await browser.close(); }
