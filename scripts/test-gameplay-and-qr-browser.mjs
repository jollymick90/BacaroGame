import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome' });

async function start(page, random) {
  await page.addInitScript((value) => {
    Math.random = () => value;
  }, random);
  await page.goto(`${origin}/#/are-you-an-ai`);
  await page.getByRole('checkbox', { name: /^Non sono un robot/ }).check();
  await page.getByRole('button', { name: 'Verificami, allora' }).click();
}
async function completeLoading(page) {
  await page.getByRole('checkbox', { name: /Senza scadenza/ }).check();
  for (let index = 0; index < 5; index++) {
    const button = page.getByRole('button', { name: 'ORA — premi!' });
    await button.waitFor();
    await button.focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('heading', { name: 'Caricamento completato.' }).waitFor();
  await page.getByRole('button', { name: 'Continua', exact: true }).click();
}
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      acceptDownloads: true,
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin);
    await page.getByRole('link', { name: /Invita/ }).click();
    await page.getByRole('img', { name: /QR per aprire/ }).waitFor();
    assert.equal(await page.locator('.address').getAttribute('href'), `${origin}/#/`);
    const image = await page.locator('img.qr').getAttribute('src');
    assert.ok(image.startsWith('data:image/png;base64,'));
    const headingBox = await page.getByRole('heading', { name: /Invita a giocare/ }).boundingBox();
    const qrBox = await page.locator('.qr-frame').boundingBox();
    assert.ok(headingBox.y + headingBox.height <= qrBox.y, 'QR must not overlap heading');
    const qr = await page.getByRole('link', { name: 'Scarica QR' }).boundingBox();
    assert.ok(qr.y + qr.height <= (mobile ? 844 : 900));
    const qrDownload = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Scarica QR' }).click();
    assert.equal((await qrDownload).suggestedFilename(), 'bacarotech-game-center-qr.png');
    await page.screenshot({ path: `/tmp/bacaro-qr-${mobile ? 'mobile' : 'desktop'}.png` });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );

    // A deterministic shuffle keeps the original three trials for the full human path.
    await start(page, 0.999);
    const close = page.getByRole('button', { name: 'Chiudi finestra 3', exact: true });
    await close.click();
    assert.equal(await page.locator('.fake-window').count(), 2);
    assert.ok(await page.evaluate(() => document.activeElement?.matches('.window-bar button')), 'closing a window preserves keyboard focus');
    await close.waitFor();
    assert.equal(await page.locator('.fake-window').count(), 3);
    await page.getByRole('button', { name: /Spegni il desktop/ }).click();
    await page.getByRole('button', { name: 'Continua', exact: true }).click();
    await page.getByRole('heading', { name: 'Completa il caricamento.' }).waitFor();
    await page.getByRole('button', { name: 'Ricomincia dalla prima prova' }).click();
    await page.getByRole('heading', { name: 'Chiudi tutte le finestre.' }).waitFor();
    await page.getByRole('button', { name: /Spegni il desktop/ }).click();
    await page.getByRole('button', { name: 'Continua', exact: true }).click();
    await completeLoading(page);
    const robot = page.getByRole('button', { name: 'Seleziona il robot assistente' });
    assert.notEqual(
      await robot.evaluate((element) => getComputedStyle(element).borderStyle),
      'dashed',
    );
    await robot.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Continua', exact: true }).click();
    await page.getByRole('heading', { name: /UMANO PER/ }).waitFor();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Scarica certificato PDF' }).click();
    const file = await download;
    assert.equal(file.suggestedFilename(), 'bacarotech-certificato-umanita.pdf');
    await file.saveAs(`/tmp/bacaro-certificato-${mobile ? 'mobile' : 'desktop'}.pdf`);
    await page.screenshot({ path: `/tmp/bacaro-certificato-${mobile ? 'mobile' : 'desktop'}.png` });
    await page.getByRole('button', { name: 'Riprova', exact: true }).click();
    await page.getByRole('heading', { name: /Hai l’aria/ }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `${mobile ? 'Mobile' : 'Desktop'}: QR, five confirmations, window reopen, reset, human verdict and PDF PASS`,
    );
  }
  const page = await browser.newPage({ acceptDownloads: true });
  await start(page, 0.5); // windows, math, loading
  await page.getByRole('button', { name: /Spegni il desktop/ }).click();
  await page.getByRole('button', { name: 'Continua', exact: true }).click();
  await page.getByRole('button', { name: 'Conferma il calcolo' }).click();
  await page.getByText('Scrivi un numero. Anche un tentativo va bene.').waitFor();
  await page.getByLabel('La tua risposta').fill('42');
  await page.getByRole('button', { name: 'Conferma il calcolo' }).click();
  await page.getByRole('heading', { name: /ROBOT PER/ }).waitFor();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Scarica certificato PDF' }).click();
  const file = await download;
  assert.equal(file.suggestedFilename(), 'bacarotech-certificato-robot.pdf');
  await file.saveAs('/tmp/bacaro-certificato-robot.pdf');
  await page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await page.getByRole('checkbox', { name: /^Non sono un robot/ }).check();
  await page.getByRole('button', { name: 'Verificami, allora' }).click();
  await page.getByRole('button', { name: /Spegni il desktop/ }).click();
  await page.getByRole('button', { name: 'Continua', exact: true }).click();
  await page.getByLabel('La tua risposta').fill('41');
  await page.getByRole('button', { name: 'Conferma il calcolo' }).click();
  await page.getByRole('heading', { name: 'Approssimazione molto umana.' }).waitFor();
  await page.close();
  console.log('Math trap: invalid input, robot verdict/PDF, human error PASS');
} finally {
  await browser.close();
}
