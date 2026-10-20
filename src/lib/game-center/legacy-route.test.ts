import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyGamePath } from './legacy-route.ts';

test('legacy QR fragments map only to known local game routes', () => {
  for (const path of ['/', '/bug-hunter', '/merge-battle', '/are-you-an-ai', '/bacarodex']) {
    assert.equal(legacyGamePath(`#${path}`), path);
  }
  assert.equal(legacyGamePath('#/unknown'), '/');
  assert.equal(legacyGamePath('#//example.com'), '/');
  assert.equal(legacyGamePath('#section'), null);
  assert.equal(legacyGamePath(''), null);
});
