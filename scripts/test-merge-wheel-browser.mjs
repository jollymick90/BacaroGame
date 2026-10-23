import assert from 'node:assert/strict';
import { mockGameConfiguration, openGame } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5187';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1280, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockGameConfiguration(page);
    await openGame(page, origin, '/merge-battle');
    assert.equal(await page.locator('.arcade-shell').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(21, 21, 27)');
    await page.getByRole('button', { name: /Gioca in due/ }).click();
    const nav = page.getByRole('navigation', { name: 'Navigazione Merge Battle' });
    await nav.getByRole('button', { name: 'Cambia modalità', exact: true }).waitFor();
    assert.equal(await page.locator('.mb-character').count(), 12);
    assert.equal(await page.getByRole('button', { name: 'Conferma personaggio' }).isDisabled(), true);
    assert.equal(await page.locator('.mb-character img').first().evaluate(el => getComputedStyle(el).filter), 'grayscale(1)');
    await page.getByRole('button', { name: 'Frontend Developer', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Frontend Developer', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByRole('button', { name: 'Frontend Developer', exact: true }).locator('img').evaluate(el => getComputedStyle(el).filter), 'none');
    await page.screenshot({ path: `/tmp/merge-wheel-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Conferma personaggio' }).click();
    assert.equal(await page.getByRole('button', { name: 'Frontend Developer', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'Gira la ruota', exact: true }).click();
    await page.getByRole('button', { name: 'Conferma personaggio' }).click();
    await page.locator('[data-phase="brief"]').waitFor();
    await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
    await page.locator('.mb-card').first().click();
    await nav.getByRole('button', { name: 'Cambia modalità', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Sono Player 2', exact: true }).click();
    await page.locator('.mb-card').first().click();
    await page.getByRole('button', { name: 'Scopri il merge', exact: true }).click();
    await page.getByRole('button', { name: 'Rivincita!', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cambia personaggi', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await page.close();
  }
  const normal = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  normal.on('pageerror', error => errors.push(error.message));
  await mockGameConfiguration(normal);
  await openGame(normal, origin, '/merge-battle');
  await normal.getByRole('button', { name: /Gioca da solo/ }).click();
  await normal.getByRole('button', { name: 'Frontend Developer', exact: true }).focus();
  await normal.keyboard.press('ArrowRight');
  assert.equal(await normal.getByRole('button', { name: 'Backend Developer', exact: true }).evaluate(el => el === document.activeElement), true);
  await normal.keyboard.press('Enter');
  assert.equal(await normal.getByRole('button', { name: 'Backend Developer', exact: true }).getAttribute('aria-pressed'), 'true');
  await normal.getByRole('button', { name: 'Gira la ruota', exact: true }).click();
  assert.equal(await normal.getByRole('button', { name: 'Conferma personaggio' }).isDisabled(), true);
  await normal.waitForFunction(() => !document.querySelector('.confirm-button').disabled);
  assert.equal(await normal.locator('.mb-character[aria-pressed="true"]').count(), 1);
  assert.equal(await normal.locator('.confirm-button').evaluate(el => el === document.activeElement), true);
  await normal.getByRole('button', { name: 'Gira la ruota', exact: true }).click();
  await normal.getByRole('button', { name: 'Cambia modalità', exact: true }).click();
  await normal.waitForTimeout(2400);
  await normal.locator('[data-phase="intro"]').waitFor();
  assert.deepEqual(errors, []);
  await normal.setViewportSize({ width: 844, height: 390 });
  await normal.getByRole('button', { name: /Gioca da solo/ }).click();
  await normal.getByRole('button', { name: 'Frontend Developer', exact: true }).focus();
  for (let index = 0; index < 6; index++) {
    await normal.keyboard.press('ArrowRight');
    assert.equal(await normal.evaluate(() => {
      const selected = document.activeElement.getBoundingClientRect();
      const nav = document.querySelector('.mb-navigation').getBoundingClientRect();
      return selected.top >= nav.bottom && selected.bottom <= innerHeight;
    }), true, 'arrow focus must remain visible below sticky navigation in landscape');
  }
  await normal.close();
  console.log('PASS: dark theme, top navigation, manual/random wheel, unique characters, local battle at 1280/390/320px');
} finally { await browser.close(); }
