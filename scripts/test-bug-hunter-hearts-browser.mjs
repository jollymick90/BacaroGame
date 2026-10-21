import { mockGameConfiguration, openGame } from './game-center-browser-helpers.mjs';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const question = {
  id: 'browser-algoritmo',
  prompt: 'Una sequenza di passi per risolvere un problema è…',
  answers: ['Un algoritmo', 'Un cavo', 'Un monitor'],
  correctIndex: 0,
  explanation: 'Un algoritmo descrive i passi da seguire.',
};
try {
  for (const scenario of ['desktop', 'mobile', 'background']) {
    const mobile = scenario !== 'desktop';
    const page = await browser.newPage({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: mobile ? 'reduce' : 'no-preference',
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Fix course lanes while running the real scene, physics and keyboard/touch controls.
    await page.addInitScript(() => { Math.random = () => 0.5; });
    await mockGameConfiguration(page, () => ({ bugHunter: { questions: [question] } }));
    await openGame(page, origin, '/bug-hunter');
    await page.getByRole('button', { name: 'Inizia', exact: true }).click();
    await page.getByRole('button', { name: 'Spostati a sinistra' }).click();
    await page.getByLabel('2 possibilità rimaste').waitFor({ timeout: 30000 });
    await page.getByRole('button', { name: 'Spostati a destra' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 60000 });
    await page.getByRole('heading', { name: question.prompt }).waitFor().catch(async error => {
      console.error('Unexpected quiz content:', await dialog.innerText());
      throw error;
    });
    const frozenHud = await page.locator('.bh-hud').innerText();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.bh-hud').innerText(), frozenHud);
    for (let index = 0; index < 6; index++) {
      await page.keyboard.press('Tab');
      // Native dialogs may let Tab visit browser chrome (activeElement = body),
      // but background page controls must remain inert.
      assert.equal(await page.evaluate(() =>
        document.activeElement === document.body || !!document.activeElement?.closest('dialog'),
      ), true);
    }
    await page.screenshot({ path: `/tmp/bug-heart-${mobile ? 'mobile' : 'desktop'}.png` });
    if (scenario === 'background') {
      await page.keyboard.press('F8');
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
        delete document.hidden;
      });
      await dialog.locator('#heart-title').waitFor();
      await dialog.getByRole('button', { name: /DEV · Sblocca frame/ }).click();
      await dialog.waitFor({ state: 'detached' });
      await page.getByRole('button', { name: 'Riprendi', exact: true }).waitFor();
      await page.waitForTimeout(500);
      assert.equal(await dialog.count(), 0, 'unanswered quiz does not reopen after thaw');
      await page.close();
      console.log('Frozen unanswered quiz: background preserves frame, thaw leaves paused without reopening PASS');
      continue;
    }
    await dialog.getByRole('button', { name: mobile ? 'Un cavo' : 'Un algoritmo', exact: true }).click();
    const expectedHealth = mobile ? 2 : 3;
    await page.getByLabel(`${expectedHealth} possibilità rimaste`).waitFor();
    if (mobile) {
      assert.equal(await dialog.locator('.answers button:disabled').count(), 3);
      assert.match(await dialog.locator('.feedback').innerText(), /Nessuna vita persa/);
    } else {
      await dialog.getByText('La corsa riparte tra 3', { exact: false }).waitFor({ timeout: 2000 });
      assert.match(await dialog.locator('.feedback').innerText(), /Una vita recuperata/);
      await page.keyboard.press('F8');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1200);
      await dialog.getByText('La corsa riparte tra 3', { exact: false }).waitFor();
      await dialog.getByRole('button', { name: /DEV · Sblocca frame/ }).click();
      assert.equal(await page.getByRole('heading', { name: 'In pausa.' }).count(), 0);
      await dialog.getByText('La corsa riparte tra 2', { exact: false }).waitFor();
      assert.equal(await dialog.locator('.feedback').evaluate(element => getComputedStyle(element).opacity), '0');
      await dialog.getByText('La corsa riparte tra 1', { exact: false }).waitFor();
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (mobile) {
      // Escape from feedback must close the quiz but keep the run paused.
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      await page.getByRole('button', { name: 'Riprendi', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Riprendi', exact: true }).click();
    } else {
      await dialog.waitFor({ state: 'detached', timeout: 2500 });
    }
    await page.getByRole('button', { name: 'Salta', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Pausa', exact: true }).click();
    await page.getByRole('link', { name: 'Torna al Game Center', exact: true }).click();
    await page.locator('.bh-stage canvas').waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    console.log(`${mobile ? 'Mobile' : 'Desktop'}: real heart pickup, frozen quiz, focus trap, ${mobile ? 'wrong answer/Escape' : 'heal/countdown/automatic resume'}, cleanup PASS`);
    await page.close();
  }
  const offline = await browser.newPage();
  await mockGameConfiguration(offline);
  await openGame(offline, origin, '/bug-hunter');
  await offline.getByRole('button', { name: 'Inizia', exact: true }).click();
  await offline.getByRole('button', { name: 'Salta', exact: true }).waitFor();
  await offline.close();
  console.log('Built-in question configuration: game playable PASS (server fallback covered by API test)');
} finally {
  await browser.close();
}
