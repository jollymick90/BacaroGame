import assert from 'node:assert/strict';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5187';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const paths = ['/merge-battle', '/bug-hunter', '/are-you-an-ai', '/bacarodex'];
for (const path of paths) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200, `direct SSR entry: ${path}`);
  assert.match(await response.text(), /Torna al Game Center/, path);
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  const configRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/\/api\/(game-center|merge-battle|bug-hunter)\/config/.test(request.url())) configRequests.push(request.url());
  });
  await page.goto(`${origin}/`);
  await page.waitForLoadState('networkidle');
  const originalDocument = await page.evaluate(() => {
    window.__routerTestDocument = crypto.randomUUID();
    return window.__routerTestDocument;
  });
  await page.getByRole('link', { name: 'Gioca a Merge Battle', exact: true }).click();
  await page.waitForURL('**/merge-battle');
  await page.locator('[data-phase="intro"]').waitFor();
  await page.getByRole('link', { name: '← Torna al Game Center', exact: true }).click();
  await page.getByRole('link', { name: 'Gioca a Are You an AI?', exact: true }).click();
  await page.waitForURL('**/are-you-an-ai');
  await page.goBack();
  await page.waitForURL(`${origin}/`);
  await page.goForward();
  await page.waitForURL('**/are-you-an-ai');
  assert.equal(await page.evaluate(() => window.__routerTestDocument), originalDocument, 'navigation must preserve the document');
  assert.deepEqual(configRequests, [], 'SSR config reused during hydration and game navigation');
  await page.reload();
  await page.getByRole('link', { name: '← Torna al Game Center', exact: true }).waitFor();
  for (const path of paths) {
    await page.goto(`${origin}/#${path}`);
    await page.waitForURL(`${origin}${path}`);
    await page.getByRole('link', { name: '← Torna al Game Center', exact: true }).waitFor();
  }
  await page.goto(`${origin}/qr`);
  await page.waitForLoadState('networkidle');
  configRequests.length = 0;
  await page.getByRole('link', { name: '← Torna al Game Center', exact: true }).click();
  await page.getByRole('link', { name: 'Gioca a Merge Battle', exact: true }).click();
  await page.locator('[data-phase="intro"]').waitFor();
  await page.getByRole('link', { name: '← Torna al Game Center', exact: true }).click();
  await page.getByRole('link', { name: 'Gioca a Are You an AI?', exact: true }).click();
  await page.waitForURL('**/are-you-an-ai');
  assert.equal(configRequests.length, 1, 'client entry makes one shared configuration request');
  assert.match(configRequests[0], /\/api\/game-center\/config$/);

  await page.goto(`${origin}/qr`);
  await page.waitForLoadState('networkidle');
  await page.route('**/api/game-center/config', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.getByRole('link', { name: '← Torna al Game Center', exact: true }).click();
  await page.getByRole('heading', { name: 'Il gioco si fa aspettare' }).waitFor();
  await page.unroute('**/api/game-center/config');
  await page.getByRole('link', { name: 'Riprova', exact: true }).click();
  await page.getByRole('heading', { name: 'Scegli un gioco.' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: native SSR routes, hydration, shared config, history, reload and all legacy links, one client config request and error recovery');
} finally {
  await browser.close();
}
