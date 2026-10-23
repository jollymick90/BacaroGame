import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5197';
const links = {
  WhatsApp: 'https://whatsapp.com/channel/0029Vb62oilIyPtNZRvjI61K',
  LinkedIn: 'https://www.linkedin.com/company/bacarotech',
  GitHub: 'https://github.com/BacaroTech',
  TikTok: 'https://www.tiktok.com/@bacarotech',
  Mastodon: 'https://mastodon.social/@bacarotech',
  YouTube: 'https://www.youtube.com/@Bacarotech',
  Instagram: 'https://www.instagram.com/bacarotechofficial/',
  Discord: 'https://discord.gg/bnMSXkyy',
  Bluesky: 'https://bsky.app/profile/bacarotech.bsky.social',
  Email: 'mailto:bacarotech@gmail.com',
};
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const path of ['/', '/admin', '/merge-battle/online']) {
      await page.goto(origin + path);
      const footer = page.getByRole('contentinfo', { name: 'Segui BacaroTech' });
      await footer.waitFor();
      for (const [name, href] of Object.entries(links)) {
        const link = footer.getByRole('link', { name, exact: true });
        assert.equal(await link.getAttribute('href'), href);
        assert.equal(await link.getAttribute('target'), '_blank');
        assert.match(await link.getAttribute('rel'), /noopener/);
      }
      assert.equal(await footer.locator('.social-icon').count(), 10);
      await page.evaluate(async () => { const image = new Image(); image.src = '/images/social-icons.png'; await image.decode(); });
      if (path === '/admin') await footer.screenshot({ path: `/tmp/social-footer-${width}.png` });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    console.log(`PASS ${width}: supplied icon sprite, ten exact social/contact links and responsive footer`);
    await page.close();
  }
} finally { await browser.close(); }
