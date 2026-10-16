import { allowed, firebaseAdmin, firebaseConfigured } from '$lib/firebase/firebase-admin.server';
import { SESSION_COOKIE } from '$lib/server/http';
import type { Handle, HandleServerError } from '@sveltejs/kit';
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  const cookie = event.cookies.get(SESSION_COOKIE);
  if (cookie && firebaseConfigured()) {
    try {
      const claims = await firebaseAdmin().auth.verifySessionCookie(cookie, true);
      if (allowed(claims.email, claims.email_verified)) event.locals.user = { uid: claims.uid, name: claims.name || claims.email || 'Bacaro', email: claims.email || '' };
      else event.cookies.delete(SESSION_COOKIE, { path: '/' });
    } catch { event.cookies.delete(SESSION_COOKIE, { path: '/' }); }
  }
  const response = await resolve(event);
  if (event.url.pathname.startsWith('/api/') || event.url.pathname === '/' || event.url.pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.append('Vary', 'Cookie');
  }
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
};
// Never log request bodies, face descriptors, tokens or Firebase error payloads.
export const handleError: HandleServerError = () => ({ message: 'Servizio temporaneamente non disponibile. Riprova tra poco.' });
