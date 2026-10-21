import * as T from 'three';

type Tentacle = {
  pivot: T.Group;
  curl: T.Group;
  angle: number;
  phase: number;
};

/** Bacaro's front faces +Z, towards the runner camera. */
export function octopusHunter() {
  const root = new T.Group();
  const sphere = new T.SphereGeometry(1, 12, 8);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 10);
  const cube = new T.BoxGeometry(1, 1, 1);
  const glassesRing = new T.TorusGeometry(0.255, 0.045, 6, 16);
  const orange = new T.MeshPhongMaterial({ color: 0xff850e, flatShading: true });
  const cream = new T.MeshPhongMaterial({ color: 0xffdab1, flatShading: true });
  const teal = new T.MeshPhongMaterial({ color: 0x073c46, flatShading: true });
  const dark = new T.MeshPhongMaterial({ color: 0x071b24, flatShading: true });
  const white = new T.MeshPhongMaterial({ color: 0xfff9e9 });
  const gold = new T.MeshPhongMaterial({ color: 0xffca68, flatShading: true });

  function piece(
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
  ) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(scaleX, scaleY, scaleZ);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const body = new T.Group();
  root.add(body);
  piece(body, sphere, teal, 0, 0.95, 0, 0.52, 0.48, 0.39);
  // Hood behind the head, with a visible rolled collar and hoodie pocket.
  piece(body, sphere, teal, 0, 1.32, -0.13, 0.56, 0.32, 0.36);
  piece(body, sphere, dark, 0, 1.19, 0.29, 0.43, 0.105, 0.13);
  piece(body, sphere, teal, 0, 0.83, 0.35, 0.29, 0.16, 0.06);
  for (const side of [-1, 1]) {
    piece(body, cylinder, cream, side * 0.12, 1.08, 0.392, 0.014, 0.2, 0.014);
  }

  const head = new T.Group();
  head.position.set(0, 1.62, 0.04);
  body.add(head);
  piece(head, sphere, orange, 0, 0, 0, 0.59, 0.56, 0.47);
  for (const side of [-1, 1]) {
    piece(head, sphere, white, side * 0.263, -0.015, 0.411, 0.22, 0.24, 0.095);
    piece(head, sphere, dark, side * 0.263, -0.025, 0.49, 0.105, 0.145, 0.037);
    piece(head, sphere, white, side * 0.263 - 0.032, 0.025, 0.525, 0.032, 0.043, 0.012);
    const frame = piece(head, glassesRing, dark, side * 0.27, -0.005, 0.493, 1, 1.02, 1);
    frame.rotation.z = -side * 0.07;
    const temple = piece(head, cube, dark, side * 0.52, 0.055, 0.25, 0.06, 0.07, 0.46);
    temple.rotation.y = -side * 0.22;
    const brow = piece(head, sphere, dark, side * 0.26, 0.3, 0.378, 0.13, 0.035, 0.025);
    brow.rotation.z = side * 0.2;
  }
  piece(head, cube, dark, 0, 0.025, 0.51, 0.12, 0.065, 0.06);
  piece(head, sphere, dark, 0, -0.3, 0.394, 0.13, 0.075, 0.035);
  piece(head, sphere, cream, 0, -0.325, 0.424, 0.075, 0.027, 0.012);

  const tentacles: Tentacle[] = [];
  for (let index = 0; index < 6; index++) {
    const angle = (index / 6) * Math.PI * 2;
    const pivot = new T.Group();
    pivot.position.set(Math.sin(angle) * 0.3, 0.57, Math.cos(angle) * 0.22);
    pivot.rotation.y = angle;
    body.add(pivot);
    piece(pivot, sphere, orange, 0, -0.18, 0.16, 0.145, 0.27, 0.2);
    const curl = new T.Group();
    curl.position.set(0, -0.34, 0.24);
    pivot.add(curl);
    piece(curl, sphere, orange, 0, -0.035, 0.16, 0.125, 0.135, 0.27);
    piece(curl, sphere, orange, 0, 0.055, 0.36, 0.095, 0.15, 0.1);
    for (let sucker = 0; sucker < 3; sucker++) {
      piece(curl, sphere, cream, 0, 0.057 + sucker * 0.025, 0.04 + sucker * 0.12, 0.065, 0.035, 0.055);
    }
    tentacles.push({ pivot, curl, angle, phase: index * 1.7 });
  }

  // Two tool-holding tentacles emerge from the hoodie sleeves.
  for (const side of [-1, 1]) {
    piece(body, sphere, teal, side * 0.43, 1.02, 0.04, 0.2, 0.28, 0.23);
  }
  const toolArm = new T.Group();
  toolArm.position.set(0.48, 1.02, 0.12);
  body.add(toolArm);
  piece(toolArm, sphere, orange, 0.11, -0.15, 0.08, 0.16, 0.23, 0.15);
  piece(toolArm, sphere, cream, 0.12, -0.2, 0.225, 0.065, 0.07, 0.025);
  const net = new T.Group();
  net.position.set(0.17, -0.2, 0.11);
  toolArm.add(net);
  piece(net, cylinder, gold, 0, 0.36, 0, 0.03, 0.94, 0.03);
  const hoopGeometry = new T.TorusGeometry(0.32, 0.035, 5, 16);
  piece(net, hoopGeometry, gold, 0, 0.98, 0, 1, 1, 1);
  const meshMaterial = new T.MeshBasicMaterial({
    color: 0xd8ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.38,
  });
  const basketGeometry = new T.SphereGeometry(0.3, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  const basket = piece(net, basketGeometry, meshMaterial, 0, 0.98, 0, 1, 1, 1);
  basket.rotation.x = Math.PI / 2;

  const glass = new T.MeshPhongMaterial({ color: 0x9beff0, transparent: true, opacity: 0.65 });
  const jar = piece(body, cylinder, glass, -0.54, 0.89, 0.38, 0.18, 0.42, 0.18);
  piece(body, cylinder, gold, -0.54, 1.12, 0.38, 0.2, 0.065, 0.2);
  const jarArm = new T.Group();
  jarArm.position.set(-0.46, 1, 0.08);
  body.add(jarArm);
  piece(jarArm, sphere, orange, -0.08, -0.22, 0.2, 0.15, 0.26, 0.16);
  piece(jarArm, sphere, orange, -0.08, -0.27, 0.32, 0.22, 0.12, 0.18);
  piece(jarArm, sphere, cream, -0.19, -0.29, 0.45, 0.06, 0.055, 0.025);
  piece(jarArm, sphere, cream, -0.06, -0.3, 0.47, 0.06, 0.055, 0.025);

  return {
    root,
    net,
    jar,
    animate(time: number, y: number, capture: number, hit: boolean, over: boolean, reduced: boolean) {
      const motion = reduced || over ? 0 : 1;
      root.position.y = y;
      root.rotation.z = 0;
      if (over) {
        root.rotation.z = 1.1;
      } else if (hit && !reduced) {
        root.rotation.z = Math.sin(time * 30) * 0.1;
      }
      body.position.y = Math.sin(time * 8) * 0.025 * motion;
      head.rotation.z = Math.sin(time * 3) * 0.035 * motion;
      for (let index = 0; index < tentacles.length; index++) {
        const tentacle = tentacles[index];
        tentacle.pivot.rotation.x = Math.sin(time * 8 + tentacle.phase) * 0.16 * motion;
        tentacle.pivot.rotation.y = tentacle.angle + Math.sin(time * 4 + tentacle.phase) * 0.08 * motion;
        tentacle.curl.rotation.x = Math.cos(time * 8 + tentacle.phase) * 0.2 * motion;
      }
      toolArm.rotation.x = Math.sin(time * 4) * 0.07 * motion;
      jarArm.rotation.x = Math.sin(time * 4 + Math.PI) * 0.06 * motion;
      toolArm.rotation.z = -0.08;
      if (capture > 0) {
        toolArm.rotation.x = -0.3;
        toolArm.rotation.z = -0.15 - Math.sin(capture * Math.PI) * 0.3;
      }
    },
  };
}
