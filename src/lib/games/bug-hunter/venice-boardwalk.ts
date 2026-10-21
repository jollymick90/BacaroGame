import * as T from 'three';
import { veniceColors as c, type VenicePrimitives } from './venice-primitives';

export function createVeniceBoardwalkTile(primitives: VenicePrimitives) {
  const tile = primitives.builder();
  // Preserve the original surface, lane markings, curbs and 16-unit tile length.
  tile.add('box', 0xe7bc91, 0, -0.14, 0, 8, 0.2, 16);
  for (const x of [-1.25, 1.25]) {
    tile.add('box', 0xfff8de, x, 0, 0, 0.055, 0.025, 12);
  }
  for (const x of [-4.3, 4.3]) {
    tile.add('box', c.stone, x, 0, 0, 0.5, 0.4, 16);
    tile.add('box', c.wood, x, -0.65, -4, 0.3, 0.9, 0.3);
    tile.add('box', c.wood, x, -0.65, 4, 0.3, 0.9, 0.3);
  }
  for (let seam = -6; seam <= 6; seam += 4) {
    tile.add('box', 0xcda67f, 0, -0.032, seam, 7.95, 0.01, 0.025);
  }
  const root = tile.finish();
  root.traverse(object => {
    if (object instanceof T.Mesh) object.receiveShadow = true;
  });
  return root;
}
