import * as T from 'three';

export const veniceColors = {
  stone: 0xf2dec0,
  brick: 0xad5945,
  ochre: 0xdca753,
  salmon: 0xd98a73,
  plaster: 0xeacaa0,
  copper: 0x568e80,
  roof: 0x9c4d3c,
  window: 0x305957,
  wood: 0x775643,
  black: 0x263a3b,
  white: 0xffedcf,
  red: 0xb95748,
  blue: 0x517c91,
};

type Shape = 'box' | 'cylinder' | 'cone' | 'dome' | 'arch' | 'hull';
type Batch = { geometry: T.BufferGeometry; material: T.Material; matrices: T.Matrix4[] };

// One resource pool per mounted game: never share disposable resources across mounts.
export function createVenicePrimitives() {
  const geometries: Record<Shape, T.BufferGeometry> = {
    box: new T.BoxGeometry(1, 1, 1),
    cylinder: new T.CylinderGeometry(0.5, 0.5, 1, 8),
    cone: new T.ConeGeometry(0.5, 1, 4),
    dome: new T.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    arch: new T.SphereGeometry(0.5, 6, 2, 0, Math.PI * 2, 0, Math.PI / 2),
    hull: new T.SphereGeometry(0.5, 8, 4),
  };
  const materials = new Map<number, T.MeshLambertMaterial>();
  const transform = new T.Object3D();

  function builder() {
    const batches = new Map<string, Batch>();
    function add(
      shape: Shape, color: number,
      x: number, y: number, z: number,
      width: number, height: number, depth: number,
      rotationZ = 0, rotationY = 0,
    ) {
      let material = materials.get(color);
      if (!material) {
        material = new T.MeshLambertMaterial({ color, flatShading: true });
        materials.set(color, material);
      }
      const key = `${shape}:${color}`;
      let batch = batches.get(key);
      if (!batch) {
        batch = { geometry: geometries[shape], material, matrices: [] };
        batches.set(key, batch);
      }
      transform.position.set(x, y, z);
      transform.scale.set(width, height, depth);
      transform.rotation.set(0, rotationY, rotationZ);
      transform.updateMatrix();
      batch.matrices.push(transform.matrix.clone());
    }
    function finish() {
      const group = new T.Group();
      for (const batch of batches.values()) {
        const mesh = new T.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
        batch.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
        mesh.computeBoundingSphere();
        group.add(mesh);
      }
      return group;
    }
    return { add, finish };
  }
  return { builder };
}

export type VenicePrimitives = ReturnType<typeof createVenicePrimitives>;
export type VeniceBuilder = ReturnType<VenicePrimitives['builder']>;
