import { cached, cacheWrite, type Pokemon } from './db';
export interface Entry { name: string; url: string }
const pending = new Map<string, Promise<unknown>>();
async function get<T>(key: string, url: string): Promise<T> {
  const old = await cached<T>(key); if (old) return old;
  if (pending.has(key)) return pending.get(key) as Promise<T>;
  const task = (async () => {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error('PokéAPI non raggiungibile. Riprova tra poco.');
    const data = await res.json(); await cacheWrite(key, data); return data as T;
  })();
  pending.set(key, task); try { return await task; } finally { pending.delete(key); }
}
export async function catalog(): Promise<Entry[]> {
  const data = await get<{ results: Entry[] }>('pokemon-list', 'https://pokeapi.co/api/v2/pokemon?limit=2000');
  return data.results;
}
export async function details(name: string): Promise<Pokemon> {
  const p = await get<{ id: number; name: string; sprites: { front_default: string | null } }>('pokemon-' + name, 'https://pokeapi.co/api/v2/pokemon/' + encodeURIComponent(name));
  return { id: p.id, name: p.name, sprite: p.sprites.front_default };
}
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export async function options(correct: Pokemon): Promise<Pokemon[]> {
  const list = await catalog();
  const others = shuffle(list.filter(p => p.name !== correct.name)).slice(0, 3);
  if (others.length !== 3) throw new Error('Catalogo incompleto. Riprova.');
  return shuffle([correct, ...await Promise.all(others.map(p => details(p.name)))]);
}
