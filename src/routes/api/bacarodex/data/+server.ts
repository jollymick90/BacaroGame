import { markMembersChanged } from '$lib/server/member-cache';
import type { RequestHandler } from './$types';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { firebaseAdmin } from '$lib/firebase/firebase-admin.server';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import { membersCollection } from '$lib/server/members';
import { error } from '@sveltejs/kit';
export const DELETE: RequestHandler = async event => {
  sameOrigin(event); const user = requireUser(event);
  const { includeRegistration } = await body(event);
  if (typeof includeRegistration !== 'boolean') error(400, 'Opzione di cancellazione non valida.');
  await firebaseAdmin().db.runTransaction(async tx => {
    const records = await tx.get(membersCollection().limit(201));
    for (const record of records.docs) {
      if (includeRegistration && record.id === user.uid) tx.delete(record.ref);
      else if (record.data().captures?.[user.uid] !== undefined) tx.update(record.ref, new FieldPath('captures', user.uid), FieldValue.delete());
    }
    markMembersChanged(tx);
  });
  // Deleting a member document also removes all captures of that member.
  return privateJson({ deleted: true });
};
