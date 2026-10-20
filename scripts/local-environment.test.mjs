import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLocalEnvironment, ensureLocalAccount } from './local-environment.mjs';

test('local startup overrides cloud settings without mutating the callers environment', () => {
  const original = {
    PATH: '/test/bin',
    PUBLIC_FIREBASE_PROJECT_ID: 'production-project',
    PUBLIC_FIREBASE_USE_EMULATORS: 'false',
    FIREBASE_ADMIN_KEY: 'private-cloud-credential',
    GOOGLE_APPLICATION_CREDENTIALS: '/private/cloud.json',
    BACARODEX_SUPERADMIN_EMAILS: 'cloud-admin@example.com',
  };
  const result = createLocalEnvironment(original);
  assert.equal(result.PUBLIC_FIREBASE_PROJECT_ID, 'demo-bacarodex');
  assert.equal(result.PUBLIC_FIREBASE_USE_EMULATORS, 'true');
  assert.equal(result.FIREBASE_ADMIN_KEY, '');
  assert.equal(result.GOOGLE_APPLICATION_CREDENTIALS, undefined);
  assert.equal(result.PATH, '/test/bin');
  assert.equal(result.BACARODEX_SUPERADMIN_EMAILS, 'dev@bacarotech.local');
  assert.equal(result.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9199');
  assert.equal(result.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8180');
  assert.equal(original.PUBLIC_FIREBASE_PROJECT_ID, 'production-project');
  assert.equal(original.FIREBASE_ADMIN_KEY, 'private-cloud-credential');
});
test('development account is created only on the loopback Auth emulator', async () => {
  let calls = 0;
  await ensureLocalAccount(async (url, options) => {
    calls++;
    const target = new URL(url);
    assert.equal(target.hostname, '127.0.0.1');
    assert.equal(target.port, '9199');
    assert.match(target.pathname, /accounts:signUp$/);
    assert.equal(JSON.parse(options.body).email, 'dev@bacarotech.local');
    return Response.json({ localId: 'local-test-user' });
  });
  assert.equal(calls, 1);
});
test('startup preserves existing local accounts and reports other failures safely', async () => {
  await ensureLocalAccount(async () =>
    Response.json({ error: { message: 'EMAIL_EXISTS' } }, { status: 400 }),
  );
  await assert.rejects(
    ensureLocalAccount(async () =>
      Response.json({ error: { message: 'internal-sensitive-detail' } }, { status: 500 }),
    ),
    (failure) => {
      assert.match(failure.message, /account locale/);
      assert.ok(!failure.message.includes('internal-sensitive-detail'));
      return true;
    },
  );
});
