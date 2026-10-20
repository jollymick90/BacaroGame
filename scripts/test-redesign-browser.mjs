import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5187';
const browser = await chromium.launch({ channel: 'chrome' });

async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}

try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Controlled availability states do not create members or biometric data.
    await page.route('**/api/play', (route) => route.fulfill({ json: { available: true, count: 0 } }));
    await page.goto(origin);
    await page.getByText('Nessun membro disponibile al momento.').waitFor();
    assert.equal(await page.locator('.game-card h2').count(), 4);
    assert.equal(await page.getByRole('link', { name: 'Invita', exact: true }).count(), 1);
    assert.equal(await page.locator('.game-card a').count(), 4);
    await noOverflow(page);
    await page.getByRole('link', { name: 'Gioca a Merge Battle' }).click();
    await page.getByRole('button', { name: /Gioca da solo/ }).waitFor();
    assert.equal(await page.locator('.mb-how').getAttribute('open'), null);
    await page.getByText('Come si gioca', { exact: true }).click();
    await page.getByText('Cosa significano i quattro attributi?').waitFor();
    await noOverflow(page);
    await page.locator('.center-return a').click();
    await page.getByRole('heading', { name: 'Scegli un gioco.' }).waitFor();
    await page.getByRole('link', { name: 'Apri Bacarodex' }).click();
    await page.getByText('Nessun membro è ancora pronto', { exact: false }).waitFor();
    await page.getByRole('button', { name: /Il mio Bacarodex/ }).click();
    await page.getByText('Nessuna cattura ancora.', { exact: false }).waitFor();
    await page.locator('.center-return a').click();
    await page.getByRole('link', { name: 'Invita', exact: true }).click();
    await page.getByRole('img', { name: /QR per aprire/ }).waitFor();
    assert.equal(await page.locator('.address').getAttribute('href'), `${origin}/#/`);
    await noOverflow(page);
    // Real clipboard write/read through browser permissions.
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copia link', exact: true }).click();
    await page.getByRole('button', { name: 'Link copiato', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), `${origin}/#/`);
    // Failure after previous success must reset the success indicator.
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => { throw new Error('Denied'); };
    });
    await page.getByRole('button', { name: 'Link copiato', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Copia non riuscita' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Link copiato', exact: true }).count(), 0);
    await page.screenshot({ path: `/tmp/redesign-qr-error-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`${width}px: home, navigation, empty Bacarodex, instructions, QR, actual clipboard and clipboard denial PASS`);
  }

  for (const width of [390, 1440]) {
    const battle = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    for (const mode of ['solo', 'local']) {
      await battle.goto(`${origin}/#/merge-battle`);
      await battle.getByRole('button', { name: mode === 'solo' ? /Gioca da solo/ : /Gioca in due/ }).click();
      await battle.locator('.mb-character').first().click();
      if (mode === 'local') await battle.locator('.mb-character:not(:disabled)').first().click();
      await battle.getByRole('button', { name: 'Scegliamo le mosse →' }).click();
      await noOverflow(battle);
      await battle.screenshot({ path: `/tmp/redesign-merge-hand-${mode}-${width}.png`, fullPage: true });
      await battle.locator('.mb-card').first().click();
      if (mode === 'local') {
        assert.equal(await battle.locator('.mb-card').count(), 0, 'handoff hides first choice');
        await battle.getByRole('button', { name: 'Sono Player 2. Tocca a me →' }).click();
        await battle.locator('.mb-card').first().click();
      }
      await battle.getByRole('button', { name: 'Scopri esito e merge →' }).waitFor();
      await battle.screenshot({ path: `/tmp/redesign-merge-arena-${mode}-${width}.png`, fullPage: true });
      await battle.getByRole('button', { name: 'Scopri esito e merge →' }).click();
      await battle.locator('.mb-merge').waitFor();
      await noOverflow(battle);
      await battle.screenshot({ path: `/tmp/redesign-merge-result-${mode}-${width}.png`, fullPage: true });
      await battle.getByRole('button', { name: 'Rivincita! Cambiamo maintainer →' }).click();
      await battle.getByRole('button', { name: 'Scegliamo le mosse →' }).waitFor();
      await battle.locator('.center-return a').click();
      await battle.getByRole('heading', { name: 'Scegli un gioco.' }).waitFor();
    }
    await battle.close();
    console.log(`${width}px: Merge Battle solo/local, secret handoff, arena, result, rematch and home PASS`);
  }

  const page = await browser.newPage();
  await page.route('**/api/play', (route) => route.fulfill({ json: { available: true, count: 1 } }));
  await page.goto(origin);
  await page.getByRole('link', { name: 'Gioca a Bacarodex' }).waitFor();
  await page.getByText('Serve un membro registrato, presente con te.').waitFor();
  // Genuine route error + retry path, no failure in another game's module.
  await page.route('**/api/merge-battle/config', (route) => route.fulfill({ status: 503 }));
  await page.getByRole('link', { name: 'Gioca a Merge Battle' }).click();
  await page.getByRole('alert').filter({ hasText: 'Il gioco non si è caricato' }).waitFor();
  await page.unroute('**/api/merge-battle/config');
  await page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await page.getByRole('button', { name: /Gioca da solo/ }).waitFor();
  await page.goto(`${origin}/#/unknown`);
  await page.getByRole('heading', { name: 'Scegli un gioco.' }).waitFor();
  assert.equal(new URL(page.url()).hash, '#/');
  await page.close();

  const sharePage = await browser.newPage();
  await sharePage.addInitScript(() => {
    window.shareMode = 'cancel';
    Object.defineProperty(navigator, 'share', { value: async (data) => {
      window.sharedUrl = data.url;
      if (window.shareMode === 'cancel') throw new DOMException('Cancelled', 'AbortError');
      if (window.shareMode === 'fail') throw new Error('Unavailable');
    } });
  });
  await sharePage.goto(`${origin}/qr`);
  await sharePage.getByRole('button', { name: 'Condividi link' }).click();
  assert.equal(await sharePage.getByRole('alert').count(), 0);
  await sharePage.evaluate(() => { window.shareMode = 'fail'; });
  await sharePage.getByRole('button', { name: 'Condividi link' }).click();
  await sharePage.getByRole('alert').filter({ hasText: 'Condivisione non riuscita' }).waitFor();
  await sharePage.evaluate(() => { window.shareMode = 'success'; });
  await sharePage.getByRole('button', { name: 'Condividi link' }).click();
  assert.equal(await sharePage.evaluate(() => window.sharedUrl), `${origin}/#/`);
  assert.equal(await sharePage.getByRole('alert').count(), 0);
  await sharePage.close();
  console.log('Availability, route failure/retry, unknown hash and simulated share success/cancellation/failure PASS');
} finally {
  await browser.close();
}
