import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTtlCache } from './ttl-cache.ts';

test('reuses successful values until expiry, including zero', async context => {
  let now = 0;
  context.mock.method(Date, 'now', () => now);
  const cache = createTtlCache<number>(60_000);
  let reads = 0;
  const load = async () => reads++;
  assert.equal(await cache.get(load), 0);
  now = 59_999;
  assert.equal(await cache.get(load), 0);
  assert.equal(reads, 1);
  now = 60_000;
  assert.equal(await cache.get(load), 1);
});

test('concurrent callers share a pending read', async () => {
  const cache = createTtlCache<number>(60_000);
  let resolve!: (value: number) => void;
  let reads = 0;
  const load = () => {
    reads++;
    return new Promise<number>(done => { resolve = done; });
  };
  const first = cache.get(load);
  const second = cache.get(load);
  await Promise.resolve();
  resolve(7);
  assert.deepEqual(await Promise.all([first, second]), [7, 7]);
  assert.equal(reads, 1);
});

test('failed reads are retried rather than cached', async () => {
  const cache = createTtlCache<number>(60_000);
  await assert.rejects(cache.get(async () => { throw new Error('offline'); }));
  assert.equal(await cache.get(async () => 3), 3);
});

test('a saved value survives completion of an older read', async () => {
  const cache = createTtlCache<number>(60_000);
  let resolve!: (value: number) => void;
  const pending = cache.get(() => new Promise<number>(done => { resolve = done; }));
  await Promise.resolve();
  cache.set(9);
  resolve(1);
  await pending;
  assert.equal(await cache.get(async () => 2), 9);
});
