import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome' });

try {
  for (const scenario of ['success', 'reduced-motion', 'landscape', 'escape', 'hidden', 'unmount']) {
    const page = await browser.newPage({
      viewport: scenario === 'landscape' ? { width: 667, height: 375 } : { width: 390, height: 844 },
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/qr`);
    await page.clock.install();
    await page.evaluate(async () => {
      const path = '/src/lib/games/bug-hunter/HeartQuestion.svelte';
      const source = await (await fetch(path)).text();
      const runtimePath = source.match(/from "([^"]+\/svelte\.js[^\"]*)"/)[1];
      const { mount, unmount } = await import(runtimePath);
      const { default: HeartQuestion } = await import(path);
      const host = document.createElement('div');
      document.body.append(host);
      const state = { answers: [], continued: 0, skipped: 0 };
      const instance = mount(HeartQuestion, {
        target: host,
        props: {
          question: {
            id: 'countdown', prompt: 'Quale risposta è corretta?',
            answers: ['Questa', 'Non questa', 'Neppure questa'], correctIndex: 0,
            explanation: 'Una vita recuperata senza interrompere il ritmo della corsa.',
          },
          onanswer: correct => state.answers.push(correct),
          oncontinue: () => state.continued++,
          onskip: () => state.skipped++,
        },
      });
      window.heartTest = { state, dispose: () => unmount(instance) };
    });
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Questa', exact: true }).click();
    await dialog.getByText('La corsa riparte tra 3', { exact: false }).waitFor();
    if (scenario === 'landscape' || scenario === 'success') {
      const bounds = await dialog.getByRole('button', { name: 'Resta in pausa' }).boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= page.viewportSize().height);
      await page.screenshot({ path: `/tmp/bug-heart-countdown-${scenario}.png` });
    }
    if (scenario === 'escape') await page.keyboard.press('Escape');
    if (scenario === 'hidden') {
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    if (scenario === 'unmount') await page.evaluate(() => window.heartTest.dispose());
    await page.clock.runFor(2000);
    assert.equal(await page.evaluate(() => window.heartTest.state.continued), 0);
    if (['success', 'reduced-motion', 'landscape'].includes(scenario)) {
      assert.equal(await dialog.locator('.success-feedback').evaluate(element => getComputedStyle(element).visibility), 'hidden');
    }
    await page.clock.runFor(2000);
    const state = await page.evaluate(() => window.heartTest.state);
    assert.deepEqual(state.answers, [true], 'heal callback fires once');
    assert.equal(state.continued, ['success', 'reduced-motion', 'landscape'].includes(scenario) ? 1 : 0);
    assert.equal(state.skipped, ['escape', 'hidden'].includes(scenario) ? 1 : 0);
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Heart countdown: ${scenario} PASS`);
  }
} finally {
  await browser.close();
}
