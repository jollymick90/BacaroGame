import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const production = process.env.TEST_PRODUCTION === '1';
const browser = await chromium.launch({
  channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.goto(`${origin}/bug-hunter`);
  await page.getByRole('button', { name: 'Inizia', exact: true }).click();
  const freeze = page.getByRole('button', { name: /DEV · .*frame/ });
  if (production) {
    assert.equal(await freeze.count(), 0);
    await page.keyboard.press('F8');
    assert.equal(await page.locator('.dev-frozen').count(), 0);
    console.log('Production: dev freeze unavailable even on localhost PASS');
  } else {
    await page.waitForFunction(() => Number(document.querySelector('[data-testid="bug-count"]')?.textContent) === 1);
    await page.keyboard.press('o');
    assert.equal(await freeze.getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('O');
    assert.equal(await freeze.getAttribute('aria-pressed'), 'false');
    await page.keyboard.press('F8');
    assert.equal(await freeze.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByRole('heading', { name: 'In pausa.' }).count(), 0);
    const hud = await page.locator('.bh-hud').innerText();
    const canvas = page.locator('.bh-stage canvas');
    const pixels = await canvas.screenshot();
    await page.waitForTimeout(3100);
    assert.deepEqual(await canvas.screenshot(), pixels, 'the actual rendered frame is unchanged');
    assert.equal(await page.locator('.bh-hud').innerText(), hud);
    await page.getByRole('region', { name: 'Bug catturati' }).waitFor();
    await page.screenshot({ path: '/tmp/bug-dev-frozen.png' });
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
    });
    assert.equal(await page.getByRole('heading', { name: 'In pausa.' }).count(), 0, 'switching tabs preserves the frozen frame');
    await freeze.click();
    await page.getByRole('button', { name: 'Riprendi', exact: true }).click();
    await page.getByRole('region', { name: 'Bug catturati' }).waitFor({ state: 'detached', timeout: 3500 });
    assert.equal(await freeze.getAttribute('aria-pressed'), 'false');
    await page.getByRole('button', { name: 'Pausa', exact: true }).click();
    await page.getByRole('button', { name: 'Riprendi', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log('Local DEV: O/o and F8 freeze exact canvas and capture timers, button resumes, normal pause preserved PASS');
  }
} finally {
  await browser.close();
}
