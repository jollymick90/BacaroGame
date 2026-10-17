import { error, type RequestHandler } from '@sveltejs/kit';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import { changeSuperadmin, listSuperadmins } from '$lib/server/superadmins';

export const GET: RequestHandler = async event => {
  const user = requireUser(event);
  return privateJson({ accounts: await listSuperadmins(user.email) });
};

export const PATCH: RequestHandler = async event => {
  sameOrigin(event);
  const user = requireUser(event);
  const data = await body(event);
  if (typeof data.email !== 'string' || data.email.length > 254 || typeof data.enabled !== 'boolean') {
    error(400, 'Email o ruolo non valido.');
  }
  await changeSuperadmin(user.email, data.email, data.enabled);
  return privateJson({ updated: true });
};
