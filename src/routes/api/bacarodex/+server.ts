import type { RequestHandler } from './$types';
import { privateJson, requireUser } from '$lib/server/http';
import { membersCollection, publicMember } from '$lib/server/members';
import { EMBEDDING_MODEL, type Capture } from '$lib/types';
export const GET: RequestHandler = async event => {
  const user = requireUser(event);
  const snapshot = await membersCollection().limit(201).get();
  const compatible = snapshot.docs.filter(doc => doc.data().model === EMBEDDING_MODEL);
  const captures: Capture[] = compatible.flatMap(doc => {
    const time = doc.data().captures?.[user.uid];
    return typeof time === 'number' ? [{ memberId: doc.id, capturedAt: time }] : [];
  });
  return privateJson({ members: compatible.map(doc => publicMember(doc.id, doc.data())), captures });
};
