import { firebaseAdmin } from './firebase-admin.server';
import { approvedCollectionName } from './collections';

/** The only place that opens Firestore collections for this application. */
export function gameCollection(name: string) {
  const approved = approvedCollectionName(name);
  return firebaseAdmin().db.collection(approved);
}

/** Fixed document identifiers only; never accept a path from client input. */
export function gameDocument(name: string, id: 'merge-battle' | 'superadmins' | 'members-version') {
  const approvedDocument = ['merge-battle', 'superadmins', 'members-version'].includes(id);
  if (name !== 'bacaroGameConfigurations' || !approvedDocument) {
    throw new Error('Documento configurazione non consentito.');
  }
  return gameCollection(name).doc(id);
}
