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
    await page.screenshot({ path: `/tmp/bug-captures-open-${mobile ? 'mobile' : 'desktop'}.png` });
    await details.waitFor({ state: 'detached', timeout: 4000 });
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.click();
    await details.waitFor();
    assert.match(await details.innerText(), /Heisenbug.*1/s);
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
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`${mobile ? 'Mobile' : 'Desktop'}: capture highlights species, collapses, icon reopens details PASS`);
  }
} finally {
  await browser.close();
}
