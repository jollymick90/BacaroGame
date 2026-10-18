import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createVersionedCache } from './versioned-cache.ts';

test('reuses data only while the shared version is unchanged', async () => {
  const cache = createVersionedCache<number>(60_000);
  let reads = 0;
  const load = async () => ++reads;
  assert.equal(await cache.get('v1', load), 1);
  assert.equal(await cache.get('v1', load), 1);
  assert.equal(await cache.get('v2', load), 2);
});

test('a slow old generation cannot replace a newer generation', async () => {
  const cache = createVersionedCache<number>(60_000);
  let finish!: (value: number) => void;
  const old = cache.get('old', () => new Promise<number>(resolve => { finish = resolve; }));
  await Promise.resolve();
  assert.equal(await cache.get('new', async () => 2), 2);
  finish(1);
  await old;
  assert.equal(await cache.get('new', async () => 3), 2);
});
