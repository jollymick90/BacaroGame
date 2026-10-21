import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      hasTouch: mobile,
      isMobile: mobile,
      reducedMotion: mobile ? 'reduce' : 'no-preference',
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { Math.random = () => 0.1; });
    await page.goto(`${origin}/bug-hunter`);
    await page.getByRole('button', { name: 'Inizia', exact: true }).click();
    const toggle = page.getByRole('button', { name: /dettagli dei bug catturati/i });
    await toggle.waitFor();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await page.waitForFunction(() => Number(document.querySelector('[data-testid="bug-count"]')?.textContent) === 1);
    const details = page.getByRole('region', { name: 'Bug catturati' });
    await details.waitFor();
    assert.match(await details.locator('[data-captured="true"]').innerText(), /Heisenbug/);
    assert.equal(await details.locator('.species > div').count(), 1, 'automatic panel only shows captured species');
    const message = page.locator('.bh-feedback');
    assert.equal(await message.getAttribute('data-tone'), 'positive');
    assert.equal(await message.evaluate(element => getComputedStyle(element).color), 'rgb(246, 243, 234)');
    assert.equal(await message.evaluate(element => getComputedStyle(element).borderColor), 'rgb(0, 229, 163)');
    const messageBounds = await message.boundingBox();
    const panelBounds = await details.boundingBox();
    assert.ok(messageBounds.x + messageBounds.width <= panelBounds.x, 'event message stays left of the capture panel');
    await page.screenshot({ path: `/tmp/bug-captures-open-${mobile ? 'mobile' : 'desktop'}.png` });
    await details.waitFor({ state: 'detached', timeout: 1600 });
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.click();
    await details.waitFor();
    assert.match(await details.innerText(), /Heisenbug.*1/s);
    assert.equal(await details.locator('.species > div').count(), 4, 'manual panel shows all species');
    await page.waitForTimeout(2700);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true', 'manually opened details stay open');
    await toggle.click();
    await details.waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('bh-stage')), true, 'closing details restores keyboard controls');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await details.waitFor();
    assert.equal(await toggle.evaluate(element => element === document.activeElement), true, 'keyboard disclosure keeps focus');
    await page.keyboard.press('Enter');
    await details.waitFor({ state: 'detached' });
    await page.screenshot({ path: `/tmp/bug-captures-${mobile ? 'mobile' : 'desktop'}.png` });
    await page.locator('.bh-feedback[data-tone="negative"]').waitFor();
    assert.equal(await message.evaluate(element => getComputedStyle(element).color), 'rgb(255, 154, 189)');
    assert.equal(await message.evaluate(element => getComputedStyle(element).borderColor), 'rgb(185, 161, 251)');
    assert.equal(await message.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(35, 35, 46)');
    await page.screenshot({ path: `/tmp/bug-event-loss-${mobile ? 'mobile' : 'desktop'}.png` });
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`${mobile ? 'Mobile' : 'Desktop'}: capture highlights species, collapses, icon reopens details PASS`);
  }
} finally {
  await browser.close();
}
