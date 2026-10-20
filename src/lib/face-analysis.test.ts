import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFaceAnalysis, createFaceAnalyzer } from './face-analysis.ts';

function detection() {
  return {
    face: [
      {
        box: [20, 30, 80, 100],
        mesh: [
          [40, 50, 1],
          [60, 50, 2],
        ],
        embedding: Array(256).fill(0.1),
      },
    ],
  };
}
test('copies real landmarks and descriptor without retaining library arrays', () => {
  const result = detection();
  const analysis = copyFaceAnalysis(result, 200, 160);
  result.face[0].mesh[0][0] = 99;
  result.face[0].embedding[0] = 99;
  assert.deepEqual(analysis.landmarks[0], [40, 50]);
  assert.equal(analysis.embedding[0], 0.1);
  assert.equal(analysis.width, 200);
  assert.deepEqual(analysis.box, [20, 30, 80, 100]);
});
test('no face, multiple faces and invalid descriptors give actionable errors', () => {
  assert.throws(() => copyFaceAnalysis({ face: [] }, 200, 160), /Nessun volto/);
  assert.throws(
    () => copyFaceAnalysis({ face: [...detection().face, ...detection().face] }, 200, 160),
    /Più volti/,
  );
  const result = detection();
  result.face[0].embedding = Array(256).fill(0);
  assert.throws(() => copyFaceAnalysis(result, 200, 160), /leggibile/);
});
test('shared detector serializes requests and clears state even after failed detection', async () => {
  let active = 0;
  let maximum = 0;
  let cleared = 0;
  let calls = 0;
  const analyzer = createFaceAnalyzer(async () => ({
    async detect() {
      active++;
      maximum = Math.max(maximum, active);
      const current = ++calls;
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      if (current === 1) throw new Error('inference failed');
      return detection();
    },
    clear() {
      cleared++;
    },
  }));
  const photo = { width: 200, height: 160 };
  const results = await Promise.allSettled([analyzer(photo), analyzer(photo)]);
  assert.equal(maximum, 1);
  assert.equal(cleared, 2);
  assert.equal(results[0].status, 'rejected');
  assert.equal(results[1].status, 'fulfilled');
});

test('overlay uses the actual inference dimensions when Human resizes the input', () => {
  const result = { ...detection(), width: 400, height: 320 };
  const analysis = copyFaceAnalysis(result, 800, 640);
  assert.equal(analysis.width, 400);
  assert.equal(analysis.height, 320);
});
