import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reportServerError } from './errors.ts';

test('diagnostics identify the failure without exposing private payloads', () => {
  const entries: unknown[] = [];
  const failure = Object.assign(new Error('private Firebase payload token=secret'), { code: 7, token: 'secret' });
  failure.stack = 'Error: private Firebase payload\nsecret continuation\n    at GET (/app/routes/api/bacarodex/+server.js:12:3)';
  const response = reportServerError({ error: failure, status: 500, event: {
    request: new Request('https://example.com/api/bacarodex?token=secret'), route: { id: '/api/bacarodex' }
  } }, entry => entries.push(entry));
  assert.match(response.message, /Riferimento: [a-f0-9-]{36}/);
  const entry = entries[0] as Record<string, unknown>;
  assert.ok(response.message.includes(String(entry.errorId)));
  assert.equal(entry.route, '/api/bacarodex');
  assert.equal(entry.method, 'GET');
  assert.equal(entry.status, 500);
  assert.equal(entry.code, 7);
  assert.match(String(entry.stack), /\+server.js:12:3/);
  assert.doesNotMatch(JSON.stringify(entries), /secret|private Firebase|token/);
});

test('non-Error throws do not leak their contents', () => {
  const entries: unknown[] = [];
  reportServerError({ error: { message: 'secret' }, status: 500, event: {
    request: new Request('https://example.com/'), route: { id: null }
  } }, entry => entries.push(entry));
  assert.doesNotMatch(JSON.stringify(entries), /secret/);
});
