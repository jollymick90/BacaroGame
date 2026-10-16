import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { dev } from '$app/environment';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { error } from '@sveltejs/kit';

// Emulator mode is deliberately limited to local development and a demo project.
export function emulatorMode() {
  return dev && publicEnv.PUBLIC_FIREBASE_USE_EMULATORS === 'true' && publicEnv.PUBLIC_FIREBASE_PROJECT_ID?.startsWith('demo-');
}
export function firebaseConfigured() {
  return Boolean(publicEnv.PUBLIC_FIREBASE_API_KEY && publicEnv.PUBLIC_FIREBASE_AUTH_DOMAIN && publicEnv.PUBLIC_FIREBASE_PROJECT_ID && (emulatorMode() || (env.FIREBASE_ADMIN_KEY && env.BACARODEX_ALLOWED_EMAILS?.trim())));
}
export function allowed(email: string | undefined, verified: boolean | undefined) {
  if (emulatorMode()) return true;
  const emails = (env.BACARODEX_ALLOWED_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return Boolean(verified && email && emails.includes(email.toLowerCase()));
}
export function firebaseAdmin() {
  if (!firebaseConfigured()) error(503, 'Firebase non configurato. Completa le variabili indicate in .env.example.');
  const projectId = publicEnv.PUBLIC_FIREBASE_PROJECT_ID;
  const emulator = emulatorMode();
  if (emulator) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  } else if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
    error(503, 'Host emulatori non ammessi nella configurazione cloud.');
  }
  const name = `bacarodex-${emulator ? 'emulator' : 'cloud'}-${projectId}`;
  let app = getApps().find(a => a.name === name);
  if (!app) {
    try {
      app = initializeApp(emulator ? { projectId } : { projectId, credential: cert(JSON.parse(env.FIREBASE_ADMIN_KEY!)) }, name);
    } catch { error(503, 'Configurazione Firebase Admin non valida.'); }
  }
  return { auth: getAuth(app), db: getFirestore(app) };
}
