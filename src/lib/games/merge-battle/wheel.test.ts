import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rotationDelta, nearestCharacter } from './wheel.ts';

test('drag crosses the angular seam continuously in both directions', () => {
  assert.equal(rotationDelta(179, -179), 2);
  assert.equal(rotationDelta(-179, 179), -2);
  assert.equal(rotationDelta(20, -40), -60);
});

test('release snaps to the closest available character without another revolution', () => {
  const ids = [3, 7, 11, 2];
  assert.deepEqual(nearestCharacter(87, ids, []), { id: 2, rotation: 90 });
  assert.deepEqual(nearestCharacter(-87, ids, []), { id: 7, rotation: -90 });
  assert.deepEqual(nearestCharacter(807, ids, []), { id: 2, rotation: 810 });
  assert.deepEqual(nearestCharacter(80, ids, [2]), { id: 3, rotation: 0 });
  assert.equal(nearestCharacter(80, ids, ids), null);
});
