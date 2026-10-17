import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Replace only Firebase persistence and environment configuration. Route handlers,
// request validation, authorization, role changes, and member writes run unchanged.
const records = new Map();
let nextId = 0;
let accessUnavailable = false;
const auth = {
  async verifySessionCookie() { return globalThis.__bacaroTestClaims; },
  async verifyIdToken() { return globalThis.__bacaroTestClaims; },
  async createSessionCookie() { return 'test-session-cookie'; },
};
const configuration = {
  BACARODEX_SUPERADMIN_EMAILS: 'root@example.com',
  BACARODEX_ALLOWED_EMAILS: 'member@example.com,delegate@example.com',
  FIREBASE_ADMIN_KEY: 'test-only-placeholder',
};

function reference(path) {
  return {
    path,
    id: path.split('/').at(-1),
    async get() {
      if (accessUnavailable) throw new Error('Test database unavailable');
      return snapshot(path);
    },
  };
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
globalThis.__bacaroTestAuth = auth;
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
      if (id === '\0test-admin') return 'export function firebaseConfigured() { return true; } export function emulatorMode() { return false; } export function firebaseAdmin() { return { db: globalThis.__bacaroTestDatabase, auth: globalThis.__bacaroTestAuth }; }';
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
const firebaseConfiguration = await server.ssrLoadModule('/src/lib/firebase/firebase-admin.server.ts');
const loginPolicy = await server.ssrLoadModule('/src/lib/server/superadmins.ts');
const hooks = await server.ssrLoadModule('/src/hooks.server.ts');
const sessions = await server.ssrLoadModule('/src/routes/api/session/+server.ts');
const model = 'human-3.3.6-mobileface-256-v1';

after(async () => {
  await server.close();
  delete globalThis.__bacaroTestDatabase;
  delete globalThis.__bacaroTestConfiguration;
  delete globalThis.__bacaroTestAuth;
  delete globalThis.__bacaroTestClaims;
});
beforeEach(() => {
  records.clear();
  nextId = 0;
  accessUnavailable = false;
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


test('permanent root can log in without a duplicate allowed-email entry, but must be verified', async () => {
  configuration.BACARODEX_ALLOWED_EMAILS = '';
  assert.equal(firebaseConfiguration.firebaseConfigured(), true);
  assert.equal(await loginPolicy.allowed('ROOT@example.com', true), true);
  assert.equal(await loginPolicy.allowed('root@example.com', false), false);
  assert.equal(await loginPolicy.allowed('outsider@example.com', true), false);
  configuration.BACARODEX_SUPERADMIN_EMAILS = '';
  assert.equal(firebaseConfiguration.firebaseConfigured(), true);
});

async function accessRequest(actor, email, enabled, origin) {
  const access = await server.ssrLoadModule('/src/routes/api/bacarodex/access/+server.ts');
  return access.PATCH(event(actor, 'PATCH', { email, enabled }, origin));
}

test('superadmin can add a normalized email and grant its role separately', async () => {
  const policy = await server.ssrLoadModule('/src/lib/server/superadmins.ts');
  assert.equal(await policy.allowed('new@example.com', true), false);
  await accessRequest('root@example.com', ' NEW@example.com ', true);
  await accessRequest('root@example.com', 'new@example.com', true);
  assert.equal(await policy.allowed('new@example.com', true), true);
  assert.equal(await policy.allowed('new@example.com', false), false);
  assert.equal(await policy.hasSuperadminRole('new@example.com'), false);
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'new@example.com', enabled: true }));
  assert.equal(await policy.hasSuperadminRole('new@example.com'), true);
  assert.deepEqual(records.get('bacaroGameConfigurations/superadmins').allowedEmails, ['new@example.com']);
});

test('removing configured access also revokes roles and reenabling does not restore them', async () => {
  const policy = await server.ssrLoadModule('/src/lib/server/superadmins.ts');
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'delegate@example.com', enabled: true }));
  await accessRequest('root@example.com', 'delegate@example.com', false);
  assert.equal(await policy.allowed('delegate@example.com', true), false);
  assert.equal(await policy.hasSuperadminRole('delegate@example.com'), false);
  await accessRequest('root@example.com', 'delegate@example.com', true);
  assert.equal(await policy.allowed('delegate@example.com', true), true);
  assert.equal(await policy.hasSuperadminRole('delegate@example.com'), false);
});

test('access mutations reject ordinary, anonymous, cross-origin and malformed requests', async () => {
  await assert.rejects(accessRequest('member@example.com', 'new@example.com', true), status(403));
  await assert.rejects(accessRequest(null, 'new@example.com', true), status(401));
  await assert.rejects(accessRequest('root@example.com', 'new@example.com', true, 'https://attacker.example'), status(403));
  for (const invalid of ['', 'not-an-email', 'one@example.com,two@example.com', 'a b@example.com']) {
    await assert.rejects(accessRequest('root@example.com', invalid, true), status(400));
  }
  assert.equal(records.size, 0);
});

test('access removal protects permanent roots and the last effective superadmin', async () => {
  await assert.rejects(accessRequest('root@example.com', 'root@example.com', false), status(400));
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'delegate@example.com', enabled: true }));
  configuration.BACARODEX_SUPERADMIN_EMAILS = '';
  await assert.rejects(accessRequest('delegate@example.com', 'delegate@example.com', false), status(400));
});

test('role changes preserve stored access additions and removals', async () => {
  const policy = await server.ssrLoadModule('/src/lib/server/superadmins.ts');
  await accessRequest('root@example.com', 'new@example.com', true);
  await accessRequest('root@example.com', 'member@example.com', false);
  await roles.PATCH(event('root@example.com', 'PATCH', { email: 'delegate@example.com', enabled: true }));
  assert.equal(await policy.allowed('new@example.com', true), true);
  assert.equal(await policy.allowed('member@example.com', true), false);
});


function authenticatedRequest(email) {
  globalThis.__bacaroTestClaims = {
    uid: email.split('@')[0], email, email_verified: true,
    auth_time: Date.now() / 1000,
  };
  const requestEvent = event(null, 'POST', { idToken: 'test-id-token-long-enough' });
  requestEvent.url = new URL('https://example.com/admin');
  const removedCookies = [];
  const createdCookies = [];
  requestEvent.cookies = {
    get: () => 'test-session-cookie',
    delete: name => removedCookies.push(name),
    set: (...args) => createdCookies.push(args),
  };
  return { requestEvent, removedCookies, createdCookies };
}

test('new authorized emails can create sessions and are rejected after access removal', async () => {
  await accessRequest('root@example.com', 'new@example.com', true);
  const { requestEvent, createdCookies } = authenticatedRequest('new@example.com');
  const response = await sessions.POST(requestEvent);
  assert.equal(response.status, 200);
  assert.equal(createdCookies.length, 1);
  await accessRequest('root@example.com', 'new@example.com', false);
  const denied = authenticatedRequest('new@example.com');
  await assert.rejects(sessions.POST(denied.requestEvent), status(403));
  assert.equal(denied.createdCookies.length, 0);
  assert.equal(createdCookies.length, 1);
});

test('session hook rechecks effective access for already issued cookies', async () => {
  await accessRequest('root@example.com', 'new@example.com', true);
  const { requestEvent, removedCookies } = authenticatedRequest('new@example.com');
  let authenticatedUser = null;
  const resolve = async currentEvent => {
    authenticatedUser = currentEvent.locals.user;
    return new Response('ok');
  };
  await hooks.handle({ event: requestEvent, resolve });
  assert.equal(authenticatedUser.email, 'new@example.com');
  await accessRequest('root@example.com', 'new@example.com', false);
  await hooks.handle({ event: requestEvent, resolve });
  assert.equal(authenticatedUser, null);
  assert.deepEqual(removedCookies, ['bacarodex_session']);
});

test('access database failure fails closed while preserving a valid session cookie', async () => {
  const { requestEvent, removedCookies } = authenticatedRequest('member@example.com');
  accessUnavailable = true;
  let resolved = false;
  await assert.rejects(hooks.handle({
    event: requestEvent,
    resolve: async () => { resolved = true; return new Response('ok'); },
  }), /Test database unavailable/);
  assert.equal(resolved, false);
  assert.deepEqual(removedCookies, []);
});
