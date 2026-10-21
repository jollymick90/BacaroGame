import * as T from 'three';
import { veniceColors as c, type VeniceBuilder, type VenicePrimitives } from './venice-primitives';

function bricola(b: VeniceBuilder) {
  for (let i = 0; i < 3; i++) {
    b.add('cylinder', c.wood, (i - 1) * 0.23, -0.15, (i % 2) * 0.25, 0.23, 2.8, 0.23, (i - 1) * -0.13);
  }
  for (const y of [0.3, 0.65]) {
    b.add('cylinder', c.stone, 0, y, 0.1, 0.85, 0.12, 0.7);
  }
}

function mooring(b: VeniceBuilder, blue: boolean) {
  const stripe = blue ? c.blue : c.red;
  for (let i = 0; i < 7; i++) {
    b.add('cylinder', i % 2 ? c.white : stripe, 0, -0.8 + i * 0.4, 0, 0.34, 0.4, 0.34);
  }
  b.add('cone', stripe, 0, 1.95, 0, 0.48, 0.4, 0.48);
}

function gondola(b: VeniceBuilder) {
  b.add('hull', c.black, 0, -0.88, 0, 1.25, 0.5, 5.4);
  b.add('box', c.black, 0, -0.68, 0, 0.8, 0.1, 3.3);
  for (const z of [-0.9, 0.7]) {
    b.add('box', c.red, 0, -0.54, z, 0.8, 0.15, 0.4);
  }
  for (const side of [-1, 1]) {
    b.add('box', c.black, 0, -0.43, side * 2.35, 0.14, 0.9, 0.2, side * 0.18);
  }
  // The pale iron ferro distinguishes the bow from the stern.
  b.add('box', c.stone, 0, 0.02, 2.42, 0.11, 0.8, 0.25);
  for (let i = 0; i < 4; i++) {
    b.add('box', c.stone, 0, -0.2 + i * 0.15, 2.58, 0.11, 0.06, 0.35);
  }
  b.add('box', c.wood, 0.9, -0.43, -0.3, 0.07, 0.08, 3.2, 0, -0.3);
}

function lamp(b: VeniceBuilder) {
  b.add('cylinder', c.stone, 0, -0.1, 0, 0.65, 1.6, 0.65);
  b.add('cylinder', c.copper, 0, 1.7, 0, 0.12, 2.4, 0.12);
  b.add('box', c.copper, 0, 2.85, 0, 0.65, 0.12, 0.65);
  b.add('box', c.ochre, 0, 3.17, 0, 0.4, 0.55, 0.4);
  b.add('cone', c.copper, 0, 3.6, 0, 0.85, 0.4, 0.85, 0, Math.PI / 4);
  for (const x of [-0.24, 0.24]) {
    b.add('box', c.copper, x, 3.17, 0.24, 0.06, 0.65, 0.06);
  }
}

export function createVeniceProps(primitives: VenicePrimitives) {
  const root = new T.Group();
  const props: { root: T.Group; boat: boolean; phase: number }[] = [];
  const factories = [bricola, (b: VeniceBuilder) => mooring(b, true), gondola, lamp,
    bricola, (b: VeniceBuilder) => mooring(b, false)];
  for (let i = 0; i < 24; i++) {
    const builder = primitives.builder();
    const kind = i % factories.length;
    factories[kind](builder);
    const prop = builder.finish();
    const boat = kind === 2;
    const side = (i + Math.floor(i / factories.length)) % 2 ? 1 : -1;
    prop.position.x = side * (boat ? 7.8 : 5.4 + (i % 3) * 0.6);
    if (boat) {
      prop.rotation.y = side * 0.15;
    } else {
      prop.scale.y = 0.92 + (i % 3) * 0.08;
    }
    root.add(prop);
    props.push({ root: prop, boat, phase: i * 0.8 });
  }
  return {
    root,
    update(distance: number, time: number, reduced: boolean) {
      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        // Match the original scenery pool's 144-unit recycling period.
        prop.root.position.z = 10 - ((i * 6 - (distance % 144) + 144) % 144);
        if (prop.boat) {
          prop.root.position.y = reduced ? 0 : Math.sin(time * 1.1 + prop.phase) * 0.045;
          prop.root.rotation.z = reduced ? 0 : Math.sin(time * 0.8 + prop.phase) * 0.025;
        }
      }
    },
  };
}
