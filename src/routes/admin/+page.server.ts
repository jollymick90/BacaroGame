import { emulatorMode, firebaseConfigured } from '$lib/firebase/firebase-admin.server';
export function load({ locals }: { locals: App.Locals }) {
  return { user: locals.user, configured: firebaseConfigured(), emulator: Boolean(emulatorMode()) };
}
