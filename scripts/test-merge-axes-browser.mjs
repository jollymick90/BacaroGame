import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/lib/games/merge-battle/config.ts';
import { AXES } from '../src/lib/games/merge-battle/cards.ts';
import { resolve } from '../src/lib/games/merge-battle/engine.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5187';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const legacy = structuredClone(DEFAULT_CONFIG);
delete legacy.activeAxes;
let published = { config: legacy, revision: 7, persisted: true };
let writes = 0;
await page.route('**/api/merge-battle/config', route => {
  if (route.request().method() === 'GET') return route.fulfill({ json: published });
  const payload = route.request().postDataJSON();
  assert.equal(payload.revision, published.revision);
  writes++;
  published = { config: payload.config, revision: published.revision + 1, persisted: true };
  return route.fulfill({ json: published });
});
await page.addInitScript(() => { Math.random = () => 0; });

async function openHand(game, mode = 'solo') {
  await game.getByRole('button', { name: mode === 'solo' ? /Gioca da solo/ : /Gioca in due/ }).click();
  await game.getByRole('button', { name: 'Frontend Developer', exact: true }).click();
  if (mode === 'local') await game.getByRole('button', { name: 'Backend Developer', exact: true }).click();
  await game.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
}

try {
  await page.goto(`${origin}/admin`);
  // Never submit development credentials without the explicit emulator-only guard.
  await page.getByText('Emulatori locali: nessun collegamento al progetto Firebase cloud.').waitFor();
  await page.getByLabel('Email di sviluppo').fill('dev@bacarotech.local');
  await page.getByLabel('Password di sviluppo').fill('bacarodev123');
  await page.getByRole('button', { name: 'Accedi agli emulatori', exact: true }).click();
  await page.getByRole('heading', { name: 'Game Center / backoffice', exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Merge Battle/ }).click();
  await page.getByRole('heading', { name: 'Parametri dello scontro', exact: true }).waitFor();
  const rapidity = page.getByRole('checkbox', { name: 'Rapidità', exact: true });
  const solidity = page.getByRole('checkbox', { name: 'Solidità', exact: true });
  const evidence = page.getByRole('checkbox', { name: 'Evidenza', exact: true });
  assert.equal(await rapidity.isChecked(), true);
  assert.equal(await solidity.isChecked(), true);
  assert.equal(await evidence.isChecked(), false);
  await rapidity.uncheck();
  assert.equal(await solidity.isDisabled(), true);
  await rapidity.check();
  assert.equal(writes, 0);
  await page.getByRole('button', { name: 'Apri anteprima giocabile', exact: true }).click();
  const preview = page.locator('main.mb-shell');
  await openHand(preview);
  assert.equal(await preview.locator('.card-values b').count(), 6);
  await evidence.check();
  assert.equal(await preview.locator('.card-values b').count(), 6, 'running preview must retain two axes');
  await page.getByRole('button', { name: 'Salva configurazione pubblica', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Configurazione salvata su Firebase.' }).waitFor();
  assert.deepEqual(published.config.activeAxes, [0, 1, 2]);
  assert.equal(writes, 1);
  await page.getByRole('button', { name: 'Ricarica da Firebase', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Configurazione caricata da Firebase.' }).waitFor();
  assert.equal(await evidence.isChecked(), true);
  await page.locator('.parameters').screenshot({ path: '/tmp/merge-axes-admin.png' });

  // Actual simulator uses the same active axes as the public game.
  await page.getByText('Simula uno scontro', { exact: true }).click();
  const simulator = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Simula uno scontro' }) });
  await simulator.getByRole('combobox').nth(0).selectOption('role-0-move-0');
  await simulator.getByRole('combobox').nth(1).selectOption('role-1-move-1');
  assert.equal(await simulator.locator('tbody tr').count(), 3);
  assert.deepEqual((await simulator.locator('tfoot strong').allTextContents()).map(Number), [23, 19]);
  console.log('Admin: legacy default, minimum one, toggle/save/reload, preview snapshot and simulator PASS');

  for (const activeAxes of [[0, 1], [1], [1, 3], [0, 1, 2, 3]]) {
    published.config.activeAxes = activeAxes;
    for (const mode of ['solo', 'local']) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${origin}/#/merge-battle`);
      await page.reload();
      await openHand(page.locator('main.mb-shell'), mode);
      assert.equal(await page.locator('.card-values b').count(), activeAxes.length * 3);
      const gameText = await page.locator('main').innerText();
      for (const [index, label] of AXES.entries()) assert.equal(gameText.includes(label), activeAxes.includes(index));
      if (activeAxes.length === 2 && activeAxes[0] === 0) await page.screenshot({ path: '/tmp/merge-axes-moves.png', fullPage: true });
      await page.locator('.mb-card').nth(1).click();
      if (mode === 'local') {
        await page.getByRole('button', { name: 'Sono Player 2', exact: true }).click();
        await page.locator('.mb-card').first().click();
      }
      await page.locator('.mb-verdict').waitFor();
      const expected = resolve([0, 1], ['role-0-move-1', 'role-1-move-0'], 0, published.config);
      assert.equal(await page.locator('.comparison tbody tr').count(), activeAxes.length);
      assert.deepEqual((await page.locator('.comparison tfoot strong').allTextContents()).map(Number), expected.scores);
      const comparisonText = await page.locator('.comparison').innerText();
      for (const [index, label] of AXES.entries()) assert.equal(comparisonText.includes(label), activeAxes.includes(index));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (activeAxes.length === 2 && activeAxes[0] === 0) await page.locator('.comparison').screenshot({ path: '/tmp/merge-axes-comparison.png' });
      await page.getByRole('button', { name: 'Scopri il merge', exact: true }).click();
      await page.getByText('Perché questo risultato?', { exact: true }).click();
      assert.deepEqual((await page.locator('.comparison tfoot strong').allTextContents()).map(Number), expected.scores);
      await page.setViewportSize({ width: 320, height: 720 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
  }
  assert.deepEqual(errors, []);
  console.log('8 solo/local battles: default two, one, sparse two, all four parameters; hidden labels, correct comparison and totals, 390/320px PASS');
} catch (error) {
  console.error('Browser errors:', errors);
  console.error((await page.locator('body').innerText()).slice(0, 1800));
  throw error;
} finally {
  await browser.close();
}
