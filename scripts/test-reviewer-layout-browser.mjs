import assert from 'node:assert/strict';
import { mockGameConfiguration, openGame, chooseCharacter } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5197';
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const links = [
  'https://bacarotech.github.io/',
  'https://whatsapp.com/channel/0029Vb62oilIyPtNZRvjI61K',
  'https://www.linkedin.com/company/bacarotech',
  'https://github.com/BacaroTech',
  'https://www.tiktok.com/@bacarotech',
  'https://mastodon.social/@bacarotech',
  'https://www.youtube.com/@Bacarotech',
  'https://www.instagram.com/bacarotechofficial/',
  'https://discord.gg/bnMSXkyy',
  'https://bsky.app/profile/bacarotech.bsky.social',
  'mailto:bacarotech@gmail.com',
];
async function checkFooter(page) {
  const footer = page.getByRole('contentinfo', { name: 'Segui BacaroTech' });
  await footer.waitFor();
  assert.equal(await footer.locator('.social-icon').count(), 10);
  assert.equal(await footer.locator('a').count(), links.length);
  for (const href of links) {
    const link = footer.locator(`a[href="${href}"]`);
    assert.equal(await link.count(), 1);
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.match(await link.getAttribute('rel'), /noopener/);
  }
}
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockGameConfiguration(page);
    await openGame(page, origin, '/merge-battle');
    await checkFooter(page);
    await page.getByRole('button', { name: /Gioca da solo/ }).click();
    await chooseCharacter(page, 'Frontend Developer');
    const reviewer = page.getByRole('region', { name: 'Il reviewer che valuta il tuo lavoro' });
    await reviewer.getByText('Il tuo reviewer', { exact: true }).waitFor();
    await reviewer.getByRole('heading', { name: 'Cosa conta per il reviewer' }).waitFor();
    assert.equal(await reviewer.locator('.weights').count(), 1);
    await reviewer.getByRole('img').evaluate(image => image.decode());
    assert.equal(await page.locator('.criteria').count(), 0);
    await page.screenshot({ path: `/tmp/reviewer-layout-${width}.png`, fullPage: true });
    for (const path of ['/', '/qr', '/bug-hunter', '/bacarodex', '/are-you-an-ai', '/merge-battle/online', '/admin']) {
      await page.goto(origin + path);
      await checkFooter(page);
    }
    await page.getByRole('heading', { name: 'Bacaro membri', exact: true }).waitFor();
    assert.equal(await page.locator('.login-panel .privacy-note, .login-panel .hint, .login-panel .eyebrow').count(), 0);
    await page.screenshot({ path: `/tmp/member-login-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}: reviewer priorities grouped, minimal login, site and ten social/contact icons on all routes`);
    await page.close();
  }
} finally { await browser.close(); }
