import { DEFAULT_CONFIG } from '../src/lib/games/merge-battle/config.ts';
import { DEFAULT_QUESTIONS } from '../src/lib/games/bug-hunter/questions.ts';

export async function mockGameConfiguration(page, overrides = () => ({})) {
  await page.route('**/api/game-center/config', route => route.fulfill({ json: {
    configured: true,
    mergeBattle: DEFAULT_CONFIG,
    mergeError: null,
    bugHunter: { questions: DEFAULT_QUESTIONS },
    ...overrides(),
  } }));
}

export async function openGame(page, origin, path) {
  // Enter via client navigation so fixtures intercept load's fetch; initial SSR
  // requests are deliberately covered separately with the real backend.
  await page.goto(`${origin}/qr`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('link', { name: '← Torna al Game Center', exact: true }).click();
  await page.locator(`a.play-link[href="${path}"]`).click();
  await page.waitForURL(`${origin}${path}`);
}
