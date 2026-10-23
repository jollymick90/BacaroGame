import assert from 'node:assert/strict';
import { mockGameConfiguration, openGame, chooseCharacter } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockGameConfiguration(page);
    await openGame(page, origin, '/merge-battle');
    await page.getByRole('button', { name: 'Come si gioca · Prova il tutorial', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('heading', { name: 'Qual è lo scopo?' }).waitFor();
    for (let index = 0; index < 3; index++) await dialog.getByRole('button', { name: 'Avanti', exact: true }).click();
    await dialog.getByRole('heading', { name: 'Prova a giocare una carta' }).waitFor();
    await dialog.getByRole('button', { name: /^Gioca:/ }).first().click();
    await dialog.getByRole('heading', { name: 'Ecco come si vince' }).waitFor();
    await dialog.getByText('Totale', { exact: true }).waitFor();
    await page.screenshot({ path: `/tmp/merge-tutorial-${width}.png` });
    await dialog.getByRole('button', { name: 'Prova un’altra carta' }).click();
    await dialog.getByRole('button', { name: /^Gioca:/ }).last().click();
    await dialog.getByRole('button', { name: 'Ho capito, giochiamo!' }).click();
    await page.getByRole('button', { name: /Gioca da solo/ }).waitFor();
    await page.getByRole('button', { name: /Gioca da solo/ }).click();
    await page.getByRole('button', { name: 'Frontend Developer', exact: true }).click();
    const preview = page.locator('.selection-controls .character-moves');
    assert.equal(await preview.locator('li').count(), 3);
    await preview.getByText('Disattivo la feature con un flag', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Backend Developer', exact: true }).click();
    await preview.getByText('Faccio rollback del servizio', { exact: false }).waitFor();
    await chooseCharacter(page, 'Frontend Developer');
    const maintainer = page.getByRole('region', { name: 'Il reviewer che valuta il tuo lavoro' });
    await maintainer.getByText('Il tuo reviewer', { exact: true }).waitFor();
    await maintainer.getByRole('heading').waitFor();
    await page.screenshot({ path: `/tmp/merge-maintainer-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: '← Cambia modalità', exact: true }).click();
    await page.getByRole('link', { name: 'Gioca online · Due dispositivi' }).click();
    await page.getByRole('button', { name: 'Come si gioca · Prova il tutorial', exact: true }).click();
    await dialog.getByRole('heading', { name: 'Qual è lo scopo?' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Crea stanza', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}: guided example, real card scores, replay, exit and online access`);
    await page.close();
  }
} finally { await browser.close(); }
