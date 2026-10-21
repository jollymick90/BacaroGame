import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentationClock } from './presentation-clock.ts';

test('freeze preserves remaining delay and resume never catches up frozen time', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const clock = createPresentationClock();
  let calls = 0;
  clock.schedule(() => { calls++; }, 2400);
  context.mock.timers.tick(900);
  clock.setFrozen(true);
  context.mock.timers.tick(10000);
  assert.equal(calls, 0);
  clock.setFrozen(false);
  context.mock.timers.tick(1499);
  assert.equal(calls, 0);
  context.mock.timers.tick(1);
  assert.equal(calls, 1);
  clock.dispose();
});

test('timers scheduled while frozen and cancelled timers respect cleanup', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const clock = createPresentationClock();
  let calls = 0;
  clock.setFrozen(true);
  clock.schedule(() => { calls++; }, 1000);
  const cancelled = clock.schedule(() => { calls += 100; }, 500);
  clock.cancel(cancelled);
  context.mock.timers.tick(5000);
  clock.setFrozen(false);
  context.mock.timers.tick(1000);
  assert.equal(calls, 1);
  clock.schedule(() => { calls++; }, 1000);
  clock.dispose();
  context.mock.timers.tick(10000);
  assert.equal(calls, 1);
});
