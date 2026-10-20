import type { RequestHandler } from './$types';
import type { GameCenterConfiguration } from '$lib/game-center/configuration';
import { DEFAULT_QUESTIONS } from '$lib/games/bug-hunter/questions';
import { getBugHunterConfiguration } from '$lib/server/bug-hunter-configuration';
import { getMergeConfiguration } from '$lib/server/merge-configuration';
import { gameConfigured } from '$lib/server/game';
import { privateJson } from '$lib/server/http';
import { reportServerError } from '$lib/server/errors';

export const GET: RequestHandler = async event => {
  const [merge, hunter] = await Promise.allSettled([
    getMergeConfiguration(),
    getBugHunterConfiguration(),
  ]);
  let mergeError: string | null = null;
  if (merge.status === 'rejected') {
    mergeError = reportServerError({ error: merge.reason, status: 503, event }).message;
  }
  if (hunter.status === 'rejected') {
    // As before, built-in questions keep Bug Hunter playable during an outage.
    reportServerError({ error: hunter.reason, status: 503, event });
  }
  const configuration: GameCenterConfiguration = {
    configured: gameConfigured(),
    mergeBattle: merge.status === 'fulfilled' ? merge.value.config : null,
    mergeError,
    bugHunter: hunter.status === 'fulfilled' ? hunter.value.config : { questions: DEFAULT_QUESTIONS },
  };
  return privateJson(configuration);
};
