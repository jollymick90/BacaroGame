import { createTtlCache } from './ttl-cache.ts';

/** One bounded entry: a new shared version replaces even an unexpired value. */
export function createVersionedCache<T>(ttl: number) {
  let version: string | undefined;
  let cache = createTtlCache<T>(ttl);

  function get(currentVersion: string, load: () => Promise<T>) {
    if (version !== currentVersion) {
      version = currentVersion;
      cache = createTtlCache<T>(ttl);
    }
    return cache.get(load);
  }

  return { get };
}
