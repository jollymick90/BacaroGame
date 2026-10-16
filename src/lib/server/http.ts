import { error, json, type RequestEvent } from '@sveltejs/kit';
export const SESSION_COOKIE = 'bacarodex_session';
export function requireUser(event: RequestEvent) {
  if (!event.locals.user) error(401, 'Accedi per usare il Bacarodex condiviso.');
  return event.locals.user;
}
export function sameOrigin(event: RequestEvent) {
  if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Origine della richiesta non consentita.');
}
export async function body(event: RequestEvent, limit = 20000): Promise<Record<string, unknown>> {
  if (!event.request.headers.get('content-type')?.startsWith('application/json')) error(415, 'Richiesto un corpo JSON.');
  // Limits before parsing; registration needs only ~6 KB, never an image.
  if (Number(event.request.headers.get('content-length')) > limit) error(413, 'Richiesta troppo grande.');
  const reader = event.request.body?.getReader();
  if (!reader) error(400, 'Corpo della richiesta mancante.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); error(413, 'Richiesta troppo grande. Le foto non devono essere inviate.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const text = new TextDecoder().decode(bytes);
  try { const value = JSON.parse(text); if (value && typeof value === 'object' && !Array.isArray(value)) return value; } catch { /* safe error below */ }
  error(400, 'JSON non valido.');
}
export function privateJson(value: unknown, status = 200) {
  return json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } });
}
