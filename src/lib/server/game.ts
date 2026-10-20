import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'node:crypto';
import { faceSimilarity, matchDecision, MIN_SIMILARITY, MIN_MARGIN } from './face-match';
import { emulatorMode, firebaseConfigured } from '$lib/firebase/firebase-admin.server';
import { membersCollection, PUBLIC_CONSENT_VERSION, canonicalPokemon } from './members';
import { cachedMembers } from './member-cache';
import { EMBEDDING_MODEL, type Pokemon } from '$lib/types';
export { MIN_SIMILARITY, MIN_MARGIN } from './face-match';
export function gameConfigured() {
  return (
    firebaseConfigured() &&
    Boolean(emulatorMode() || (env.BACARODEX_GAME_SECRET?.length ?? 0) >= 32)
  );
}
export async function playableMembers() {
  const snapshot = await cachedMembers();
  return snapshot.docs
    .filter((doc) => doc.data().consentVersion === PUBLIC_CONSENT_VERSION)
    .slice(0, 200)
    .filter((doc) => doc.data().model === EMBEDDING_MODEL);
}
export function validEmbedding(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 256 &&
    value.every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e6) &&
    value.some((v) => v !== 0)
  );
}
export async function matchPublic(embedding: number[]) {
  const candidates = await playableMembers();
  const ranked = candidates
    .filter((doc) => validEmbedding(doc.data().embedding))
    .map((doc) => ({ doc, score: faceSimilarity(embedding, doc.data().embedding) }))
    .filter((c) => Number.isFinite(c.score))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  const decision = matchDecision(best?.score, second?.score);
  if (decision === 'no-match') {
    const score = best
      ? ` Similarità migliore: ${Math.round(best.score * 100)} su 100; soglia: ${MIN_SIMILARITY * 100}.`
      : '';
    error(422, `Nessun Bacaro sufficientemente simile.${score} Rifai la foto con più luce.`);
  }
  if (decision === 'ambiguous') {
    const gap = Math.max(0, best.score - second.score);
    error(
      422,
      `Corrispondenza ambigua: due registrazioni sono troppo vicine (distacco ${Math.round(gap * 100)} su 100, minimo ${MIN_MARGIN * 100}). Rifai una foto frontale e controlla che la stessa persona non sia registrata due volte.`,
    );
  }
  // Also reject direct-console deletions or a withdrawal during the cached lookup.
  const record = await membersCollection().doc(ranked[0].doc.id).get();
  const current = record.data();
  if (
    !current ||
    current.consentVersion !== PUBLIC_CONSENT_VERSION ||
    current.model !== EMBEDDING_MODEL ||
    current.createdAt !== ranked[0].doc.data().createdAt
  ) {
    error(410, 'Il membro non partecipa più. Scansiona di nuovo.');
  }
  return record;
}
interface Attempt {
  memberId: string;
  pokemonId: number;
  createdAt: number;
  expires: number;
  choices: number[];
}
function key() {
  const secret = emulatorMode()
    ? 'bacarodex-local-emulator-only-secret-v2'
    : env.BACARODEX_GAME_SECRET;
  if (!secret || secret.length < 32)
    error(503, 'Configura BACARODEX_GAME_SECRET (almeno 32 caratteri) sul server.');
  return createHash('sha256').update(secret).digest();
}
export function sealAttempt(
  memberId: string,
  pokemonId: number,
  choices: number[],
  createdAt: number,
) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(
      JSON.stringify({
        memberId,
        pokemonId,
        choices,
        createdAt,
        expires: Date.now() + 5 * 60 * 1000,
      } satisfies Attempt),
    ),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
export function openAttempt(token: unknown): Attempt {
  if (typeof token !== 'string' || token.length > 2000)
    error(400, 'Tentativo non valido. Scansiona di nuovo.');
  const secret = key();
  try {
    const bytes = Buffer.from(token, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', secret, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const result = JSON.parse(
      Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString(),
    ) as Attempt;
    if (!result.memberId || result.expires < Date.now() || !Array.isArray(result.choices))
      throw new Error();
    return result;
  } catch {
    error(400, 'Tentativo scaduto o non valido. Scansiona di nuovo.');
  }
}
export async function quizOptions(correct: Pokemon, fetcher: typeof fetch) {
  const ids = new Set<number>();
  while (ids.size < 3) {
    const id = randomInt(1, 152);
    if (id !== correct.id) ids.add(id);
  }
  const choices = [
    correct,
    ...(await Promise.all([...ids].map((id) => canonicalPokemon(id, fetcher)))),
  ];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
