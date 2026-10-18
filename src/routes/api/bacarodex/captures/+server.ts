import { markMembersChanged } from '$lib/server/member-cache';
import { error, type RequestHandler } from '@sveltejs/kit';
import { FieldPath } from 'firebase-admin/firestore';
import { firebaseAdmin } from '$lib/firebase/firebase-admin.server';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import { membersCollection, validId } from '$lib/server/members';
export const POST: RequestHandler = async event => {
  sameOrigin(event); const user = requireUser(event);
  const { memberId, pokemonId } = await body(event);
  if (!validId(memberId) || !Number.isInteger(pokemonId)) error(400, 'Cattura non valida.');
  await firebaseAdmin().db.runTransaction(async tx => {
    const ref = membersCollection().doc(memberId); const record = await tx.get(ref);
    if (!record.exists) error(404, 'Il Bacaro è stato eliminato. Aggiorna la lista e scansiona di nuovo.');
    if (record.data()!.pokemon.id !== pokemonId) error(400, 'Risposta errata. Riprova!');
    if (record.data()!.captures?.[user.uid] !== undefined) return;
    tx.update(ref, new FieldPath('captures', user.uid), Date.now());
    markMembersChanged(tx);
  });
  return privateJson({ captured: true });
};
