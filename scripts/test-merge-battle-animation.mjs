import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${origin}/#/merge-battle`);
  await page.getByRole('button', { name: /Gioca in due/ }).click();
  await page.locator('.mb-character').first().click();
  await page.locator('.mb-character:not(:disabled)').first().click();
  await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
  await page.locator('.mb-card').first().click();
  await page.getByRole('button', { name: 'Sono Player 2', exact: true }).click();
  await page.locator('.mb-card').first().click();
  await page.locator('.mb-count').waitFor();
  assert.equal(await page.locator('.played-card').count(), 0);
  await page.locator('.mb-action').waitFor();
  assert.equal(await page.locator('.played-card').count(), 2);
  const animation = await page.locator('.played-card').first().evaluate(node => getComputedStyle(node).animationName);
  assert.ok(animation.includes('collide'));
  await page.getByRole('button', { name: 'Scopri il merge', exact: true }).click();
  await page.locator('.mb-merge').waitFor();
  assert.equal(await page.locator('.mb-merge img').count(), 2);
  console.log('Comic arena, concealed cards, reveal, card impact and illustrated duo PASS');
} finally {
  await browser.close();
}
