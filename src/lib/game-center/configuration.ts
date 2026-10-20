import type { MergeConfig } from '$lib/games/merge-battle/config';
import type { QuestionConfig } from '$lib/games/bug-hunter/questions';

/** Public game settings only; never include member or session data. */
export interface GameCenterConfiguration {
  configured: boolean;
  mergeBattle: MergeConfig | null;
  mergeError: string | null;
  bugHunter: QuestionConfig;
}
