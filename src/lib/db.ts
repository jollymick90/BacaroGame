// IndexedDB is now only a non-personal Pokémon cache. Legacy v1 records are
// deliberately left untouched and never uploaded without the new consent.
export type { Pokemon, Member, Capture } from './types';
let connection: Promise<IDBDatabase> | undefined;
function db() {
  return connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('bacarodex-pokemon-cache', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('cache');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { connection = undefined; reject(new Error('Cache locale non disponibile.')); };
  });
}
export async function cached<T>(key: string): Promise<T | undefined> {
  try {
    const d = await db();
    return await new Promise<T | undefined>((resolve, reject) => {
      const r = d.transaction('cache').objectStore('cache').get(key);
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
  } catch { return undefined; }
}
export async function cacheWrite(key: string, value: unknown) {
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction('cache', 'readwrite'); tx.objectStore('cache').put(value, key);
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error);
    });
  } catch { /* Optional cache must not prevent registration/gameplay. */ }
}
