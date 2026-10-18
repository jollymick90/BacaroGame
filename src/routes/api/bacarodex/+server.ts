import { hasSuperadminRole } from '$lib/server/superadmins';
import type { RequestHandler } from './$types';
import { privateJson, requireUser } from '$lib/server/http';
import { publicMember } from '$lib/server/members';
import { cachedMembers } from '$lib/server/member-cache';
import { EMBEDDING_MODEL, type Capture } from '$lib/types';
export const GET: RequestHandler = async event => {
  const user = requireUser(event);
  const snapshot = await cachedMembers();
  const compatible = snapshot.docs.filter(doc => doc.data().model === EMBEDDING_MODEL);
  const captures: Capture[] = compatible.flatMap(doc => {
    const time = doc.data().captures?.[user.uid];
    return typeof time === 'number' ? [{ memberId: doc.id, capturedAt: time }] : [];
  });
  const superadmin = await hasSuperadminRole(user.email);
  return privateJson({ superadmin, members: compatible.map(doc => publicMember(doc.id, doc.data())), captures });
};
