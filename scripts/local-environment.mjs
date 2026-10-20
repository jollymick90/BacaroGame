export const LOCAL_ACCOUNT = {
  email: 'dev@bacarotech.local',
  password: 'bacarodev123',
};

export function createLocalEnvironment(base) {
  const environment = {
    ...base,
    NODE_ENV: 'development',
    PUBLIC_FIREBASE_API_KEY: 'demo-bacarodex-key',
    PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-bacarodex.firebaseapp.com',
    PUBLIC_FIREBASE_PROJECT_ID: 'demo-bacarodex',
    PUBLIC_FIREBASE_USE_EMULATORS: 'true',
    PUBLIC_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9199',
    FIREBASE_ADMIN_KEY: '',
    BACARODEX_ALLOWED_EMAILS: '',
    BACARODEX_SUPERADMIN_EMAILS: LOCAL_ACCOUNT.email,
    BACARODEX_GAME_SECRET: '',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199',
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8180',
    GCLOUD_PROJECT: 'demo-bacarodex',
    GOOGLE_CLOUD_PROJECT: 'demo-bacarodex',
  };
  delete environment.GOOGLE_APPLICATION_CREDENTIALS;
  delete environment.FIREBASE_CONFIG;
  return environment;
}

export async function ensureLocalAccount(fetcher = fetch) {
  const response = await fetcher(
    'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-bacarodex-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...LOCAL_ACCOUNT, returnSecureToken: true }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (response.ok) return;
  const result = await response.json().catch(() => ({}));
  if (result.error?.message === 'EMAIL_EXISTS') return;
  throw new Error(
    'Impossibile preparare l’account locale. Controlla gli emulatori con npm run firebase:logs.',
  );
}
