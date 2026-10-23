import assert from 'node:assert/strict';
import { createRoom, updateRoom, roomView } from '../src/lib/games/merge-battle/online.ts';
import { resolve } from '../src/lib/games/merge-battle/engine.ts';
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
  const choice = first.getByRole('button', { name: 'Frontend Developer', exact: true });
  assert.equal(await choice.isEnabled(), true, 'A pending background refresh must not disable play');
  await choice.click();
  const moves = first.locator('.character-moves');
  assert.equal(await moves.locator('li').count(), 3);
  await moves.getByText('Disattivo la feature con un flag', { exact: false }).waitFor();
  await first.getByRole('button', { name: 'Conferma personaggio', exact: true }).click();
  releasePoll();
  await first.getByRole('heading', { name: 'L’altro giocatore sta scegliendo il personaggio' }).waitFor();
  const waiting = first.locator('.waiting-banner');
  await waiting.waitFor();
  assert.equal(await waiting.evaluate(element => Boolean(element.compareDocumentPosition(document.querySelector('.maintainer-brief')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  await first.waitForFunction(() => document.querySelector('.waiting-banner')?.getBoundingClientRect().top < innerHeight / 2);
  await first.screenshot({ path: '/tmp/online-waiting-notice.png' });
  await second.getByRole('heading', { name: 'Scegli il tuo Polpodev', exact: true }).waitFor();
  await second.getByRole('button', { name: 'Frontend Developer', exact: true }).isDisabled().then(disabled => assert.equal(disabled, true));
  await second.getByRole('button', { name: 'Backend Developer', exact: true }).click();
  await second.getByRole('button', { name: 'Conferma personaggio', exact: true }).click();
  await first.getByRole('button', { name: 'Inizia il round' }).click();
  await first.locator('.cards button').first().click();
  await second.getByRole('heading', { name: 'Scegli la tua carta', exact: true }).waitFor();
  await second.locator('.cards button').first().click();
  await first.getByRole('button', { name: 'Crea un’altra stanza' }).waitFor();
  await second.getByRole('button', { name: 'Crea un’altra stanza' }).waitFor();
  const inviteBefore = new URL(first.url()).searchParams.get('room');
  await first.getByRole('button', { name: 'Gioca di nuovo', exact: true }).click();
  await first.getByRole('heading', { name: 'Rivincita: in attesa dell’altro giocatore', exact: true }).waitFor();
  assert.equal(await first.getByRole('button', { name: 'Rivincita richiesta', exact: true }).isDisabled(), true);
  await second.getByRole('button', { name: 'Gioca di nuovo', exact: true }).click();
  await first.getByRole('button', { name: 'Inizia il round' }).waitFor();
  assert.equal(room.session.round, 1);
  assert.deepEqual(room.session.moves, [null, null]);
  assert.equal(new URL(first.url()).searchParams.get('room'), inviteBefore);
  assert.equal(new URL(second.url()).searchParams.get('room'), inviteBefore);
  assert.ok(room.expires - Date.now() > 170000);
  await first.getByRole('button', { name: 'Inizia il round' }).click();
  await first.locator('.cards button').first().click();
  await second.getByRole('heading', { name: 'Scegli la tua carta', exact: true }).waitFor();
  await second.locator('.cards button').nth(2).click();
  await first.getByRole('button', { name: 'Gioca di nuovo', exact: true }).waitFor();
  await second.getByRole('button', { name: 'Gioca di nuovo', exact: true }).waitFor();
  const winner = resolve(room.session.ids, room.session.moves, room.session.trial, room.session.config).winner;
  assert.notEqual(winner, null, 'The rematch fixture must exercise a winning 3D prize');
  for (const [index, page] of pages.entries()) {
    const prize = page.getByRole('region', { name: 'Polpo conquistato' });
    if (winner === index) await prize.waitFor();
    else assert.equal(await prize.count(), 0);
  }
  for (const [index, page] of pages.entries()) {
    await page.locator('[data-result-ready="true"]').waitFor();
    assert.equal(await page.locator('.mb-contender').count(), 2);
    await page.locator('.merge-summary').waitFor();
    assert.equal((await page.locator('.online-battle').innerText()).includes('Maggiore differenza su:'), false);
    await page.locator('.score-details summary').click();
    await page.getByRole('region', { name: 'Confronto dei punteggi' }).waitFor();
    assert.equal(await page.locator('.status').evaluate(e => getComputedStyle(e).position), 'static');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `/tmp/merge-online-ui-${index}.png`, fullPage: true });
  }
  console.log('PASS: two players, slow polling, stale response, characters, cards, result, two-player rematch in the same room and responsive status');
} finally {
  releasePoll?.();
  await browser.close();
}
