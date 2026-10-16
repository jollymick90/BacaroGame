import { error, type RequestHandler } from '@sveltejs/kit';
import { firebaseAdmin } from '$lib/firebase/firebase-admin.server';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import { canonicalPokemon, membersCollection, validateRegistration, PUBLIC_CONSENT_VERSION } from '$lib/server/members';
import { EMBEDDING_MODEL } from '$lib/types';
export const POST: RequestHandler = async event => {
  sameOrigin(event); const user = requireUser(event);
  const data = validateRegistration(await body(event));
  const pokemon = await canonicalPokemon(data.pokemonId, event.fetch);
  const { db } = firebaseAdmin();
  await db.runTransaction(async tx => {
    const ref = membersCollection().doc(user.uid);
    const existing = await tx.get(ref);
    if (existing.exists) error(409, 'Hai già una registrazione. Eliminala prima di registrarti di nuovo.');
    const count = await tx.get(membersCollection().limit(200));
    if (count.size >= 200) error(409, 'La demo può ospitare al massimo 200 Bacari.');
    tx.create(ref, { name: data.name, pokemon, embedding: data.embedding, model: EMBEDDING_MODEL, createdAt: Date.now(), consentVersion: PUBLIC_CONSENT_VERSION, consentAt: Date.now(), captures: {} });
  });
  return privateJson({ registered: true }, 201);
};
export const DELETE: RequestHandler = async event => {
  sameOrigin(event); const user = requireUser(event);
  // UID comes only from the verified session, never from a submitted owner ID.
  await membersCollection().doc(user.uid).delete();
  return privateJson({ deleted: true });
};
