import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const records = new Map();
const reads = [];
const failed = new Set();
const stalled = new Set();
const database = {
  collection(name) {
    assert.equal(name, 'bacaroGameConfigurations');
    return { doc(id) { return {
      id,
      async get() {
        reads.push(id);
        if (stalled.has(id)) return new Promise(() => {});
        if (failed.has(id)) throw new Error('Unavailable');
        return { exists: records.has(id), data: () => structuredClone(records.get(id)) };
      },
    }; } };
  },
  async runTransaction(callback) {
    return callback({
      get: reference => reference.get(),
      set: (reference, data) => records.set(reference.id, structuredClone(data)),
    });
  },
};
globalThis.__gameCenterDatabase = database;
const cacheDir = mkdtempSync(join(tmpdir(), 'game-center-api-'));
const server = await createServer({
  configFile: false, cacheDir,
  server: { middlewareMode: true, watch: null },
  resolve: { alias: { $lib: fileURLToPath(new URL('../src/lib', import.meta.url)) } },
  plugins: [{
    name: 'game-center-firebase-boundary', enforce: 'pre',
    resolveId(source) {
      if (source.endsWith('firebase-admin.server')) return '\0game-center-admin';
      if (source === '$env/dynamic/private') return '\0game-center-env';
    },
    load(id) {
      if (id === '\0game-center-admin') return `
        export function firebaseConfigured() { return true; }
        export function emulatorMode() { return true; }
        export function firebaseAdmin() { return { db: globalThis.__gameCenterDatabase }; }
      `;
      if (id === '\0game-center-env') return 'export const env = {};';
    },
  }],
});
const publicRoute = await server.ssrLoadModule('/src/routes/api/game-center/config/+server.ts');
const mergeRoute = await server.ssrLoadModule('/src/routes/api/merge-battle/config/+server.ts');
const hunterRoute = await server.ssrLoadModule('/src/routes/api/bug-hunter/config/+server.ts');
after(async () => {
  await server.close();
  rmSync(cacheDir, { recursive: true, force: true });
  delete globalThis.__gameCenterDatabase;
});
function event(path = 'game-center', payload) {
  const url = new URL(`https://example.test/api/${path}/config`);
  return {
    url, route: { id: `/api/${path}/config` }, locals: { user: { uid: 'member' } },
    request: new Request(url, {
      method: payload ? 'PUT' : 'GET',
      headers: { origin: url.origin, 'content-type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
    }),
  };
}
async function publicConfig() { return (await publicRoute.GET(event())).json(); }

test('shared config deduplicates reads, reflects admin saves, expires and isolates unavailable games', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.now() });
  const [initial, concurrent] = await Promise.all([publicConfig(), publicConfig()]);
  assert.deepEqual(initial, concurrent);
  assert.deepEqual(reads.sort(), ['bug-hunter', 'merge-battle']);
  assert.deepEqual(initial.mergeBattle.activeAxes, [0, 1]);
  assert.equal(initial.bugHunter.questions.length, 20);
  assert.deepEqual(initial.bugHunter.run, { distanceGoal: 400, bugGoal: 20 });
  await publicConfig();
  assert.equal(reads.length, 2);

  const mergeConfig = { ...initial.mergeBattle, activeAxes: [1, 3] };
  const bugConfig = { questions: [initial.bugHunter.questions[0]], run: { distanceGoal: 2500, bugGoal: 35 } };
  await mergeRoute.PUT(event('merge-battle', { config: mergeConfig, revision: 0 }));
  await hunterRoute.PUT(event('bug-hunter', { config: bugConfig, revision: 0 }));
  const afterSave = reads.length;
  const published = await publicConfig();
  assert.deepEqual(published.mergeBattle.activeAxes, [1, 3]);
  assert.deepEqual(published.bugHunter, bugConfig);
  assert.equal(reads.length, afterSave, 'saved config updates public cache without a new database read');
  assert.equal(JSON.stringify(published).includes('updatedBy'), false);

  t.mock.timers.tick(60_001);
  await publicConfig();
  assert.equal(reads.length, afterSave + 2, 'expired server cache re-reads both documents');
  t.mock.timers.tick(60_001);
  failed.add('merge-battle');
  failed.add('bug-hunter');
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  const degraded = await publicConfig();
  assert.equal(degraded.mergeBattle, null);
  assert.match(degraded.mergeError, /Riferimento:/);
  assert.equal(degraded.bugHunter.questions.length, 20);
  assert.deepEqual(degraded.bugHunter.run, { distanceGoal: 400, bugGoal: 20 });
  assert.equal(degraded.configured, true, 'one failed configuration must not disable Bacarodex');
  assert.equal(logs.length, 2);
  failed.clear();
  const recovered = await publicConfig();
  assert.deepEqual(recovered.mergeBattle.activeAxes, [1, 3], 'a failed read is not cached');
  assert.deepEqual(recovered.bugHunter, bugConfig);

  t.mock.timers.tick(60_001);
  stalled.add('merge-battle');
  stalled.add('bug-hunter');
  const waiting = publicConfig();
  await new Promise(resolve => setImmediate(resolve));
  t.mock.timers.tick(3000);
  const timedOut = await waiting;
  assert.equal(timedOut.mergeBattle, null);
  assert.equal(timedOut.bugHunter.questions.length, 20);
  assert.deepEqual(timedOut.bugHunter.run, { distanceGoal: 400, bugGoal: 20 });
  stalled.clear();
  assert.deepEqual((await publicConfig()).mergeBattle.activeAxes, [1, 3], 'timed-out reads do not keep the cache pending');
});
