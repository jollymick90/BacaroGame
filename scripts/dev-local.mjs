import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createLocalEnvironment, ensureLocalAccount, LOCAL_ACCOUNT } from './local-environment.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options });
    child.once('error', () => reject(new Error(`Comando non disponibile: ${command}.`)));
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} non è riuscito (codice ${code}).`));
    });
  });
}
async function dockerReady() {
  try {
    await run('docker', ['info', '--format', '{{.ServerVersion}}'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
async function ensureDocker() {
  if (await dockerReady()) return;
  if (process.platform === 'darwin') {
    for (const app of ['OrbStack', 'Docker']) {
      try {
        await access(`/Applications/${app}.app`);
      } catch {
        continue;
      }
      console.log(`Avvio ${app} per gli emulatori locali…`);
      await run('open', ['-a', app]);
      for (let attempt = 0; attempt < 60; attempt++) {
        if (await dockerReady()) return;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      break;
    }
  }
  throw new Error('Avvia Docker Desktop o OrbStack, poi esegui di nuovo npm run dev.');
}
async function main() {
  console.log('Bacarodex locale: progetto demo, nessuna credenziale cloud richiesta.');
  await ensureDocker();
  console.log('Preparazione emulatori Firebase (il primo avvio può richiedere qualche minuto)…');
  // Explicit env file: Docker must not parse the user's cloud .env.
  await run('docker', [
    'compose',
    '--env-file',
    '.env.emulator.example',
    'up',
    '--build',
    '-d',
    '--wait',
  ]);
  await ensureLocalAccount();
  console.log(`\nAccount locale: ${LOCAL_ACCOUNT.email}`);
  console.log(`Password iniziale locale: ${LOCAL_ACCOUNT.password} (se modificata, usa la nuova)`);
  console.log('Console emulatori: http://127.0.0.1:4100');
  console.log('I dati locali restano nei volumi. Per arrestarli: npm run firebase:down\n');
  const vite = spawn(
    process.execPath,
    [
      fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
      '--host',
      '127.0.0.1',
      ...process.argv.slice(2),
    ],
    { cwd: root, env: createLocalEnvironment(process.env), stdio: 'inherit' },
  );
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => vite.kill(signal));
  }
  vite.once('error', () => {
    console.error('Impossibile avviare Vite. Esegui npm ci e riprova.');
    process.exitCode = 1;
  });
  vite.once('exit', (code) => {
    process.exitCode = code ?? 0;
  });
}
main().catch((failure) => {
  console.error(failure.message);
  process.exitCode = 1;
});
