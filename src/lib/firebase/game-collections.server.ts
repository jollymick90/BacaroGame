import { firebaseAdmin } from './firebase-admin.server';
import { approvedCollectionName } from './collections';

/** The only place that opens Firestore collections for this application. */
export function gameCollection(name: string) {
  const approved = approvedCollectionName(name);
  return firebaseAdmin().db.collection(approved);
}

/** Fixed document identifiers only; never accept a path from client input. */
export function gameDocument(name: string, id: 'merge-battle' | 'bug-hunter' | 'superadmins' | 'members-version') {
  const approvedDocument = ['merge-battle', 'bug-hunter', 'superadmins', 'members-version'].includes(id);
  if (name !== 'bacaroGameConfigurations' || !approvedDocument) {
    throw new Error('Documento configurazione non consentito.');
  }
  return gameCollection(name).doc(id);
}

/** Server-generated room codes and hashed rate-limit keys only. */
export function mergeRoomDocument(id: string) {
  if (!/^(room-[a-f0-9]{16}|rate-[a-f0-9]{64})$/.test(id)) {
    throw new Error('Identificatore stanza non valido.');
  }
  return gameCollection('bacaroGameMergeRooms').doc(id);
}
