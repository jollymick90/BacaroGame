import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { DEFAULT_CONFIG } from '../src/lib/games/merge-battle/config.ts';

// Real API, validation, cache and collection gateway; only Firebase I/O is replaced.
const legacy = structuredClone(DEFAULT_CONFIG);
delete legacy.activeAxes;
let stored = { config: legacy, revision: 7 };
let writes = 0;
const reference = { async get() { return { exists: true, data: () => structuredClone(stored) }; } };
const database = {
  collection(name) {
    assert.equal(name, 'bacaroGameConfigurations');
    return { doc(id) { assert.equal(id, 'merge-battle'); return reference; } };
  },
  async runTransaction(callback) {
    return callback({
      get: () => reference.get(),
      set(_reference, data) { stored = structuredClone(data); writes++; }
    });
  }
};
globalThis.__mergeAxesDatabase = database;
const cacheDir = mkdtempSync(join(tmpdir(), 'merge-axes-api-'));
const server = await createServer({
  configFile: false,
  cacheDir,
  server: { middlewareMode: true, watch: null },
  resolve: { alias: { $lib: fileURLToPath(new URL('../src/lib', import.meta.url)) } },
  plugins: [{
    name: 'merge-axes-firebase-boundary',
    enforce: 'pre',
    resolveId(source) { if (source.endsWith('firebase-admin.server')) return '\0merge-axes-admin'; },
    load(id) {
      if (id === '\0merge-axes-admin') return `
        export function firebaseConfigured() { return true; }
        export function firebaseAdmin() { return { db: globalThis.__mergeAxesDatabase }; }
      `;
    }
  }]
});
const route = await server.ssrLoadModule('/src/routes/api/merge-battle/config/+server.ts');
after(async () => {
  await server.close();
  rmSync(cacheDir, { recursive: true, force: true });
  delete globalThis.__mergeAxesDatabase;
});
function event(method = 'GET', payload, authenticated = true) {
  const url = new URL('https://example.test/api/merge-battle/config');
  return {
    url,
    locals: { user: authenticated ? { uid: 'admin' } : null },
    request: new Request(url, {
      method,
      headers: { origin: url.origin, 'content-type': 'application/json' },
      body: payload === undefined ? undefined : JSON.stringify(payload)
    })
  };
}

test('legacy GET defaults to two parameters; PUT roundtrips axes, updates cache and validates revisions', async () => {
  const initial = await (await route.GET(event())).json();
  assert.deepEqual(initial.config.activeAxes, [0, 1]);
  assert.equal(writes, 0);
  assert.deepEqual(initial.config.cards, legacy.cards);
  let current = initial;
  for (const activeAxes of [[1], [0, 1, 2], [0, 1, 2, 3]]) {
    const config = { ...current.config, activeAxes };
    current = await (await route.PUT(event('PUT', { config, revision: current.revision }))).json();
    assert.deepEqual(stored.config.activeAxes, activeAxes);
    assert.deepEqual((await (await route.GET(event())).json()).config.activeAxes, activeAxes);
    assert.deepEqual(current.config.cards, legacy.cards);
    assert.deepEqual(current.config.weights, legacy.weights);
  }
  assert.equal(writes, 3);
  await assert.rejects(route.PUT(event('PUT', { config: current.config, revision: 7 })), error => error.status === 409);
  for (const activeAxes of [[], [0, 0], [4], null]) {
    await assert.rejects(route.PUT(event('PUT', { config: { ...current.config, activeAxes }, revision: current.revision })), error => error.status === 400);
  }
  await assert.rejects(route.PUT(event('PUT', { config: current.config, revision: current.revision }, false)), error => error.status === 401);
  assert.equal(writes, 3);
});
