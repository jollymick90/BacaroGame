import { randomUUID } from 'node:crypto';
import type { QuerySnapshot, Transaction } from 'firebase-admin/firestore';
import { GAME_COLLECTIONS } from '$lib/firebase/collections';
import { gameDocument } from '$lib/firebase/game-collections.server';
import { membersCollection } from './members';
import { createVersionedCache } from './versioned-cache';

const cache = createVersionedCache<QuerySnapshot>(60_000);
const versionDocument = () => gameDocument(GAME_COLLECTIONS.configurations, 'members-version');

export function markMembersChanged(transaction: Transaction) {
  // Commit the version atomically with every member mutation, including legacy captures.
  transaction.set(versionDocument(), { version: randomUUID() });
}

export async function cachedMembers() {
  // Never cache this read: revocations must reach every server instance immediately.
  const snapshot = await versionDocument().get();
  const version = snapshot.data()?.version;
  const load = () => membersCollection().limit(201).get();
  // Existing databases use the initial generation until their first app mutation.
  return cache.get(typeof version === 'string' ? version : 'initial', load);
}
