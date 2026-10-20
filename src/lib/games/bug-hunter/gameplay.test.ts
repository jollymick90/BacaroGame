import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Runner, makeRow, GAP, JUMP_TIME } from './mechanics.ts';

function runner() {
  const game = new Runner(() => 0.5);
  game.start();
  game.rows = [];
  return game;
}
function capture(game: Runner, kind: number) {
  const row = makeRow(0);
  row.kind = kind;
  row.z = 0;
  game.rows = [row];
  game.update(0.001);
}
test('speed increases every twenty active seconds and caps at sixteen', () => {
  const game = runner();
  game.time = 19.99;
  game.update(0.02);
  assert.equal(game.speed, 10);
  game.time = 100;
  game.update(0.01);
  assert.equal(game.speed, 16);
  game.pause();
  game.update(5);
  assert.equal(game.time, 100.01);
});
test('missed bugs cost one life each, even during collision immunity', () => {
  const game = runner();
  const row = makeRow(0);
  row.z = 2;
  game.rows = [row];
  game.invulnerable = 2;
  game.update(0.01);
  game.update(0.01);
  assert.equal(game.health, 2);
  const next = makeRow(1);
  next.z = 2;
  game.rows.push(next);
  game.update(0.01);
  assert.equal(game.health, 1);
});
test('one penalty per row, final life ends immediately, reset clears effects', () => {
  const game = runner();
  const row = makeRow(0);
  row.lane = 1;
  row.z = 0;
  row.obstacles = [{ lane: 0, kind: 0, hit: false }];
  game.rows = [row];
  game.update(0.01);
  row.z = 2;
  game.update(0.01);
  assert.equal(game.health, 2);
  game.health = 1;
  const missed = makeRow(1);
  missed.z = 2;
  game.rows.push(missed);
  game.update(0.01);
  assert.equal(game.phase, 'over');
  game.start();
  assert.equal(game.health, 3);
  assert.equal(game.score, 0);
  assert.deepEqual(game.charges, [0, 0, 0, 0]);
});
test('special rows require jumping and are reachable at maximum speed', () => {
  assert.ok(GAP / 16 > JUMP_TIME + 0.3);
  for (const index of [5, 9, 13, 17]) {
    const game = runner();
    const row = makeRow(index, () => 0.5);
    assert.ok(row.height > 2);
    assert.equal(row.obstacles.length, index % 8 === 5 ? 3 : 0);
    row.z = -6.8;
    game.time = 100;
    game.rows = [row];
    game.jump();
    for (let i = 0; i < 20; i++) game.update(0.05);
    assert.equal(game.caught, 1);
    assert.equal(game.health, 3);
  }
});
test('regression heals or stores exactly one cure and never resurrects', () => {
  const game = runner();
  for (let i = 0; i < 25; i++) capture(game, 1);
  assert.equal(game.healReady, true);
  game.hit();
  assert.equal(game.health, 3);
  assert.equal(game.healReady, false);
  game.health = 1;
  game.healReady = true;
  game.invulnerable = 0;
  game.hit();
  assert.equal(game.phase, 'over');
});
test('abilities activate at thresholds, freeze in pause and do not multiply charges', () => {
  const game = runner();
  for (let i = 0; i < 50; i++) capture(game, 0);
  assert.equal(game.shield, 8);
  game.hit();
  assert.equal(game.health, 3);
  for (let i = 0; i < 30; i++) capture(game, 2);
  assert.equal(game.slow, 6);
  for (let i = 0; i < 40; i++) capture(game, 3);
  assert.equal(game.double, 10);
  const score = game.score;
  capture(game, 1);
  assert.equal(game.score, score + 2);
  assert.equal(game.charges[1], 1);
  game.pause();
  const before = [game.shield, game.slow, game.double];
  game.update(1);
  assert.deepEqual([game.shield, game.slow, game.double], before);
  game.resume();
  game.rows = [];
  game.update(0.05);
  assert.ok(game.slow < before[1]);
  assert.equal(game.speed, 4.8);
  for (let i = 0; i < 210; i++) game.update(0.05);
  assert.equal(game.double, 0);
});
