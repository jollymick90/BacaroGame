import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

// Keep real route, validation, gateway and authorization; replace only external Firebase I/O.
const records = new Map();
const state = { configured: true, failAccess: false, claims: null };
const configPath = 'bacaroGameConfigurations/bug-hunter';
function snapshot(path) {
  return { exists: records.has(path), data: () => structuredClone(records.get(path)) };
}
const database = {
  collection(name) {
    return { doc(id) {
      const path = `${name}/${id}`;
      return { path, async get() {
        if (state.failAccess && id === 'superadmins') throw new Error('Access unavailable');
        return snapshot(path);
      } };
    } };
  },
  async runTransaction(callback) {
    const writes = [];
    const result = await callback({
      async get(reference) { return snapshot(reference.path); },
      set(reference, data) { writes.push(() => records.set(reference.path, structuredClone(data))); },
    });
    writes.forEach(write => write());
    return result;
  },
};
globalThis.__bugHunterConfigTest = {
  state,
  database,
  auth: { async verifySessionCookie() { return state.claims; } },
};
const cacheDir = mkdtempSync(join(tmpdir(), 'bug-hunter-api-vite-'));
const server = await createServer({
  configFile: false,
  cacheDir,
  server: { middlewareMode: true, watch: null },
  resolve: { alias: { $lib: fileURLToPath(new URL('../src/lib', import.meta.url)) } },
  plugins: [{
    name: 'bug-hunter-firebase-boundary',
    enforce: 'pre',
    resolveId(source) {
      if (source.endsWith('firebase-admin.server')) return '\0bug-test-admin';
      if (source === '$env/dynamic/private') return '\0bug-test-env';
    },
    load(id) {
      if (id === '\0bug-test-admin') return `
        export function emulatorMode() { return false; }
        export function firebaseConfigured() { return globalThis.__bugHunterConfigTest.state.configured; }
        export function firebaseAdmin() { return { db: globalThis.__bugHunterConfigTest.database, auth: globalThis.__bugHunterConfigTest.auth }; }
      `;
      if (id === '\0bug-test-env') return 'export const env = { BACARODEX_ALLOWED_EMAILS: "member@example.com" };';
    },
  }],
});
const route = await server.ssrLoadModule('/src/routes/api/bug-hunter/config/+server.ts');
const hooks = await server.ssrLoadModule('/src/hooks.server.ts');
after(async () => {
  await server.close();
  rmSync(cacheDir, { recursive: true, force: true });
  delete globalThis.__bugHunterConfigTest;
});
beforeEach(() => {
  records.clear();
  state.configured = true;
  state.failAccess = false;
  state.claims = { uid: 'member', email: 'member@example.com', email_verified: true };
});
function config() {
  return { questions: [{ id: 'bit', prompt: 'Quanto vale un bit?', answers: ['0 o 1', 'Solo 2', 'Solo 3'], correctIndex: 0, explanation: 'Un bit vale 0 o 1.' }] };
}
function event(method = 'GET', payload, authenticated = true, origin = 'https://example.com') {
  const url = new URL('https://example.com/api/bug-hunter/config');
  return {
    url,
    locals: { user: authenticated ? { uid: 'member', email: 'member@example.com' } : null },
    cookies: { get: () => 'session', delete() {} },
    request: new Request(url, {
      method,
      headers: { origin, 'content-type': 'application/json' },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),
  };
}
const status = expected => failure => failure.status === expected;

test('public GET supplies defaults without Firebase or writes and also for a missing document', async () => {
  for (const configured of [false, true]) {
    state.configured = configured;
    const response = await route.GET(event('GET', undefined, false));
    const data = await response.json();
    assert.equal(data.config.questions.length, 20);
    assert.equal(data.revision, 0);
    assert.equal(data.persisted, false);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(records.size, 0);
  }
});

test('saving publishes immediately, preserves stable question IDs and hides writer metadata', async () => {
  const response = await route.PUT(event('PUT', { config: config(), revision: 0 }));
  const saved = await response.json();
  assert.deepEqual(saved, { config: config(), revision: 1, persisted: true });
  assert.equal(records.get(configPath).updatedBy, 'member');
  const loaded = await (await route.GET(event())).json();
  assert.deepEqual(loaded, saved);
  const updated = config();
  updated.questions[0].prompt = 'Quali valori può assumere un bit?';
  await route.PUT(event('PUT', { config: updated, revision: 1 }));
  assert.equal((await (await route.GET(event())).json()).config.questions[0].prompt, updated.questions[0].prompt);
});

test('stale revisions reject without overwriting newer questions', async () => {
  await route.PUT(event('PUT', { config: config(), revision: 0 }));
  const stale = config();
  stale.questions[0].prompt = 'Testo obsoleto';
  await assert.rejects(route.PUT(event('PUT', { config: stale, revision: 0 })), status(409));
  assert.equal(records.get(configPath).config.questions[0].prompt, 'Quanto vale un bit?');
  assert.equal(records.get(configPath).revision, 1);
});

test('writes reject anonymous, cross-origin, invalid and oversized payloads without persisting', async () => {
  await assert.rejects(route.PUT(event('PUT', { config: config(), revision: 0 }, false)), status(401));
  await assert.rejects(route.PUT(event('PUT', { config: config(), revision: 0 }, true, 'https://other.example')), status(403));
  for (const payload of [
    { config: config(), revision: -1 },
    { config: config(), revision: '0' },
    { config: config(), revision: 0, extra: true },
    { config: { questions: [] }, revision: 0 },
  ]) {
    await assert.rejects(route.PUT(event('PUT', payload)), status(400));
  }
  await assert.rejects(route.PUT(event('PUT', { config: 'a'.repeat(520000), revision: 0 })), status(413));
  assert.equal(records.size, 0);
});

test('public GET skips session access lookup and PUT rechecks access through the real hook', async () => {
  state.failAccess = true;
  const response = await hooks.handle({ event: event(), resolve: current => route.GET(current) });
  assert.equal((await response.json()).config.questions.length, 20);
  state.failAccess = false;
  state.claims.email = 'outsider@example.com';
  await assert.rejects(hooks.handle({
    event: event('PUT', { config: config(), revision: 0 }),
    resolve: current => route.PUT(current),
  }), status(401));
  assert.equal(records.size, 0);
});
