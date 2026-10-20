import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectTrials, mathOutcome, TimedLoading } from './trials.ts';

test('three stable, distinct trials drawn from the whole pool', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 100; i++) {
    let seed = i + 1;
    const selected = selectTrials(() => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    });
    assert.equal(selected.length, 3);
    assert.equal(new Set(selected.map((trial) => trial.id)).size, 3);
    selected.forEach((trial) => seen.add(trial.id));
  }
  assert.equal(seen.size, 4);
});
test('math trap rejects invalid input, accepts human error, flags correct solution', () => {
  for (const input of ['', ' ', 'ciao', 'Infinity', '0x2a']) assert.equal(mathOutcome(input), null);
  assert.equal(mathOutcome('42'), 'robot');
  assert.equal(mathOutcome('42,0'), 'robot');
  assert.equal(mathOutcome('41'), 'human');
});
test('loading needs five timely confirmations; errors never destroy progress', () => {
  const loading = new TimedLoading();
  assert.equal(loading.confirm(0), false);
  loading.schedule(0, () => 0);
  assert.equal(loading.confirm(799), false);
  assert.equal(loading.confirm(800), true);
  assert.equal(loading.progress, 20);
  assert.equal(loading.confirm(801), false);
  loading.schedule(1000, () => 0);
  assert.equal(loading.confirm(3001), false);
  assert.equal(loading.progress, 20);
  for (let i = 0; i < 4; i++) {
    loading.schedule(4000 + i * 3000, () => 0);
    assert.equal(loading.confirm(4800 + i * 3000), true);
  }
  assert.equal(loading.progress, 100);
  assert.equal(loading.confirm(20000), false);
});
test('relaxed timing still requires five confirmations', () => {
  const loading = new TimedLoading();
  loading.relaxed = true;
  for (let i = 0; i < 5; i++) {
    loading.schedule(i * 100000, () => 0);
    assert.equal(loading.confirm(i * 100000 + 90000), true);
  }
  assert.equal(loading.progress, 100);
});
