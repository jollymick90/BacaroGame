import { dev } from '$app/environment';
import { error, type RequestHandler } from '@sveltejs/kit';
import { allowed, firebaseAdmin } from '$lib/firebase/firebase-admin.server';
import { body, sameOrigin, SESSION_COOKIE, privateJson } from '$lib/server/http';
export const POST: RequestHandler = async event => {
  sameOrigin(event);
  const { idToken } = await body(event);
  if (typeof idToken !== 'string' || idToken.length < 20) error(400, 'Token di accesso mancante.');
  const { auth } = firebaseAdmin();
  let claims;
  try { claims = await auth.verifyIdToken(idToken, true); }
  catch { error(401, 'Accesso non valido. Accedi di nuovo.'); }
  if (Date.now() / 1000 - claims.auth_time > 300) error(401, 'È richiesto un nuovo accesso.');
  if (!allowed(claims.email, claims.email_verified)) error(403, 'Questo account non è nella lista degli amici autorizzati.');
  const expiresIn = 5 * 24 * 60 * 60 * 1000;
  let session;
  try { session = await auth.createSessionCookie(idToken, { expiresIn }); }
  catch { error(503, 'Impossibile creare la sessione. Riprova.'); }
  event.cookies.set(SESSION_COOKIE, session, { path: '/', httpOnly: true, secure: !dev, sameSite: 'lax', maxAge: expiresIn / 1000 });
  return privateJson({ signedIn: true });
};
export const DELETE: RequestHandler = async event => {
  sameOrigin(event);
  event.cookies.delete(SESSION_COOKIE, { path: '/' });
  return privateJson({ signedOut: true });
};
