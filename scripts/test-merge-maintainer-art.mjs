import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/lib/games/merge-battle/config.ts';
import { trials } from '../src/lib/games/merge-battle/engine.ts';
import { maintainerArt } from '../src/lib/games/merge-battle/maintainer-art.ts';
import { mockGameConfiguration, openGame, chooseCharacter } from './game-center-browser-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const gallery = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  await gallery.goto(`${origin}/qr`);
  const sources = trials.map((trial, id) => ({ name: trial.jury, src: maintainerArt(id) }));
  assert.equal(new Set(sources.map(art => art.src)).size, 8);
  const pixels = await gallery.evaluate(async sources => {
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0;padding:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;background:#17171f;color:white;font-family:sans-serif';
    return Promise.all(sources.map(async ({ name, src }) => {
      const figure = document.createElement('figure');
      figure.style.cssText = 'margin:0;padding:12px;background:#292936;border-radius:12px';
      const image = new Image();
      image.src = src;
      image.style.cssText = 'width:100%;height:340px;object-fit:contain';
      const caption = document.createElement('figcaption');
      caption.textContent = name;
      figure.append(image, caption);
      document.body.append(figure);
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      let opaque = 0;
      for (let offset = 3; offset < data.length; offset += 4) {
        if (data[offset] === 0) transparent++;
        if (data[offset] >= 250) opaque++;
      }
      return { name, transparent, opaque };
    }));
  }, sources);
  for (const art of pixels) {
    assert.ok(art.transparent > 1000, `${art.name}: real transparent background`);
    assert.ok(art.opaque > 1000, `${art.name}: opaque illustration`);
  }
  await gallery.screenshot({ path: '/tmp/maintainers-gallery.png', fullPage: true });
  await gallery.close();
  for (const [width, trial] of [[1280, 0], [390, 4]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await mockGameConfiguration(page, () => ({ mergeBattle: { ...DEFAULT_CONFIG, judges: [trial] } }));
    await openGame(page, origin, '/merge-battle');
    await page.getByRole('button', { name: /Gioca da solo/ }).click();
    await chooseCharacter(page, 'Frontend Developer');
    const portrait = page.getByRole('region', { name: 'Il reviewer che valuta il tuo lavoro' }).getByRole('img');
    assert.equal(await portrait.getAttribute('src'), maintainerArt(trial));
    await portrait.evaluate(image => image.decode());
    await page.screenshot({ path: `/tmp/maintainer-portrait-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Scegli la mossa', exact: true }).click();
    const compact = page.locator('.maintainer-identity img');
    assert.equal(await compact.getAttribute('src'), maintainerArt(trial));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.close();
  }
  console.log('PASS: 8 distinct transparent assets; scenario mapping; desktop/mobile brief and card selection');
} finally { await browser.close(); }
