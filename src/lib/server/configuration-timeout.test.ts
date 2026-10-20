import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withConfigurationTimeout } from './configuration-timeout.ts';

test('an unresponsive configuration read rejects after three seconds', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const result = withConfigurationTimeout(() => new Promise<never>(() => {}));
  const rejected = assert.rejects(result, /Configurazione: tempo di attesa esaurito/);
  t.mock.timers.tick(3000);
  await rejected;
});

test('successful configuration reads preserve their result', async () => {
  assert.equal(await withConfigurationTimeout(async () => 42), 42);
});
