import { veniceColors as c, type VeniceBuilder, type VenicePrimitives } from './venice-primitives';

function palace(b: VeniceBuilder, x: number, z: number, width: number, height: number, color: number) {
  b.add('box', color, x, height / 2 - 0.7, z, width, height, 4);
  b.add('box', c.stone, x, 0.1, z + 2.05, width + 0.2, 0.4, 0.3);
  b.add('cone', c.roof, x, height - 0.2, z, width * 1.48, 1.7, 5.8, 0, Math.PI / 4);
  for (let floor = 0; floor < 3; floor++) {
    for (let column = 0; column < 3; column++) {
      const wx = x + (column - 1) * width * 0.25;
      const wy = 1.2 + floor * (height - 2) / 3;
      b.add('box', c.stone, wx, wy, z + 2.08, width * 0.16, 1.65, 0.15);
      b.add('box', c.window, wx, wy, z + 2.18, width * 0.11, 1.3, 0.1);
      b.add('arch', c.window, wx, wy + 0.65, z + 2.18, width * 0.11, 0.6, 0.12);
    }
  }
  b.add('box', c.brick, x + width * 0.28, height + 0.4, z, 0.5, 1.6, 0.6);
}

function campanile(b: VeniceBuilder, x: number, z: number, scale = 1) {
  const tower = (shape: Parameters<VeniceBuilder['add']>[0], color: number, y: number, w: number, h: number, d: number) => {
    b.add(shape, color, x, y * scale - 0.7, z, w * scale, h * scale, d * scale);
  };
  tower('box', c.brick, 9, 3, 18, 3);
  for (const offset of [-1.2, 1.2]) {
    b.add('box', c.salmon, x + offset * scale, 8.3 * scale, z + 1.51 * scale, 0.16 * scale, 16 * scale, 0.12);
  }
  tower('box', c.stone, 18.4, 3.6, 1, 3.6);
  tower('box', c.window, 20, 2.9, 2.5, 2.9);
  for (const offset of [-1.45, 0, 1.45]) {
    b.add('box', c.stone, x + offset * scale, 19.3 * scale, z + 1.5 * scale, 0.28 * scale, 2.5 * scale, 0.3);
  }
  tower('box', c.stone, 21.5, 3.8, 0.7, 3.8);
  tower('box', c.plaster, 22.4, 3.1, 1.3, 3.1);
  tower('cone', c.copper, 25.3, 4.5, 4.8, 4.5);
  tower('cylinder', c.ochre, 28, 0.18, 1, 0.18);
}

function salute(b: VeniceBuilder, x: number, z: number) {
  b.add('cylinder', c.stone, x, 2.8, z, 10, 7, 10);
  b.add('cylinder', c.plaster, x, 7, z, 7, 2, 7);
  b.add('dome', c.stone, x, 8, z, 9, 9, 9);
  b.add('cylinder', c.plaster, x, 12.9, z, 1.1, 1.4, 1.1);
  b.add('dome', c.copper, x, 13.6, z, 1.6, 1.6, 1.6);
  b.add('cylinder', c.ochre, x, 14.8, z, 0.12, 0.9, 0.12);
  b.add('cylinder', c.stone, x + 5.3, 3, z - 2, 4, 7, 4);
  b.add('dome', c.plaster, x + 5.3, 6.5, z - 2, 5.5, 5.5, 5.5);
  for (const side of [-1, 1]) {
    b.add('box', c.stone, x + side * 5, 5, z - 3, 1.6, 11, 1.8);
    b.add('cone', c.copper, x + side * 5, 11, z - 3, 2.2, 2, 2.2);
    for (let i = 0; i < 3; i++) {
      b.add('box', c.plaster, x + side * (2 + i), 2.3, z + 4.7, 0.4, 5.5, 0.6);
    }
  }
  b.add('box', c.window, x, 1.5, z + 5.05, 1.7, 4, 0.2);
  b.add('arch', c.window, x, 3.5, z + 5.05, 1.7, 1.7, 0.2);
}

export function createVeniceSkyline(primitives: VenicePrimitives) {
  const far = primitives.builder();
  // The central water corridor stays open. Landmarks flank its vanishing point,
  // close enough to the axis to remain visible in a portrait camera.
  campanile(far, -9.3, -83);
  salute(far, 13, -76);
  for (const side of [-1, 1]) {
    far.add('box', c.stone, side * 35, -0.85, -87, 58, 0.7, 30);
    for (let i = 0; i < 7; i++) {
      palace(far, side * (24 + i * 6), -85 - (i % 3) * 5, 5.5, 5 + (i % 3) * 1.4, [c.ochre, c.salmon, c.plaster][i % 3]);
    }
    campanile(far, side * 44, -94, 0.55);
  }
  const near = primitives.builder();
  for (const side of [-1, 1]) {
    near.add('box', c.stone, side * 29, -0.7, -56, 22, 0.9, 10);
    for (let i = 0; i < 4; i++) {
      palace(near, side * (22 + i * 6), -59 - (i % 2) * 2, 5.2, 4.5 + (i % 3), [c.salmon, c.ochre, c.brick][i % 3]);
    }
  }
  const root = far.finish();
  root.add(near.finish());
  return root;
}
