import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Replace only Firebase persistence and environment configuration. Route handlers,
// request validation, authorization, role changes, and member writes run unchanged.
const records = new Map();
let nextId = 0;
const configuration = {
  BACARODEX_SUPERADMIN_EMAILS: 'root@example.com',
  BACARODEX_ALLOWED_EMAILS: 'member@example.com,delegate@example.com',
  FIREBASE_ADMIN_KEY: 'test-only-placeholder',
};

function reference(path) {
  return { path, id: path.split('/').at(-1), get: async () => snapshot(path) };
}

function snapshot(path) {
  return { exists: records.has(path), data: () => records.get(path) };
}

const database = {
  collection(name) {
    return {
      doc(id = `generated-${++nextId}`) {
        return reference(`${name}/${id}`);
      },
      limit(limit) {
        return { collection: name, limit };
      },
    };
  },
  async runTransaction(callback) {
    const writes = [];
    const result = await callback({
      async get(target) {
        if (target.path) return snapshot(target.path);
        const matches = [...records.keys()].filter(path => path.startsWith(`${target.collection}/`));
        return { size: Math.min(matches.length, target.limit) };
      },
      set(target, data) { writes.push(() => records.set(target.path, data)); },
      create(target, data) {
        assert.equal(records.has(target.path), false);
        writes.push(() => records.set(target.path, data));
      },
      delete(target) { writes.push(() => records.delete(target.path)); },
    });
    for (const write of writes) write();
    return result;
  },
};

globalThis.__bacaroTestDatabase = database;
globalThis.__bacaroTestConfiguration = configuration;
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null },
  resolve: { alias: { $lib: fileURLToPath(new URL('../src/lib', import.meta.url)) } },
  plugins: [{
    name: 'firebase-test-boundary',
    enforce: 'pre',
    resolveId(source) {
      if (source.endsWith('firebase-admin.server')) return '\0test-admin';
      if (source === '$env/dynamic/private') return '\0test-environment';
      if (source === '$env/dynamic/public') return '\0test-public-environment';
      if (source === '$app/environment') return '\0test-app-environment';
    },
    load(id) {
      if (id === '\0test-admin') return 'export function firebaseAdmin() { return { db: globalThis.__bacaroTestDatabase }; }';
      if (id === '\0test-environment') return 'export const env = globalThis.__bacaroTestConfiguration;';
      if (id === '\0test-public-environment') {
        return 'export const env = { PUBLIC_FIREBASE_API_KEY: "demo", PUBLIC_FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com", PUBLIC_FIREBASE_PROJECT_ID: "demo" };';
      }
      if (id === '\0test-app-environment') return 'export const dev = false;';
    },
  }],
});
const roles = await server.ssrLoadModule('/src/routes/api/bacarodex/superadmins/+server.ts');
const members = await server.ssrLoadModule('/src/routes/api/bacarodex/members/+server.ts');
const loginPolicy = await server.ssrLoadModule('/src/lib/firebase/firebase-admin.server.ts');
const model = 'human-3.3.6-mobileface-256-v1';

after(async () => {
  await server.close();
  delete globalThis.__bacaroTestDatabase;
  delete globalThis.__bacaroTestConfiguration;
});
beforeEach(() => {
  records.clear();
  nextId = 0;
  configuration.BACARODEX_SUPERADMIN_EMAILS = 'root@example.com';
  configuration.BACARODEX_ALLOWED_EMAILS = 'member@example.com,delegate@example.com';
});

function event(email, method = 'GET', data, origin = 'https://example.com') {
  return {
    locals: { user: email ? { uid: email.split('@')[0], email, name: email } : null },
    request: new Request('https://example.com/api/bacarodex', {
      method,
      headers: { origin, 'content-type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
    url: new URL('https://example.com/api/bacarodex'),
    async fetch() {
      return Response.json({ id: 25, name: 'pikachu', sprites: { front_default: null } });
    },
  };
}

function registration(mode = 'self', otherConsent = false) {
  return {
    name: 'Bacaro', pokemonId: 25, embedding: Array(256).fill(0.1),
    model, consent: true, mode, otherConsent,
  };
}

function status(expected) {
  return failure => failure.status === expected;
}

test('role endpoints reject anonymous, ordinary, and cross-origin requests', async () => {
  await assert.rejects(roles.GET(event(null)), status(401));
  await assert.rejects(roles.GET(event('member@example.com')), status(403));
  await assert.rejects(roles.PATCH(event('member@example.com', 'PATCH', {
    email: 'member@example.com', enabled: true,
  })), status(403));
  await assert.rejects(roles.PATCH(event('root@example.com', 'PATCH', {
    email: 'member@example.com', enabled: true,
  }, 'https://attacker.example')), status(403));
  assert.equal(records.size, 0);
});

test('permanent admins can delegate and revoke while permanent roles remain protected', async () => {
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'DELEGATE@example.com', enabled: true }));
  const response = await roles.GET(event('delegate@example.com'));
  const { accounts } = await response.json();
  assert.equal(accounts.find(account => account.email === 'root@example.com').permanent, true);
  assert.equal(accounts.find(account => account.email === 'delegate@example.com').superadmin, true);
  await assert.rejects(roles.PATCH(event('delegate@example.com', 'PATCH', {
    email: 'root@example.com', enabled: false,
  })), status(400));
  await assert.rejects(roles.PATCH(event('root@example.com', 'PATCH', {
    email: 'outsider@example.com', enabled: true,
  })), status(400));
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'delegate@example.com', enabled: false }));
  await assert.rejects(roles.GET(event('delegate@example.com')), status(403));
});

test('ordinary users cannot register other people or delete someone else', async () => {
  const forbiddenRequest = event('member@example.com', 'POST', registration('other', true));
  let pokemonRequests = 0;
  forbiddenRequest.fetch = async () => {
    pokemonRequests += 1;
    return Response.json({ id: 25, name: 'pikachu', sprites: {} });
  };
  await assert.rejects(members.POST(forbiddenRequest), status(403));
  assert.equal(pokemonRequests, 0, 'Reject unauthorized registration before external requests');
  await assert.rejects(members.POST(event('member@example.com', 'POST', registration('other', true))), status(403));
  records.set('bacarodexMembers/someone-else', { name: 'Existing' });
  await assert.rejects(members.DELETE(event('member@example.com', 'DELETE', { memberId: 'someone-else' })), status(403));
  assert.equal(records.get('bacarodexMembers/someone-else').name, 'Existing');
});

test('self registration retains UID ownership and duplicate protection', async () => {
  const response = await members.POST(event('member@example.com', 'POST', registration()));
  assert.equal(response.status, 201);
  assert.equal(records.get('bacarodexMembers/member').consentMode, 'self');
  await assert.rejects(members.POST(event('member@example.com', 'POST', registration())), status(409));
  await members.DELETE(event('member@example.com', 'DELETE'));
  assert.equal(records.has('bacarodexMembers/member'), false);
});

test('superadmins register multiple consenting people with distinct IDs and operator attribution', async () => {
  await assert.rejects(members.POST(event('root@example.com', 'POST', registration('other'))), status(400));
  await members.POST(event('root@example.com', 'POST', registration('other', true)));
  await members.POST(event('root@example.com', 'POST', registration('other', true)));
  const registered = [...records.entries()].filter(([path]) => path.startsWith('bacarodexMembers/'));
  assert.equal(registered.length, 2);
  assert.notEqual(registered[0][0], registered[1][0]);
  assert.equal(records.has('bacarodexMembers/root'), false);
  for (const [, data] of registered) {
    assert.equal(data.createdBy, 'root');
    assert.equal(data.consentRecordedBy, 'root');
    assert.equal(data.consentMode, 'other');
    assert.equal(data.consentVersion, 'public-game-v2');
  }
  await members.DELETE(event('root@example.com', 'DELETE', { memberId: registered[0][0].split('/')[1] }));
  assert.equal(records.has(registered[0][0]), false);
});

test('revocation takes effect on the next member mutation, including existing sessions', async () => {
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'delegate@example.com', enabled: true }));
  await members.POST(event('delegate@example.com', 'POST', registration('other', true)));
  const memberPath = [...records.keys()].find(path => path.startsWith('bacarodexMembers/'));
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'delegate@example.com', enabled: false }));
  await assert.rejects(members.POST(event('delegate@example.com', 'POST', registration('other', true))), status(403));
  await assert.rejects(members.DELETE(event('delegate@example.com', 'DELETE', {
    memberId: memberPath.split('/')[1],
  })), status(403));
  assert.equal(records.has(memberPath), true);
});

test('last effective delegated admin cannot be removed if permanent configuration is cleared', async () => {
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'delegate@example.com', enabled: true }));
  configuration.BACARODEX_SUPERADMIN_EMAILS = '';
  await assert.rejects(roles.PATCH(event('delegate@example.com', 'PATCH', {
    email: 'delegate@example.com', enabled: false,
  })), status(400));
});

test('registration limit remains enforced for superadmins', async () => {
  for (let index = 0; index < 200; index += 1) {
    records.set(`bacarodexMembers/existing-${index}`, {});
  }
  await assert.rejects(members.POST(event('root@example.com', 'POST', registration('other', true))), status(409));
  assert.equal(records.size, 200);
});


test('permanent root can log in without a duplicate allowed-email entry, but must be verified', () => {
  configuration.BACARODEX_ALLOWED_EMAILS = '';
  assert.equal(loginPolicy.firebaseConfigured(), true);
  assert.equal(loginPolicy.allowed('ROOT@example.com', true), true);
  assert.equal(loginPolicy.allowed('root@example.com', false), false);
  assert.equal(loginPolicy.allowed('outsider@example.com', true), false);
  configuration.BACARODEX_SUPERADMIN_EMAILS = '';
  assert.equal(loginPolicy.firebaseConfigured(), false);
});
