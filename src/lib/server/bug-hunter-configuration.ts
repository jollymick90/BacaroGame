import { GAME_COLLECTIONS } from '$lib/firebase/collections';
import { firebaseConfigured } from '$lib/firebase/firebase-admin.server';
import { gameDocument } from '$lib/firebase/game-collections.server';
import { DEFAULT_QUESTIONS, validateQuestionConfig } from '$lib/games/bug-hunter/questions';
import { createTtlCache } from './ttl-cache';
import { withConfigurationTimeout } from './configuration-timeout';

export function bugHunterConfigDocument() {
  return gameDocument(GAME_COLLECTIONS.configurations, 'bug-hunter');
}

export function readRevision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value >= Number.MAX_SAFE_INTEGER) {
    throw new Error('Revisione della configurazione Bug Hunter non valida.');
  }
  return value;
}

export async function readBugHunterConfiguration() {
  const defaults = { config: { questions: DEFAULT_QUESTIONS }, revision: 0, persisted: false };
  if (!firebaseConfigured()) {
    return defaults;
  }
  const snapshot = await bugHunterConfigDocument().get();
  if (!snapshot.exists) {
    return defaults;
  }
  const data = snapshot.data()!;
  return {
    config: validateQuestionConfig(data.config),
    revision: readRevision(data.revision),
    persisted: true,
  };
}

export const bugHunterConfigurationCache = createTtlCache<Awaited<ReturnType<typeof readBugHunterConfiguration>>>(60_000);

export function getBugHunterConfiguration() {
  return bugHunterConfigurationCache.get(() => withConfigurationTimeout(readBugHunterConfiguration));
}
