import * as T from 'three';
import { createVenicePrimitives } from './venice-primitives';
import { createVeniceSkyline } from './venice-skyline';
import { createVeniceWater } from './venice-water';
import { createVeniceProps } from './venice-props';
import { createVeniceBoardwalkTile } from './venice-boardwalk';

export function createVeniceEnvironment() {
  const primitives = createVenicePrimitives();
  const root = new T.Group();
  root.name = 'VeniceEnvironment';
  const water = createVeniceWater(primitives);
  const props = createVeniceProps(primitives);
  root.add(water.root, createVeniceSkyline(primitives), props.root);
  // Resource disposal belongs to mountRunner's scene traversal, including the
  // shared geometries/materials. No additional animation loop or event listeners.
  return {
    root,
    createTrackTile() {
      return createVeniceBoardwalkTile(primitives);
    },
    update(distance: number, time: number, reduced: boolean) {
      water.update(time, reduced);
      props.update(distance, time, reduced);
    },
  };
}
