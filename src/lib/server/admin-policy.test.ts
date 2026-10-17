import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emailList, isSuperadmin, canDeleteMember, updateDelegatedAdmins } from './admin-policy.ts';

test('permanent roots are normalized and always superadmin', () => {
  const roots = emailList(' ROOT@example.com, root@example.com, other@example.com ');
  assert.deepEqual(roots, ['root@example.com', 'other@example.com']);
  assert.equal(isSuperadmin('ROOT@example.com', roots, [], []), true);
  assert.throws(() => updateDelegatedAdmins(roots, [], [], 'root@example.com', false));
});

test('delegated roles require continued login eligibility and are revocable', () => {
  const allowed = ['member@example.com'];
  const added = updateDelegatedAdmins(['root@example.com'], allowed, [], 'MEMBER@example.com', true);
  assert.equal(isSuperadmin('member@example.com', [], allowed, added), true);
  assert.equal(isSuperadmin('member@example.com', [], [], added), false);
  assert.deepEqual(updateDelegatedAdmins(['root@example.com'], allowed, added, 'member@example.com', false), []);
  assert.throws(() => updateDelegatedAdmins(['root@example.com'], allowed, [], 'outsider@example.com', true));
  assert.throws(() => updateDelegatedAdmins([], allowed, added, 'member@example.com', false));
});

test('ordinary members can delete only their own UID registration', () => {
  assert.equal(canDeleteMember('user-1', 'user-1', false), true);
  assert.equal(canDeleteMember('other-person', 'user-1', false), false);
  assert.equal(canDeleteMember('other-person', 'user-1', true), true);
});

test('registering another person requires superadmin and explicit consent attestation', async () => {
  const { registrationMode } = await import('./admin-policy.ts');
  assert.equal(registrationMode(undefined, false, false), 'self');
  assert.equal(registrationMode('self', false, false), 'self');
  assert.throws(() => registrationMode('other', false, true));
  assert.throws(() => registrationMode('other', true, false));
  assert.throws(() => registrationMode('invalid', true, true));
  assert.equal(registrationMode('other', true, true), 'other');
});
