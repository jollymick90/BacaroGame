import { firebaseAdmin, firebaseConfigured } from '$lib/firebase/firebase-admin.server';
import { allowed, withAccessReadCache } from '$lib/server/superadmins';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { SESSION_COOKIE } from '$lib/server/http';
import { reportServerError } from '$lib/server/errors';
import type { Handle, HandleServerError } from '@sveltejs/kit';
export const handle: Handle = input => withAccessReadCache(() => handleRequest(input));

const handleRequest: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  const cookie = event.cookies.get(SESSION_COOKIE);
  const path = event.url.pathname;
  const method = event.request.method;
  const publicGameRequest =
    (method === 'GET' && (path === '/api/play' || path === '/api/merge-battle/config' || path === '/api/bug-hunter/config')) ||
    (method === 'POST' && (path === '/api/play/scan' || path === '/api/play/answer'));
  if (!publicGameRequest && cookie && firebaseConfigured()) {
    let claims: DecodedIdToken | null = null;
    try {
      claims = await firebaseAdmin().auth.verifySessionCookie(cookie, true);
    } catch {
      event.cookies.delete(SESSION_COOKIE, { path: '/' });
    }
    // Keep database failures outside the invalid-cookie catch: an unavailable
    // access list must not silently log out a valid session.
    if (claims) {
      const authorized = await allowed(claims.email, claims.email_verified);
      if (authorized) {
        event.locals.user = {
          uid: claims.uid,
          name: claims.name || claims.email || 'Bacaro',
          email: claims.email || '',
        };
      } else {
        event.cookies.delete(SESSION_COOKIE, { path: '/' });
      }
    }
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
export const handleError: HandleServerError = reportServerError;
