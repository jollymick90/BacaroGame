import { env } from "$env/dynamic/public";
import { browser, dev } from "$app/environment";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
  inMemoryPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
// Riutilizziamo la stessa istanza Auth per le richieste di questo browser.
let initialized: ReturnType<typeof getAuth> | undefined;
async function authClient() {
  if (!browser) throw new Error("Accesso disponibile solo nel browser.");
  if (
    !env.PUBLIC_FIREBASE_API_KEY ||
    !env.PUBLIC_FIREBASE_PROJECT_ID ||
    !env.PUBLIC_FIREBASE_AUTH_DOMAIN
  )
    throw new Error("Configura Firebase seguendo il README.");
  if (!initialized) {
    const name = "bacarodex-web";
    const app =
      getApps().find((a) => a.name === name) ??
      initializeApp(
        {
          apiKey: env.PUBLIC_FIREBASE_API_KEY,
          projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
          authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
        },
        name,
      );
    initialized = getAuth(app);
    if (
      dev &&
      env.PUBLIC_FIREBASE_USE_EMULATORS === "true" &&
      env.PUBLIC_FIREBASE_PROJECT_ID.startsWith("demo-")
    )
      connectAuthEmulator(
        initialized,
        env.PUBLIC_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099",
        { disableWarnings: true },
      );
    // Il token serve solo a creare il cookie di sessione: non va conservato nel browser.
    await setPersistence(initialized, inMemoryPersistence);
  }
  return initialized;
}
export async function login(emulatorCredentials?: {
  email: string;
  password: string;
  create: boolean;
}) {
  const auth = await authClient();
  try {
    const credential =
      emulatorCredentials && dev && env.PUBLIC_FIREBASE_USE_EMULATORS === "true"
        ? await (
            emulatorCredentials.create
              ? createUserWithEmailAndPassword
              : signInWithEmailAndPassword
          )(auth, emulatorCredentials.email, emulatorCredentials.password)
        : await signInWithPopup(auth, new GoogleAuthProvider());
    // Il server verifica identità e lista membri prima di creare la sessione.
    const idToken = await credential.user.getIdToken();
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Accesso non riuscito.");
    }
    // Chiudiamo sempre la sessione SDK; la navigazione usa poi il cookie del server.
  } finally {
    await signOut(auth);
  }
  window.location.replace("/admin");
}
export async function logout() {
  const response = await fetch("/api/session", { method: "DELETE" });
  if (!response.ok) throw new Error("Uscita non riuscita. Riprova.");
  window.location.replace("/admin");
}
