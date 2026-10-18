import { AsyncLocalStorage } from 'node:async_hooks';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import type { Transaction } from 'firebase-admin/firestore';
import { emulatorMode, firebaseAdmin } from '$lib/firebase/firebase-admin.server';
import { gameDocument } from '$lib/firebase/game-collections.server';
import { GAME_COLLECTIONS } from '$lib/firebase/collections';
import { emailList, isSuperadmin, updateDelegatedAdmins } from './admin-policy';

function roleDocument() {
  return gameDocument(GAME_COLLECTIONS.configurations, 'superadmins');
}

// Reuse one permissions snapshot within a request, never across users/requests.
const accessReads = new AsyncLocalStorage<{ snapshot?: Promise<FirebaseFirestore.DocumentSnapshot> }>();

export function withAccessReadCache<T>(run: () => T): T {
  return accessReads.run({}, run);
}

function readRoles() {
  const context = accessReads.getStore();
  if (!context) {
    return roleDocument().get();
  }
  if (!context.snapshot) {
    context.snapshot = roleDocument().get();
  }
  return context.snapshot;
}

function storedEmails(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const strings = value.filter((email: unknown): email is string => typeof email === 'string');
  return emailList(strings.join(','));
}

function accessState(data: FirebaseFirestore.DocumentData | undefined) {
  const permanent = emailList(env.BACARODEX_SUPERADMIN_EMAILS);
  const configured = emailList(env.BACARODEX_ALLOWED_EMAILS);
  const added = storedEmails(data?.allowedEmails);
  const blocked = storedEmails(data?.blockedEmails);
  const delegated = storedEmails(data?.emails);
  const allowed = [...new Set([...configured, ...added])].filter(email => !blocked.includes(email));
  return { permanent, configured, added, blocked, delegated, allowed };
}

export async function allowed(email: string | undefined, verified: boolean | undefined): Promise<boolean> {
  if (emulatorMode()) {
    return true;
  }
  if (!verified || !email) {
    return false;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (emailList(env.BACARODEX_SUPERADMIN_EMAILS).includes(normalizedEmail)) {
    return true;
  }
  const snapshot = await readRoles();
  return accessState(snapshot.data()).allowed.includes(normalizedEmail);
}

export async function hasSuperadminRole(email: string, transaction?: Transaction): Promise<boolean> {
  const permanent = emailList(env.BACARODEX_SUPERADMIN_EMAILS);
  if (permanent.includes(email.trim().toLowerCase())) {
    return true;
  }
  const reference = roleDocument();
  const snapshot = transaction ? await transaction.get(reference) : await readRoles();
  const state = accessState(snapshot.data());
  return isSuperadmin(email, state.permanent, state.allowed, state.delegated);
}

export async function listSuperadmins(email: string) {
  const snapshot = await readRoles();
  const state = accessState(snapshot.data());
  if (!isSuperadmin(email, state.permanent, state.allowed, state.delegated)) {
    error(403, 'Questa operazione richiede il ruolo superadmin.');
  }
  const emails = [...new Set([
    ...state.permanent,
    ...state.configured,
    ...state.added,
    ...state.blocked,
    ...state.delegated,
  ])].sort();

  return emails.map(candidate => ({
    email: candidate,
    permanent: state.permanent.includes(candidate),
    superadmin: isSuperadmin(candidate, state.permanent, state.allowed, state.delegated),
    eligible: state.permanent.includes(candidate) || state.allowed.includes(candidate),
    delegated: state.delegated.includes(candidate),
  }));
}

export async function changeSuperadmin(actorEmail: string, targetEmail: string, enabled: boolean) {
  await firebaseAdmin().db.runTransaction(async transaction => {
    const reference = roleDocument();
    const snapshot = await transaction.get(reference);
    const state = accessState(snapshot.data());
    if (!isSuperadmin(actorEmail, state.permanent, state.allowed, state.delegated)) {
      error(403, 'Questa operazione richiede il ruolo superadmin.');
    }

    let emails: string[];
    try {
      emails = updateDelegatedAdmins(state.permanent, state.allowed, state.delegated, targetEmail, enabled);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'Modifica del ruolo non valida.';
      error(400, message);
    }
    transaction.set(reference, { ...snapshot.data(), emails, updatedAt: Date.now() });
  });
}

export async function changeMemberAccess(actorEmail: string, targetEmail: string, enabled: boolean) {
  const normalizedEmail = targetEmail.trim().toLowerCase();
  const validEmail = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(normalizedEmail);
  if (!validEmail || normalizedEmail.length > 254) {
    error(400, 'Inserisci un indirizzo email valido.');
  }

  await firebaseAdmin().db.runTransaction(async transaction => {
    const reference = roleDocument();
    const snapshot = await transaction.get(reference);
    const state = accessState(snapshot.data());
    if (!isSuperadmin(actorEmail, state.permanent, state.allowed, state.delegated)) {
      error(403, 'Questa operazione richiede il ruolo superadmin.');
    }
    if (state.permanent.includes(normalizedEmail)) {
      error(400, 'Gli account permanenti si gestiscono nella configurazione del server.');
    }

    const added = state.added.filter(email => email !== normalizedEmail);
    const blocked = state.blocked.filter(email => email !== normalizedEmail);
    let delegated = state.delegated;
    if (enabled) {
      if (!state.configured.includes(normalizedEmail)) {
        added.push(normalizedEmail);
      }
    } else {
      // Remove the role too, so restoring access never silently restores privileges.
      blocked.push(normalizedEmail);
      delegated = delegated.filter(email => email !== normalizedEmail);
      const remainingAdmins = delegated.filter(email => state.allowed.includes(email));
      if (state.permanent.length === 0 && remainingAdmins.length === 0) {
        error(400, 'Non puoi rimuovere l’accesso all’ultimo superadmin.');
      }
    }

    transaction.set(reference, {
      ...snapshot.data(),
      emails: delegated,
      allowedEmails: added.sort(),
      blockedEmails: blocked.sort(),
      updatedAt: Date.now(),
    });
  });
}
