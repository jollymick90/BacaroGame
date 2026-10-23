import * as T from 'three';
import { octopusHunter } from '../games/bug-hunter/octopus-hunter';
import { createVeniceEnvironment } from '../games/bug-hunter/venice-environment';

export function mountOctopusShowcase(host: HTMLElement, venice: boolean) {
  const renderer = new T.WebGLRenderer({ alpha: !venice, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(venice ? 48 : 38, 1, 0.1, 180);
  camera.position.set(0, venice ? 4.8 : 2.4, venice ? 10 : 4.2);
  camera.lookAt(0, venice ? 0.8 : 1, venice ? -12 : 0);
  scene.add(new T.HemisphereLight(0xfff4d7, 0x538b89, 2.4));
  const sun = new T.DirectionalLight(0xffe7c2, 2.5);
  sun.position.set(-8, 14, 8);
  scene.add(sun);
  const mascot = octopusHunter();
  if (venice) mascot.root.scale.setScalar(2);
  scene.add(mascot.root);
  const environment = venice ? createVeniceEnvironment() : null;
  const tiles: T.Group[] = [];
  if (environment) {
    scene.background = new T.Color(0xb8dde0);
    scene.fog = new T.Fog(0xb8dde0, 55, 155);
    scene.add(environment.root);
    for (let index = 0; index < 10; index++) {
      const tile = environment.createTrackTile();
      tile.position.z = 6 - index * 16;
      tiles.push(tile);
      scene.add(tile);
    }
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let disposed = false;
  let frameId = 0;
  let previous = 0;
  let elapsed = 0;
  function render(now: number) {
    frameId = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    if (!reduced.matches) elapsed += delta;
    mascot.animate(elapsed, 0, 0, false, false, reduced.matches);
    if (!venice) mascot.root.rotation.y = reduced.matches ? 0 : Math.sin(elapsed * 0.6) * 0.35;
    const distance = elapsed * 7;
    environment?.update(distance, elapsed, reduced.matches);
    tiles.forEach((tile, index) => { tile.position.z = 6 - index * 16 + distance % 16; });
    renderer.render(scene, camera);
    if (!reduced.matches) frameId = requestAnimationFrame(render);
  }
  function schedule() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    previous = 0;
    if (visible && !document.hidden && !disposed) frameId = requestAnimationFrame(render);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    schedule();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  resize();
  return {
    setVisible(value: boolean) { visible = value; schedule(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', schedule);
      const geometries = new Set<T.BufferGeometry>();
      const materials = new Set<T.Material>();
      scene.traverse(object => {
        if (object instanceof T.Mesh || object instanceof T.LineSegments) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach(material => materials.add(material));
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
