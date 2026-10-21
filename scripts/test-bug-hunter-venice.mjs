import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  const page = await browser.newPage();
  await page.goto(origin);
  const report = await page.evaluate(async () => {
    const T = await import('/node_modules/three/build/three.module.js');
    const { createVeniceEnvironment } = await import('/src/lib/games/bug-hunter/venice-environment.ts');
    const environment = createVeniceEnvironment();
    const scene = new T.Scene();
    scene.add(environment.root, new T.HemisphereLight());
    const camera = new T.PerspectiveCamera(58, 1280 / 900, 0.1, 180);
    camera.position.set(0, 5.8, 9);
    camera.lookAt(0, 1, -14);
    const renderer = new T.WebGLRenderer();
    renderer.setSize(640, 450);
    environment.update(0, 0, false);
    renderer.render(scene, camera);
    const initialMemory = { ...renderer.info.memory };
    const initialObjects = [];
    scene.traverse(object => initialObjects.push(object.uuid));
    const props = environment.root.children[2].children;
    const outsideTrack = props.every(prop => Math.abs(prop.position.x) >= 5.4);
    const beforeRecycle = props.map(prop => prop.position.z);
    environment.update(144, 0, false);
    const recycleMatches = props.every((prop, index) => prop.position.z === beforeRecycle[index]);
    environment.update(25, 0, true);
    const reducedBefore = environment.root.toJSON();
    environment.update(25, 400, true);
    const reducedStable = JSON.stringify(reducedBefore) === JSON.stringify(environment.root.toJSON());
    // Exercise ten minutes of travel, including multiple recycling boundaries.
    for (let frame = 0; frame < 36000; frame++) {
      environment.update(frame / 60 * 40, frame / 60, false);
    }
    renderer.render(scene, camera);
    const finalObjects = [];
    scene.traverse(object => finalObjects.push(object.uuid));
    const report = {
      initialMemory,
      finalMemory: { ...renderer.info.memory },
      sameObjects: JSON.stringify(initialObjects) === JSON.stringify(finalObjects),
      outsideTrack,
      recycleMatches,
      reducedStable,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      bounded: props.every(prop => prop.position.z >= -134 && prop.position.z <= 10),
    };
    const tile = environment.createTrackTile();
    const bounds = new T.Box3().setFromObject(tile);
    report.trackWidth = bounds.max.x - bounds.min.x;
    report.trackLength = bounds.max.z - bounds.min.z;
    report.trackBatches = tile.children.length;
    scene.add(tile);
    const geometries = new Set();
    const materials = new Set();
    scene.traverse(object => {
      if (object.isInstancedMesh) object.dispose();
      if (!object.isMesh) return;
      geometries.add(object.geometry);
      materials.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    return report;
  });
  assert.ok(Math.abs(report.trackWidth - 9.1) < 0.001, 'original curbs keep their footprint');
  assert.equal(report.trackLength, 16, 'track tile length remains unchanged');
  assert.ok(report.trackBatches <= 5, 'boardwalk details are batched');
  assert.ok(report.outsideTrack, 'decorations remain outside the track');
  assert.ok(report.recycleMatches, 'scenery repeats without drift after a full cycle');
  assert.ok(report.reducedStable, 'reduced motion disables water and gondola oscillation');
  assert.ok(report.sameObjects, 'ten minutes of animation create no scene objects');
  assert.ok(report.bounded, 'recycled props stay within the scenery pool');
  assert.deepEqual(report.finalMemory, report.initialMemory);
  assert.ok(report.calls < 150, `environment draw call budget exceeded: ${report.calls}`);
  assert.ok(report.triangles < 30000, `environment triangle budget exceeded: ${report.triangles}`);
  console.log('Venice: recycling, reduced motion, track clearance and stable resources PASS', report);
} finally {
  await browser.close();
}
