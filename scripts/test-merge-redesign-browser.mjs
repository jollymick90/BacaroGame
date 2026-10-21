import { mockGameConfiguration, openGame, chooseCharacter } from './game-center-browser-helpers.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { DEFAULT_CONFIG } from '../src/lib/games/merge-battle/config.ts';
import { AXES } from '../src/lib/games/merge-battle/cards.ts';
import { resolve } from '../src/lib/games/merge-battle/engine.ts';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5187';
const screenshots = process.env.SCREENSHOT_DIR || '/tmp/merge-redesign';
await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
let battles = 0;

async function checkScreen(page, phase, name, expectFocus = true) {
  await page.locator(`main[data-phase="${phase}"]`).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: overflow`);
  if (phase !== 'intro' && expectFocus) {
    assert.equal(await page.locator('main h1').evaluate(node => document.activeElement === node), true, `${name}: heading focus`);
  }
  if (name) await page.screenshot({ path: `${screenshots}/${name}.png`, fullPage: true });
}

async function finishBattle(page, ids, moves, trial, config) {
  await page.getByRole('button', { name: 'Scopri il merge', exact: true }).click();
  await page.locator('[data-phase="result"]').waitFor();
  assert.equal(await page.locator('main h1').evaluate(node => document.activeElement === node), true);
  const expected = resolve(ids, moves, trial, config);
  const scoreText = await page.locator('.mb-scoreboard b').allTextContents();
  assert.deepEqual(scoreText.map(text => Number.parseInt(text)), expected.scores);
  const title = await page.locator('main h1').innerText();
  assert.equal(title === 'Pareggio!', expected.winner === null);
  assert.equal(await page.locator('.mb-merge img').count(), 2);
  await page.getByText('Perché questo risultato?', { exact: true }).click();
  assert.equal(await page.locator('.comparison tbody tr').count(), config.activeAxes.length);
  await page.getByText('Perché questo risultato?', { exact: true }).click();
  battles++;
}

try {
  for (const [device, viewport] of Object.entries({ desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } })) {
    if (process.env.TEST_DEVICE && process.env.TEST_DEVICE !== device) continue;
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    let activeConfig = structuredClone(DEFAULT_CONFIG);
    // Deterministic config only; all components, state transitions and scoring are real.
    await mockGameConfiguration(page, () => ({ mergeBattle: activeConfig }));
    await page.addInitScript(() => { Math.random = () => 0; });
    for (const mode of ['local', 'solo']) {
      await openGame(page, origin, '/merge-battle');
      await checkScreen(page, 'intro', mode === 'local' ? `${device}-intro` : '');
      await page.getByRole('button', { name: mode === 'local' ? /Gioca in due/ : /Gioca da solo/ }).click();
      await checkScreen(page, 'character1', mode === 'local' ? `${device}-cast` : '');
      assert.equal(await page.locator('.mb-character').count(), 12);
      for (const image of await page.locator('.mb-character img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(node => node.decode());
        assert.ok(await image.evaluate(node => node.naturalWidth > 0));
      }
      assert.match(await page.getByRole('button', { name: 'Platform Engineer', exact: true }).locator('img').getAttribute('src'), /platform.webp$/);
      assert.match(await page.getByRole('button', { name: /Site Reliability Engineer/ }).locator('img').getAttribute('src'), /sre.webp$/);
      const first = page.getByRole('button', { name: 'Frontend Developer', exact: true });
      await first.focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Conferma personaggio', exact: true }).click();
      if (mode === 'local') {
        assert.equal(await first.isDisabled(), true);
        await chooseCharacter(page, 'Backend Developer');
      }
      for (let round = 0; round < 8; round++) {
        await checkScreen(page, 'brief', round === 0 ? `${device}-${mode}-brief` : '');
        await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
        await checkScreen(page, 'move1', round === 0 ? `${device}-${mode}-moves` : '');
        assert.equal(await page.locator('.mb-card').count(), 3);
        assert.equal(await page.locator('.card-values b').count(), activeConfig.activeAxes.length * 3);
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('.mb-card').first().evaluate(node => document.activeElement === node), true);
        const accessibleStats = await page.locator('.mb-card').first().evaluate(node =>
          document.getElementById(node.getAttribute('aria-describedby')).textContent
        );
        for (const [index, axis] of AXES.entries()) assert.equal(accessibleStats.includes(axis), activeConfig.activeAxes.includes(index));
        const playerMove = round % 3;
        const opponentMove = mode === 'local' ? (round === 0 ? 0 : (round + 1) % 3) : (round + round) % 3;
        const moves = [activeConfig.assignments[0][playerMove], activeConfig.assignments[1][opponentMove]];
        const secret = activeConfig.cards.find(card => card.id === moves[0]).name;
        await page.locator('.mb-card').nth(playerMove).click();
        if (mode === 'local') {
          await checkScreen(page, 'handoff', round === 0 ? `${device}-handoff` : '');
          assert.ok(!(await page.locator('main').innerText()).includes(secret));
          assert.equal(await page.locator('.mb-card').count(), 0);
          await page.getByRole('button', { name: 'Sono Player 2', exact: true }).click();
          assert.ok(!(await page.locator('main').innerText()).includes(secret));
          await page.locator('.mb-card').nth(opponentMove).click();
        }
        await page.locator('.mb-verdict').waitFor();
        assert.equal(await page.locator('.played-card').first().evaluate(node => getComputedStyle(node).animationName), 'none');
        await checkScreen(page, 'battle', round === 0 ? `${device}-${mode}-arena` : '');
        await finishBattle(page, [0, 1], moves, round, activeConfig);
        await checkScreen(page, 'result', round === 0 ? `${device}-${mode}-result` : '', false);
        if (round < 7) await page.getByRole('button', { name: 'Rivincita!', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Cambia personaggi', exact: true }).click();
      await checkScreen(page, 'character1', '');
      await page.getByRole('button', { name: '← Cambia modalità', exact: true }).click();
      await checkScreen(page, 'intro', '');
      console.log(`${device} ${mode}: all 8 scenarios, scores, draws, rematch, hidden handoff, focus PASS`);
    }

    // Admin-configured subsets, long user-authored cards and optional descriptions.
    activeConfig.characters = [3, 10];
    activeConfig.judges = [6];
    const longCard = activeConfig.cards.find(card => card.id === activeConfig.assignments[3][0]);
    longCard.name = 'M'.repeat(80);
    longCard.description = 'Dettagli personalizzati. '.repeat(20);
    await openGame(page, origin, '/merge-battle');
    await page.getByRole('button', { name: /Gioca da solo/ }).click();
    assert.equal(await page.locator('.mb-character').count(), 2);
    await chooseCharacter(page, 'Platform Engineer');
    await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
    await page.getByText('Dettagli della mossa', { exact: true }).click();
    await checkScreen(page, 'move1', `${device}-custom`, false);
    await page.locator('.mb-card').first().click();
    await finishBattle(page, [3, 10], [activeConfig.assignments[3][0], activeConfig.assignments[10][0]], 6, activeConfig);
    await checkScreen(page, 'result', '', false);
    console.log(`${device}: custom roles, long card, description, correct bot and result PASS`);

    // At 320px the same real UI remains usable.
    await page.setViewportSize({ width: 320, height: 720 });
    await page.getByRole('button', { name: '← Cambia modalità', exact: true }).click();
    await checkScreen(page, 'intro', `${device}-320-intro`);
    await page.getByRole('button', { name: /Gioca da solo/ }).click();
    await checkScreen(page, 'character1', `${device}-320-cast`);
    await chooseCharacter(page, 'Platform Engineer');
    await checkScreen(page, 'brief', `${device}-320-brief`);
    await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
    await checkScreen(page, 'move1', `${device}-320-moves`);
    await page.locator('.mb-card').first().click();
    await page.locator('.mb-verdict').waitFor();
    await checkScreen(page, 'battle', `${device}-320-arena`);
    await finishBattle(page, [3, 10], [activeConfig.assignments[3][0], activeConfig.assignments[10][0]], 6, activeConfig);
    await checkScreen(page, 'result', `${device}-320-result`, false);
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await mockGameConfiguration(page);
  await openGame(page, origin, '/merge-battle');
  await page.getByRole('button', { name: /Gioca da solo/ }).click();
  await chooseCharacter(page, 'Security Engineer');
  await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
  await page.locator('.mb-card').first().click();
  await page.locator('.mb-count').waitFor();
  assert.equal(await page.locator('.played-card').count(), 0);
  await page.locator('.mb-action').waitFor();
  assert.equal(await page.locator('.played-card').count(), 2);
  assert.match(await page.locator('.played-card').first().evaluate(node => getComputedStyle(node).animationName), /collide/);
  await page.getByRole('button', { name: 'Scopri il merge', exact: true }).click();
  await page.getByRole('button', { name: 'Rivincita!', exact: true }).click();
  await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
  await page.locator('.mb-card').first().click();
  await page.getByRole('link', { name: /Torna al Game Center/ }).click();
  await page.locator('.mb-arena').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.mb-arena').count(), 0);
  await context.close();
  assert.deepEqual(errors, []);
  console.log(`${battles} deterministic battles; normal animation and mid-battle navigation cleanup PASS`);
} finally {
  await browser.close();
}
