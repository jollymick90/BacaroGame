import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Runner, overlaps, jumpHeight, makeRow } from './mechanics.ts';
test('permissive AABB and sinusoidal jump', () => {
  assert.ok(overlaps(0, 0, 0, 0, 0, 1));
  assert.ok(!overlaps(0, 2, 0, 0, 0, 1));
  assert.equal(jumpHeight(0), 0);
  assert.ok(jumpHeight(0.425) > 2);
  assert.equal(jumpHeight(0.85), 0);
});
test('rows have either a clear lane or a jumpable route for 1000 patterns', () => {
  for (let i = 0; i < 1000; i++) {
    const row = makeRow(i, () => ((i * 37) % 100) / 100);
    if (row.height < 2) {
      assert.ok(row.obstacles.length <= 2);
      assert.ok(!row.obstacles.some((o) => o.lane === row.lane));
    } else {
      assert.ok(row.obstacles.length === 0 || row.obstacles.length === 3);
    }
  }
});
test('intro pause restart and exactly three errors', () => {
  const r = new Runner(() => 0.5);
  r.update(0.05);
  assert.equal(r.distance, 0);
  r.start();
  r.pause();
  r.update(0.05);
  assert.equal(r.distance, 0);
  r.resume();
  for (let i = 0; i < 3; i++) {
    r.invulnerable = 0;
    r.hit();
    assert.equal(r.health, 2 - i);
  }
  assert.equal(r.phase, 'over');
  r.start();
  assert.equal(r.health, 3);
  assert.equal(r.distance, 0);
  assert.deepEqual(r.collection, [0, 0, 0, 0]);
});
test('capture each species once, including translucent Heisenbug; jump clears obstacle', () => {
  const r = new Runner(() => 0.5);
  r.start();
  for (let k = 0; k < 4; k++) {
    const row = r.rows[0];
    row.z = 0;
    row.lane = 0;
    row.kind = k;
    row.caught = false;
    row.obstacles = [];
    r.update(0.001);
    r.update(0.001);
  }
  assert.deepEqual(r.collection, [1, 1, 1, 1]);
  assert.equal(r.caught, 4);
  r.jump();
  for (let i = 0; i < 8; i++) r.update(0.05);
  r.rows[0].z = 0;
  r.rows[0].obstacles = [{ lane: 0, kind: 0, hit: false }];
  r.update(0.01);
  assert.equal(r.health, 3);
});
test('movement is bounded and pause freezes jump and world', () => {
  const r = new Runner();
  r.start();
  r.move(-1);
  r.move(-1);
  assert.equal(r.lane, -1);
  r.jump();
  r.update(0.1);
  r.pause();
  const before = [r.distance, r.y, r.rows[0].z];
  r.update(1);
  assert.deepEqual([r.distance, r.y, r.rows[0].z], before);
});
test('actual collisions damage once and invulnerability protects subsequent contact', () => {
  const r = new Runner(() => 0.5);
  r.start();
  const row = r.rows[0];
  row.caught = true;
  row.z = 0;
  row.obstacles = [{ lane: 0, kind: 1, hit: false }];
  r.update(0.01);
  assert.equal(r.health, 2);
  r.update(0.01);
  assert.equal(r.health, 2);
  row.obstacles.push({ lane: 0, kind: 0, hit: false });
  r.update(0.01);
  assert.equal(r.health, 2);
});
test('ten minutes of generated route remain navigable at capped speed with bounded rows', () => {
  let seed = 42;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const r = new Runner(rng);
  r.start();
  for (let i = 0; i < 12000; i++) {
    const next = r.rows.find((row) => row.z < -1 && row.z > -12);
    if (next) {
      r.move(Math.sign(next.lane - r.lane));
      if (next.height > 2 && next.z >= -r.speed * 0.425 && r.jumpTime < 0) r.jump();
    }
    r.update(0.05);
  }
  assert.equal(r.health, 3);
  assert.equal(r.phase, 'running');
  assert.equal(r.speed, 16);
  assert.equal(r.rows.length, 8);
  assert.ok(r.caught > 200);
});
