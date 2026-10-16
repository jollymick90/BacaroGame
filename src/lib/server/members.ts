import { error } from '@sveltejs/kit';
import { gameCollection } from '$lib/firebase/game-collections.server';
import { GAME_COLLECTIONS } from '$lib/firebase/collections';
import { EMBEDDING_MODEL, type Member, type Pokemon } from '$lib/types';
export const PUBLIC_CONSENT_VERSION = 'public-game-v2';
export const membersCollection = () => gameCollection(GAME_COLLECTIONS.members);
export const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
export function validateRegistration(data: Record<string, unknown>) {
  if (Object.keys(data).some(k => !['name', 'pokemonId', 'embedding', 'consent', 'model'].includes(k))) error(400, 'Campi non consentiti. Non inviare fotografie.');
  if (data.consent !== true) error(400, 'Consenso esplicito obbligatorio.');
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 60) error(400, 'Nome non valido (massimo 60 caratteri).');
  if (!Number.isInteger(data.pokemonId) || (data.pokemonId as number) < 1 || (data.pokemonId as number) > 100000) error(400, 'Pokémon non valido.');
  if (data.model !== EMBEDDING_MODEL) error(400, 'Modello facciale non compatibile. Rifai la registrazione.');
  if (!Array.isArray(data.embedding) || data.embedding.length !== 256 || !data.embedding.every(v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e6) || !data.embedding.some(v => v !== 0)) error(400, 'Descrittore facciale non valido.');
  return { name: data.name.trim(), pokemonId: data.pokemonId as number, embedding: data.embedding as number[] };
}
export async function canonicalPokemon(id: number, fetcher: typeof fetch): Promise<Pokemon> {
  const response = await fetcher(`https://pokeapi.co/api/v2/pokemon/${id}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) error(502, 'Impossibile verificare il Pokémon con PokéAPI. Riprova.');
  const data = await response.json();
  if (data.id !== id || typeof data.name !== 'string') error(502, 'Risposta PokéAPI non valida.');
  const sprite = typeof data.sprites?.front_default === 'string' && data.sprites.front_default.startsWith('https://raw.githubusercontent.com/PokeAPI/sprites/') ? data.sprites.front_default : null;
  return { id, name: data.name, sprite };
}
export function publicMember(id: string, data: FirebaseFirestore.DocumentData): Member {
  return { id, name: data.name, pokemon: data.pokemon, embedding: data.embedding, model: data.model, createdAt: data.createdAt };
}
