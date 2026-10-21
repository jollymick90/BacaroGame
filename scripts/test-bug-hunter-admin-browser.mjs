import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { DEFAULT_QUESTIONS } from '../src/lib/games/bug-hunter/questions.ts';

// Uses emulator-only login. The question API is intercepted: this tests the real
// editor against controlled responses, not Firebase persistence (covered by API tests).
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failures = [];
page.on('pageerror', error => failures.push(error.message));
try {
  await page.goto(`${origin}/admin`);
  await page.waitForLoadState('networkidle');
  await page.getByText('Emulatori locali: nessun collegamento al progetto Firebase cloud.').waitFor();
  await page.getByLabel('Email di sviluppo').fill('dev@bacarotech.local');
  await page.getByLabel('Password di sviluppo').fill('bacarodev123');
  await page.getByRole('button', { name: 'Accedi agli emulatori', exact: true }).click();
  await page.getByRole('heading', { name: 'Game Center / backoffice' }).waitFor();
  let published = { config: { questions: structuredClone(DEFAULT_QUESTIONS) }, revision: 0, persisted: false };
  let rejectSave = true;
  let writes = 0;
  await page.route('**/api/bug-hunter/config', async route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: published });
    }
    writes++;
    const data = route.request().postDataJSON();
    if (rejectSave) {
      rejectSave = false;
      return route.fulfill({ status: 409, json: { message: 'Domande modificate da un altro membro. Le tue modifiche sono conservate.' } });
    }
    assert.equal(data.revision, published.revision);
    published = { config: data.config, revision: data.revision + 1, persisted: true };
    return route.fulfill({ json: published });
  });
  await page.getByRole('button', { name: /Bug Hunter/ }).click();
  await page.getByText('20 domande predefinite.', { exact: false }).waitFor();
  assert.equal(writes, 0);
  await page.getByLabel('Distanza obiettivo (metri)').fill('2500');
  await page.getByLabel('Bug aggiuntivi dopo la distanza', { exact: true }).fill('35');
  assert.equal(await page.locator('details.question').count(), 20);
  await page.getByRole('button', { name: '+ Aggiungi domanda', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Salva configurazione', exact: true }).isDisabled(), true);
  const newQuestion = page.locator('details.question').last();
  await newQuestion.getByLabel('Domanda', { exact: true }).fill('Una nuova domanda semplice?');
  await newQuestion.getByLabel('Risposta 1', { exact: true }).fill('Opzione A');
  await newQuestion.getByLabel('Risposta 2', { exact: true }).fill('Opzione B');
  await newQuestion.getByLabel('Risposta 3', { exact: true }).fill('Opzione C');
  await newQuestion.getByLabel('Risposta corretta').selectOption('2');
  await newQuestion.getByLabel('Breve spiegazione').fill('La risposta corretta è C.');
  await page.getByRole('button', { name: 'Salva configurazione', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'modificate da un altro membro' }).waitFor();
  assert.equal(await newQuestion.getByLabel('Domanda', { exact: true }).inputValue(), 'Una nuova domanda semplice?');
  assert.equal(await newQuestion.getByLabel('Risposta corretta').inputValue(), '2');
  await page.getByRole('button', { name: 'Salva configurazione', exact: true }).click();
  await page.getByText('Configurazione salvata.', { exact: false }).waitFor();
  assert.deepEqual(published.config.run, { distanceGoal: 2500, bugGoal: 35 });
  assert.equal(published.config.questions.length, 21);
  assert.equal(published.config.questions[20].correctIndex, 2);
  await newQuestion.getByLabel('Domanda', { exact: true }).fill('Modifica da conservare');
  await page.getByRole('button', { name: 'Ricarica domande pubblicate', exact: true }).click();
  await page.getByRole('button', { name: 'Continua a modificare', exact: true }).click();
  assert.equal(await newQuestion.getByLabel('Domanda', { exact: true }).inputValue(), 'Modifica da conservare');
  await page.getByRole('button', { name: 'Ricarica domande pubblicate', exact: true }).click();
  await page.getByRole('button', { name: 'Scarta modifiche e ricarica', exact: true }).click();
  await page.getByText('Configurazione pubblicata caricata.', { exact: false }).waitFor();
  assert.equal(await newQuestion.getByLabel('Domanda', { exact: true }).inputValue(), 'Una nuova domanda semplice?');
  await newQuestion.locator('summary').click();
  await newQuestion.getByRole('button', { name: 'Rimuovi domanda 21', exact: true }).click();
  assert.equal(await page.locator('details.question').count(), 20);
  await page.screenshot({ path: '/tmp/bug-hunter-admin-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/bug-hunter-admin-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  published.config.questions = published.config.questions.slice(0, 1);
  await page.getByRole('button', { name: 'Ricarica domande pubblicate', exact: true }).click();
  await page.getByRole('button', { name: 'Scarta modifiche e ricarica', exact: true }).click();
  await page.getByText('Configurazione pubblicata caricata.', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Rimuovi domanda 1', exact: true }).isDisabled(), true);
  assert.deepEqual(failures, []);
  console.log('PASS: admin default bank, add/edit/correct answer, conflict draft preservation, save, reload cancel/confirm, remove, minimum one question, responsive width, no browser errors. API writes intercepted; no Firebase question writes.');
} catch (error) {
  console.error('Browser errors', failures);
  console.error((await page.locator('body').innerText()).slice(0, 2200));
  throw error;
} finally {
  await browser.close();
}
