import assert from 'node:assert/strict';
import { LOCAL_ACCOUNT } from './local-environment.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const config = await (await fetch('http://127.0.0.1:4100/api/config')).json();
  assert.equal(config.projectId, 'demo-bacarodex');
  assert.equal(config.auth.port, 9199);
  assert.equal(config.firestore.port, 8180);
  assert.equal(config.firestore.webSocketPort, 9250);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${origin}/admin`);
  await page.getByLabel('Email di sviluppo', { exact: true }).fill(LOCAL_ACCOUNT.email);
  await page.getByLabel('Password di sviluppo', { exact: true }).fill(LOCAL_ACCOUNT.password);
  await page.getByRole('button', { name: 'Accedi agli emulatori', exact: true }).click();
  await page.getByRole('heading', { name: 'Game Center / backoffice', exact: true }).waitFor();
  const members = await page.request.get(`${origin}/api/bacarodex`);
  assert.equal(members.status(), 200);
  assert.equal((await members.json()).superadmin, true);
  await page.locator('.game-tile').filter({ hasText: 'Bacarodex' }).click();
  await page.getByRole('heading', { name: 'Registra un Bacaro', exact: true }).waitFor();
  await page.getByLabel('Nome del Bacaro', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('Nome del Bacaro', { exact: true }).isEnabled(), true);
  const play = await page.request.get(`${origin}/api/play`);
  assert.equal(play.status(), 200);
  assert.equal((await play.json()).available, true);
  await page.getByRole('link', { name: 'Apri il gioco →', exact: true }).click();
  await page.getByRole('heading', { name: 'Chi catturi oggi?', exact: true }).waitFor();
  assert.equal(
    await page
      .getByText('Gli amministratori devono completare la configurazione del gioco.')
      .count(),
    0,
  );
  console.log(
    'Real local emulators: login, superadmin, enabled registration and available public game PASS',
  );
} finally {
  await browser.close();
}
