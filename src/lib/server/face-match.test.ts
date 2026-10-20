import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faceSimilarity, matchDecision, MIN_SIMILARITY } from './face-match.ts';

function vector(x: number, y = 0) {
  const result = Array(256).fill(0);
  result[0] = x;
  result[1] = y;
  return result;
}
test('identical and unrelated normalized MobileFace descriptors do not both score one', () => {
  assert.equal(faceSimilarity(vector(1), vector(1)), 1);
  assert.equal(faceSimilarity(vector(1), vector(0, 1)), 0);
  assert.equal(faceSimilarity(vector(1), vector(-1)), 0);
});
test('cosine comparison is independent of positive embedding scale', () => {
  const reference = vector(1);
  const candidate = vector(0.7, Math.sqrt(1 - 0.7 ** 2));
  assert.ok(Math.abs(faceSimilarity(reference, candidate) - 0.7) < 1e-10);
  assert.ok(
    Math.abs(
      faceSimilarity(
        vector(19),
        candidate.map((value) => value * 11),
      ) - 0.7,
    ) < 1e-10,
  );
});
test('threshold fifty percent admits weaker unique matches but still refuses genuine ambiguity', () => {
  assert.equal(MIN_SIMILARITY, 0.5);
  assert.equal(matchDecision(0.55, 0.3), 'match');
  assert.equal(matchDecision(0.5), 'match');
  assert.equal(matchDecision(0.499), 'no-match');
  assert.equal(matchDecision(0.9, 0.85), 'ambiguous');
  assert.equal(matchDecision(0.58, 0.5), 'match');
  assert.equal(matchDecision(1, 1), 'ambiguous');
  assert.equal(matchDecision(undefined), 'no-match');
});
test('invalid, zero and incompatible descriptors cannot become candidates', () => {
  assert.ok(!Number.isFinite(faceSimilarity(vector(0), vector(1))));
  assert.ok(!Number.isFinite(faceSimilarity([1], vector(1))));
  assert.ok(!Number.isFinite(faceSimilarity(vector(NaN), vector(1))));
});
