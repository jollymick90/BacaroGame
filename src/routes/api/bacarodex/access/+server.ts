import { error, type RequestHandler } from '@sveltejs/kit';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import { changeMemberAccess } from '$lib/server/superadmins';

export const PATCH: RequestHandler = async event => {
  sameOrigin(event);
  const user = requireUser(event);
  const data = await body(event);
  if (typeof data.email !== 'string' || typeof data.enabled !== 'boolean') {
    error(400, 'Email o opzione di accesso non valida.');
  }
  await changeMemberAccess(user.email, data.email, data.enabled);
  return privateJson({ updated: true });
};
