import assert from 'node:assert/strict';
import { mockGameConfiguration, openGame } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5197';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1280, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await mockGameConfiguration(page);
    await openGame(page, origin, '/merge-battle');
    const header = page.locator('header.site-header');
    assert.equal(await header.count(), 1);
    assert.equal(await header.getByRole('link', { name: 'Home', exact: true }).getAttribute('href'), '/');
    assert.equal(await header.locator('img').evaluate(image => image.complete && image.naturalWidth > 0), true);
    assert.equal(await header.evaluate(element => getComputedStyle(element).backgroundColor), await page.getByRole('contentinfo').evaluate(element => getComputedStyle(element).backgroundColor));
    assert.equal(await header.evaluate(element => {
      const logo = element.querySelector('.home-link').getBoundingClientRect();
      const actions = element.querySelector('.header-actions').getBoundingClientRect();
      return actions.left > logo.right && actions.right <= innerWidth;
    }), true);
    await header.getByRole('button', { name: 'Come si gioca', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: /Gioca da solo/ }).click();
    await header.getByRole('button', { name: 'Cambia modalità', exact: true }).click();
    await page.locator('[data-phase="intro"]').waitFor();
    await header.screenshot({ path: `/tmp/site-header-${width}.png` });
    await page.goto(origin + '/merge-battle/online');
    await page.getByRole('navigation', { name: 'Navigazione Merge Battle online' }).waitFor();
    assert.equal(await header.count(), 1);
    assert.equal(await header.getByRole('link', { name: 'Cambia modalità', exact: true }).getAttribute('href'), '/merge-battle');
    assert.equal(await header.getByRole('button', { name: 'Come si gioca', exact: true }).isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log(`PASS header ${width}px: Home, matching purple, right actions, tutorial and reset`);
    await page.close();
  }
} finally { await browser.close(); }
