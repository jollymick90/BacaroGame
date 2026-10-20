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
  for (const mobile of [false, true]) {
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
    await page.getByRole('heading', { name: question.prompt }).waitFor();
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
    await dialog.getByRole('button', { name: mobile ? 'Un cavo' : 'Un algoritmo', exact: true }).click();
    const expectedHealth = mobile ? 2 : 3;
    await page.getByLabel(`${expectedHealth} possibilità rimaste`).waitFor();
    assert.equal(await dialog.locator('.answers button:disabled').count(), 3);
    assert.match(await dialog.getByRole('status').innerText(), mobile ? /Nessuna vita persa/ : /Una vita recuperata/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (mobile) {
      // Escape from feedback must close the quiz but keep the run paused.
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      await page.getByRole('button', { name: 'Riprendi', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Riprendi', exact: true }).click();
    } else {
      await dialog.getByRole('button', { name: 'Continua la corsa' }).click();
      await dialog.waitFor({ state: 'detached' });
    }
    await page.getByRole('button', { name: 'Salta', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Pausa', exact: true }).click();
    await page.getByRole('link', { name: 'Torna al Game Center', exact: true }).click();
    await page.locator('.bh-stage canvas').waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    console.log(`${mobile ? 'Mobile' : 'Desktop'}: real heart pickup, frozen quiz, focus trap, ${mobile ? 'wrong answer/Escape' : 'heal/continue'}, cleanup PASS`);
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
