import assert from 'node:assert/strict';
import { createRoom, updateRoom, roomView } from '../src/lib/games/merge-battle/online.ts';
import { DEFAULT_CONFIG } from '../src/lib/games/merge-battle/config.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome' });
let releasePoll;
try {
  let room;
  let holdPoll = false;
  let pollStarted;
  const pendingPoll = new Promise(resolve => { pollStarted = resolve; });
  const code = 'polpo-laguna-caffe';
  const pages = [];
  for (const [index, width] of [1280, 390].entries()) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const identity = `player-${index}`;
    await page.route('**/api/merge-battle/rooms**', async route => {
      const command = route.request().postDataJSON();
      if (command?.type === 'create') room = createRoom(identity, Date.now(), DEFAULT_CONFIG, 0);
      else if (command) room = updateRoom(room, identity, command, command.revision, Date.now());
      if (!room?.players.includes(identity)) {
        return route.fulfill({ status: 403, json: { message: 'Entra nella stanza per giocare.' } });
      }
      const snapshot = { code, ...roomView(room, identity, Date.now()) };
      if (!command && index === 0 && holdPoll) {
        holdPoll = false;
        await new Promise(resolve => { releasePoll = resolve; pollStarted(); });
      }
      await route.fulfill({ json: snapshot }).catch(() => {});
    });
    await page.goto(`${origin}/merge-battle/online${index ? `?room=${code}` : ''}`);
    pages.push(page);
  }
  const [first, second] = pages;
  await first.getByRole('button', { name: 'Crea stanza', exact: true }).click();
  await second.getByLabel('Codice stanza').fill(code);
  await second.getByRole('button', { name: 'Entra nella stanza', exact: true }).click();
  await first.getByRole('heading', { name: 'Scegli il tuo Polpodev', exact: true }).waitFor();
  holdPoll = true;
  await pendingPoll;
  const moves = first.locator('.character-option').first().locator('.character-moves');
  await moves.locator('summary').click();
  assert.equal(await moves.locator('li').count(), 3);
  await moves.getByText('Disattivo la feature con un flag', { exact: false }).waitFor();
  const choice = first.locator('.characters button').first();
  assert.equal(await choice.isEnabled(), true, 'A pending background refresh must not disable play');
  await choice.click();
  releasePoll();
  await first.getByRole('heading', { name: 'L’altro giocatore sta scegliendo il personaggio' }).waitFor();
  await second.getByRole('heading', { name: 'Scegli il tuo Polpodev', exact: true }).waitFor();
  await second.locator('.characters button').first().click();
  await first.getByRole('button', { name: 'Inizia il round' }).click();
  await first.locator('.cards button').first().click();
  await second.getByRole('heading', { name: 'Scegli la tua carta', exact: true }).waitFor();
  await second.locator('.cards button').first().click();
  await first.getByRole('button', { name: 'Crea un’altra stanza' }).waitFor();
  await second.getByRole('button', { name: 'Crea un’altra stanza' }).waitFor();
  for (const [index, page] of pages.entries()) {
    assert.equal(await page.locator('.status').evaluate(e => getComputedStyle(e).position), 'static');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `/tmp/merge-online-ui-${index}.png`, fullPage: true });
  }
  console.log('PASS: two players, slow polling, stale response, characters, cards, result and responsive status');
} finally {
  releasePoll?.();
  await browser.close();
}
