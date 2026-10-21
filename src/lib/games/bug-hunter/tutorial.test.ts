import test from 'node:test';
import assert from 'node:assert/strict';
import { Runner } from './mechanics.ts';
import { RunnerTutorial } from './tutorial.ts';

function setup() {
  const runner = new Runner(() => 0.5);
  const tutorial = new RunnerTutorial(runner);
  runner.onEvent = event => tutorial.onEvent(event);
  return { runner, tutorial };
}
function simulate(runner: Runner, tutorial: RunnerTutorial, seconds = 8) {
  for (let frame = 0; frame < seconds * 60; frame++) {
    runner.update(1 / 60);
    tutorial.update();
  }
}

test('miss and collision demos use real penalties once and can be replayed', () => {
  const { runner, tutorial } = setup();
  assert.equal(tutorial.snapshot().step, 'welcome');
  tutorial.next();
  simulate(runner, tutorial);
  assert.equal(runner.health, 2);
  assert.equal(runner.caught, 0);
  assert.equal(runner.phase, 'paused');
  assert.equal(tutorial.snapshot().complete, true);
  tutorial.replay();
  assert.equal(runner.health, 3);
  simulate(runner, tutorial);
  assert.equal(runner.health, 2);
  tutorial.next();
  assert.deepEqual(runner.rows[0].obstacles.map(obstacle => obstacle.kind), [0, 1, 2]);
  simulate(runner, tutorial);
  assert.equal(runner.health, 1);
  assert.equal(tutorial.snapshot().complete, true);
});

test('three identical Production bugs unlock a real power, not a UI-only animation', () => {
  const { runner, tutorial } = setup();
  tutorial.next();
  tutorial.next();
  assert.equal(tutorial.snapshot().step, 'miss', 'cannot skip an unfinished demo');
  simulate(runner, tutorial);
  tutorial.next();
  simulate(runner, tutorial);
  tutorial.next();
  simulate(runner, tutorial);
  assert.deepEqual(runner.collection, [0, 0, 3, 0]);
  assert.equal(runner.charges[2], 0);
  assert.ok(runner.slow > 0);
  assert.ok(Math.abs(runner.speed - (8 + runner.time / 10) * 0.6) < 0.00001);
  assert.equal(tutorial.snapshot().complete, true);
});

test('heart demo opens the real question phase and rewards only a correct response', () => {
  const { runner, tutorial } = setup();
  for (let step = 0; step < 3; step++) {
    tutorial.next();
    simulate(runner, tutorial);
  }
  tutorial.next();
  simulate(runner, tutorial);
  assert.equal(runner.phase, 'question');
  assert.equal(runner.health, 1);
  assert.equal(runner.resolveHeart(false), true);
  tutorial.resolveHeart(false);
  assert.equal(runner.health, 1);
  assert.equal(tutorial.snapshot().correct, false);
  tutorial.replay();
  simulate(runner, tutorial);
  assert.equal(runner.resolveHeart(true), true);
  tutorial.resolveHeart(true);
  assert.equal(runner.health, 2);
  assert.equal(runner.resolveHeart(true), false);
  assert.equal(tutorial.snapshot().correct, true);
  runner.start();
  assert.equal(runner.health, 3);
  assert.equal(runner.score, 0);
  assert.equal(runner.slow, 0);
  assert.deepEqual(runner.collection, [0, 0, 0, 0]);
});
