import * as T from 'three';
import type { VenicePrimitives } from './venice-primitives';

export function createVeniceWater(primitives: VenicePrimitives) {
  const surface = primitives.builder();
  surface.add('box', 0x388f8a, 0, -1.15, -70, 300, 0.16, 240);
  const root = surface.finish();
  const glints = primitives.builder();
  // Deterministic broken bands, kept outside the track footprint.
  for (let i = 0; i < 100; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (5.8 + ((i * 17) % 70));
    const z = 12 - ((i * 23) % 150);
    glints.add('box', i % 3 ? 0x4faaa0 : 0x79bcb0, x, -1.055, z, 0.8 + (i % 4), 0.015, 0.08);
  }
  const shimmer = glints.finish();
  root.add(shimmer);
  return {
    root,
    update(time: number, reduced: boolean) {
      shimmer.position.x = reduced ? 0 : Math.sin(time * 0.35) * 0.16;
      shimmer.position.z = reduced ? 0 : Math.cos(time * 0.22) * 0.25;
    },
  };
}
