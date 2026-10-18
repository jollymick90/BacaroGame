import { markMembersChanged } from '$lib/server/member-cache';
import { error, type RequestHandler } from '@sveltejs/kit';
import { firebaseAdmin } from '$lib/firebase/firebase-admin.server';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import {
  canonicalPokemon,
  membersCollection,
  validateRegistration,
  validId,
  PUBLIC_CONSENT_VERSION,
} from '$lib/server/members';
import { canDeleteMember, registrationMode } from '$lib/server/admin-policy';
import { hasSuperadminRole } from '$lib/server/superadmins';
import { EMBEDDING_MODEL } from '$lib/types';

export const POST: RequestHandler = async event => {
  sameOrigin(event);
  const user = requireUser(event);
  const input = await body(event);
  const data = validateRegistration(input);
  let superadmin = false;
  if (input.mode === 'other') {
    superadmin = await hasSuperadminRole(user.email);
    if (!superadmin) {
      error(403, 'Solo un superadmin può registrare altre persone.');
    }
  }
  let mode: 'self' | 'other';
  try {
    mode = registrationMode(input.mode, superadmin, input.otherConsent);
  } catch (failure) {
    const message = failure instanceof Error ? failure.message : 'Registrazione non valida.';
    error(400, message);
  }


  const pokemon = await canonicalPokemon(data.pokemonId, event.fetch);
  const selfReference = membersCollection().doc(user.uid);
  // Allocate once so transaction retries keep the same registration ID.
  const otherReference = membersCollection().doc();

  await firebaseAdmin().db.runTransaction(async transaction => {
    // Recheck inside the write transaction so concurrent revocations take effect.
    if (mode === 'other' && !await hasSuperadminRole(user.email, transaction)) {
      error(403, 'Solo un superadmin può registrare altre persone.');
    }

    const reference = mode === 'self' ? selfReference : otherReference;
    const existing = await transaction.get(reference);
    if (existing.exists) {
      error(409, 'Hai già una registrazione. Eliminala prima di registrarti di nuovo.');
    }
    const count = await transaction.get(membersCollection().limit(200).count());
    if (count.data().count >= 200) {
      error(409, 'La demo può ospitare al massimo 200 Bacari.');
    }
    const now = Date.now();
    transaction.create(reference, {
      name: data.name,
      pokemon,
      embedding: data.embedding,
      model: EMBEDDING_MODEL,
      createdAt: now,
      createdBy: user.uid,
      consentVersion: PUBLIC_CONSENT_VERSION,
      consentAt: now,
      consentMode: mode,
      consentRecordedBy: user.uid,
      captures: {},
    });
    markMembersChanged(transaction);
  });
  return privateJson({ registered: true }, 201);
};

export const DELETE: RequestHandler = async event => {
  sameOrigin(event);
  const user = requireUser(event);
  // Existing clients without a body still delete their own registration.
  const input = event.request.body ? await body(event) : {};
  const memberId = input.memberId ?? user.uid;
  if (!validId(memberId)) {
    error(400, 'Registrazione non valida.');
  }

  await firebaseAdmin().db.runTransaction(async transaction => {
    let superadmin = false;
    if (memberId !== user.uid) {
      superadmin = await hasSuperadminRole(user.email, transaction);
    }
    if (!canDeleteMember(memberId, user.uid, superadmin)) {
      error(403, 'Puoi eliminare solo la tua registrazione.');
    }
    transaction.delete(membersCollection().doc(memberId));
    markMembersChanged(transaction);
  });
  return privateJson({ deleted: true });
};
