import {
  emulatorMode,
  firebaseConfigured,
} from "$lib/firebase/firebase-admin.server";
// Espone alla pagina lo stato del login e la disponibilità del servizio, senza credenziali.
export function load({ locals }: { locals: App.Locals }) {
  return {
    user: locals.user,
    configured: firebaseConfigured(),
    emulator: Boolean(emulatorMode()),
  };
}
