import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/lib/games/merge-battle/config.ts';
import { mockGameConfiguration, openGame, chooseCharacter } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const config = structuredClone(DEFAULT_CONFIG);
    config.characters = [0, 1];
    config.judges = [0];
    config.cards.find(card => card.id === config.assignments[0][0]).stats = [6, 6, 0, 0];
    config.cards.find(card => card.id === config.assignments[0][2]).stats = [0, 0, 6, 6];
    config.cards.find(card => card.id === config.assignments[1][0]).stats = [2, 2, 4, 4];
    await mockGameConfiguration(page, () => ({ mergeBattle: config }));
    await openGame(page, origin, '/merge-battle');
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await page.getByText('BacaroTech · Una pausa a Dev Fest', { exact: true }).waitFor();
    assert.equal((await page.locator('body').innerText()).includes('Codemotion'), false);
    assert.equal(await page.locator('.game-card.coming-soon').count(), 2);
    assert.equal(await page.locator('.game-card.coming-soon a').count(), 0);
    assert.equal(await page.locator('.polpo-duel img').count(), 2);
    const cover = page.locator('.game-card').first().locator('canvas');
    await cover.waitFor();
    await page.waitForFunction(() => document.querySelector('.game-card canvas')?.width > 0);
    if (width === 1280) {
      const moving = await cover.screenshot();
      await page.waitForTimeout(400);
      assert.notDeepEqual(await cover.screenshot(), moving, 'Venice cover animates');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(200);
      const still = await cover.screenshot();
      await page.waitForTimeout(300);
      assert.deepEqual(await cover.screenshot(), still, 'Reduced motion keeps the cover still');
    }
    await page.screenshot({ path: `/tmp/devfest-home-${width}.png`, fullPage: true });
    for (const slug of ['bacarodex', 'are-you-an-ai']) {
      await page.goto(`${origin}/${slug}`);
      await page.getByText('Coming soon', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button').count(), 0);
    }
    await openGame(page, origin, '/merge-battle');
    const online = page.getByRole('link', { name: /Gioca online · Due dispositivi/ });
    assert.equal(await online.evaluate(element => element.classList.contains('mode-button') && element.classList.contains('online')), true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const win of [true, false]) {
      await page.getByRole('button', { name: /Gioca da solo/ }).click();
      await page.getByText('Cerca di vincere e di prendere il polpo.', { exact: true }).waitFor();
      await chooseCharacter(page, 'Frontend Developer');
      await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
      await page.locator('.mb-hand .mb-card').nth(win ? 0 : 2).click();
      await page.getByRole('button', { name: 'Scopri il merge', exact: true }).click();
      if (win) {
        await page.getByRole('heading', { name: 'Hai vinto!', exact: true }).waitFor();
        const prize = page.getByRole('region', { name: 'Polpo conquistato' });
        await prize.scrollIntoViewIfNeeded();
        await prize.locator('canvas').waitFor();
        await page.screenshot({ path: `/tmp/devfest-prize-${width}.png`, fullPage: true });
      } else {
        await page.getByRole('heading', { name: 'Hai perso!', exact: true }).waitFor();
        assert.equal(await page.locator('.octopus-prize').count(), 0);
      }
      await page.getByRole('button', { name: 'Cambia modalità', exact: true }).click();
    }
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log(`PASS ${width}: Dev Fest, disabled games and routes, covers, online button, 3D prize only on victory`);
    await page.close();
  }
} finally { await browser.close(); }
