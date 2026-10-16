import { error, type RequestHandler } from '@sveltejs/kit';
import { body, privateJson, sameOrigin } from '$lib/server/http';
import { openAttempt } from '$lib/server/game';
import { membersCollection, PUBLIC_CONSENT_VERSION } from '$lib/server/members';
export const POST: RequestHandler = async event => {
  sameOrigin(event); const data = await body(event);
  const attempt = openAttempt(data.token);
  if(!Number.isInteger(data.pokemonId) || !attempt.choices.includes(data.pokemonId as number)) error(400,'Scelta non valida.');
  const record = await membersCollection().doc(attempt.memberId).get();
  if(!record.exists || record.data()!.consentVersion !== PUBLIC_CONSENT_VERSION || record.data()!.createdAt !== attempt.createdAt) error(410,'Il membro non partecipa più a questo tentativo. Scansiona di nuovo.');
  if(data.pokemonId !== attempt.pokemonId) return privateJson({ correct: false });
  return privateJson({ correct: true, capture: { memberId: record.id, name: record.data()!.name, pokemon: record.data()!.pokemon, capturedAt: Date.now() } });
};
