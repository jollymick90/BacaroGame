import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import type { Transaction } from 'firebase-admin/firestore';
import { firebaseAdmin } from '$lib/firebase/firebase-admin.server';
import { gameDocument } from '$lib/firebase/game-collections.server';
import { GAME_COLLECTIONS } from '$lib/firebase/collections';
import { emailList, isSuperadmin, updateDelegatedAdmins } from './admin-policy';

function roleDocument() {
  return gameDocument(GAME_COLLECTIONS.configurations, 'superadmins');
}

function delegatedEmails(data: FirebaseFirestore.DocumentData | undefined): string[] {
  if (!Array.isArray(data?.emails)) {
    return [];
  }
  return data.emails.filter((email: unknown): email is string => typeof email === 'string');
}

export async function hasSuperadminRole(email: string, transaction?: Transaction): Promise<boolean> {
  const permanent = emailList(env.BACARODEX_SUPERADMIN_EMAILS);
  if (permanent.includes(email.trim().toLowerCase())) {
    return true;
  }
  const reference = roleDocument();
  const snapshot = transaction ? await transaction.get(reference) : await reference.get();
  return isSuperadmin(email, permanent, emailList(env.BACARODEX_ALLOWED_EMAILS), delegatedEmails(snapshot.data()));
}

export async function listSuperadmins(email: string) {
  const snapshot = await roleDocument().get();
  const permanent = emailList(env.BACARODEX_SUPERADMIN_EMAILS);
  const allowed = emailList(env.BACARODEX_ALLOWED_EMAILS);
  const delegated = delegatedEmails(snapshot.data());
  if (!isSuperadmin(email, permanent, allowed, delegated)) {
    error(403, 'Questa operazione richiede il ruolo superadmin.');
  }
  const emails = [...new Set([...permanent, ...allowed, ...delegated])].sort();
  return emails.map(candidate => ({
    email: candidate,
    permanent: permanent.includes(candidate),
    superadmin: isSuperadmin(candidate, permanent, allowed, delegated),
    eligible: permanent.includes(candidate) || allowed.includes(candidate),
    delegated: delegated.includes(candidate),
  }));
}

export async function changeSuperadmin(actorEmail: string, targetEmail: string, enabled: boolean) {
  await firebaseAdmin().db.runTransaction(async transaction => {
    const reference = roleDocument();
    const snapshot = await transaction.get(reference);
    const permanent = emailList(env.BACARODEX_SUPERADMIN_EMAILS);
    const allowed = emailList(env.BACARODEX_ALLOWED_EMAILS);
    const delegated = delegatedEmails(snapshot.data());
    if (!isSuperadmin(actorEmail, permanent, allowed, delegated)) {
      error(403, 'Questa operazione richiede il ruolo superadmin.');
    }

    let emails: string[];
    try {
      emails = updateDelegatedAdmins(permanent, allowed, delegated, targetEmail, enabled);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'Modifica del ruolo non valida.';
      error(400, message);
    }
    transaction.set(reference, { emails, updatedAt: Date.now() });
  });
}
