import { gameDocument } from '$lib/firebase/game-collections.server';
import { GAME_COLLECTIONS } from '$lib/firebase/collections';
import { firebaseConfigured } from '$lib/firebase/firebase-admin.server';
import { createTtlCache } from './ttl-cache';
import { withConfigurationTimeout } from './configuration-timeout';
import { DEFAULT_CONFIG, readConfig } from '$lib/games/merge-battle/config';

export const mergeConfigDocument = () => gameDocument(GAME_COLLECTIONS.configurations, 'merge-battle');

async function loadConfiguration() {
  const snapshot = await mergeConfigDocument().get();
  if (!snapshot.exists) return { config: DEFAULT_CONFIG, revision: 0, persisted: false };
  const data = snapshot.data()!;
  return { config: readConfig(data.config), revision: data.revision, persisted: true };
}

export const mergeConfigurationCache = createTtlCache<Awaited<ReturnType<typeof loadConfiguration>>>(60_000);

export async function getMergeConfiguration() {
  if (!firebaseConfigured()) return { config: DEFAULT_CONFIG, revision: 0, persisted: false };
  return mergeConfigurationCache.get(() => withConfigurationTimeout(loadConfiguration));
}
