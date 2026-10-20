import * as T from 'three';
import { createBox as box, createGroup as group, createLimb, sinusoid } from './primitives';
import { bugs } from './content';
export function sphere(radius: number, color: number, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(
    new T.SphereGeometry(radius, 10, 7),
    new T.MeshPhongMaterial({ color, flatShading: true }),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
function ring(radius: number, color: number) {
  return new T.Mesh(new T.TorusGeometry(radius, 0.055, 5, 16), new T.MeshPhongMaterial({ color }));
}
export function label(text: string, color = '#392b66', background = '#fff2cf') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = color;
  ctx.font = 'bold 70px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 90);
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  return new T.Mesh(new T.PlaneGeometry(1.25, 0.62), new T.MeshBasicMaterial({ map: texture }));
}
// Character hierarchy and opposing sinusoidal limb phases adapted from starship-run/character.ts.
export function hunter() {
  const root = group();
  root.rotation.y = Math.PI;
  const torso = box(0.65, 0.72, 0.38, 0x6153c9, 0, 1.05, 0);
  root.add(torso);
  const head = group(0, 1.72, 0);
  head.add(
    sphere(0.38, 0xffc89d),
    box(0.8, 0.12, 0.65, 0xffcc52, 0, 0.3, 0),
    box(0.48, 0.25, 0.45, 0xffcc52, 0, 0.44, 0),
  );
  root.add(head);
  for (const x of [-0.13, 0.13]) head.add(sphere(0.045, 0x302956, x, 0.04, 0.34));
  const left = createLimb(0.18, 0.5, 0.2, 0xffc89d, -0.46, 1.4, 0),
    right = createLimb(0.18, 0.5, 0.2, 0xffc89d, 0.46, 1.4, 0);
  const leg1 = createLimb(0.23, 0.55, 0.26, 0x293c67, -0.21, 0.7, 0),
    leg2 = createLimb(0.23, 0.55, 0.26, 0x293c67, 0.21, 0.7, 0);
  root.add(left, right, leg1, leg2);
  const net = group(0.15, -0.45, 0);
  net.add(box(0.055, 1.4, 0.055, 0xffde94, 0, 0.5, 0));
  const hoop = ring(0.57, 0xff865e);
  hoop.position.y = 1.3;
  net.add(hoop);
  const mesh = new T.Mesh(
    new T.SphereGeometry(0.55, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    new T.MeshBasicMaterial({ color: 0xe9ffff, wireframe: true, transparent: true, opacity: 0.45 }),
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = 1.3;
  net.add(mesh);
  right.add(net);
  const jar = new T.Mesh(
    new T.CylinderGeometry(0.23, 0.23, 0.55, 10),
    new T.MeshPhongMaterial({ color: 0x9beff0, transparent: true, opacity: 0.65 }),
  );
  jar.position.set(-0.33, 0.95, 0.32);
  root.add(jar);
  root.add(box(0.48, 0.1, 0.48, 0xffcc52, -0.33, 1.24, 0.32));
  return {
    root,
    net,
    jar,
    animate(
      time: number,
      y: number,
      capture: number,
      hit: boolean,
      over: boolean,
      reduced: boolean,
    ) {
      root.position.y = y + (reduced ? 0 : sinusoid(4, 0, 0.06, 0, time));
      root.rotation.z = over ? 1.3 : hit ? Math.sin(time * 30) * 0.12 : 0;
      head.rotation.x = sinusoid(4, -0.06, 0.03, 0, time);
      leg1.rotation.x = sinusoid(2, -0.65, 0.65, 0, time);
      leg2.rotation.x = sinusoid(2, -0.65, 0.65, 180, time);
      left.rotation.x = sinusoid(2, -0.6, 0.6, 180, time);
      right.rotation.z = capture > 0 ? -0.8 - Math.sin(capture * Math.PI) * 0.8 : -0.25;
      right.rotation.x = capture > 0 ? -1 : sinusoid(2, -0.3, 0.3, 0, time);
    },
  };
}
export function insect(kind: number) {
  const root = group(),
    color = bugs[kind].color;
  const body = sphere(kind === 2 ? 0.42 : 0.32, color);
  body.scale.set(1, 0.8, 1.35);
  root.add(body);
  const head = sphere(0.24, color, 0, 0.07, 0.36);
  root.add(head);
  for (const x of [-0.12, 0.12]) {
    root.add(sphere(0.12, 0xffffff, x, 0.17, 0.53), sphere(0.055, 0x33254e, x, 0.18, 0.63));
    const antenna = box(0.035, 0.35, 0.035, 0x493964, x, 0.4, 0.32);
    antenna.rotation.z = x > 0 ? -0.4 : 0.4;
    root.add(antenna);
  }
  const wings = [
    sphere(0.25, kind === 3 ? 0xff8ecf : 0xe4fbff, -0.3, 0.14, -0.05),
    sphere(0.25, kind === 3 ? 0x89edb6 : 0xe4fbff, 0.3, 0.14, -0.05),
  ];
  for (const w of wings) {
    w.scale.set(1, 0.1, 1.5);
    root.add(w);
  }
  for (let i = 0; i < 6; i++) {
    const l = box(
      0.3,
      0.04,
      0.04,
      0x493964,
      (i % 2 ? 1 : -1) * 0.36,
      -0.18,
      (Math.floor(i / 2) - 1) * 0.23,
    );
    l.rotation.z = i % 2 ? 0.4 : -0.4;
    root.add(l);
  }
  if (kind === 2) {
    const alarm = ring(0.62, 0xff8b38);
    alarm.rotation.x = Math.PI / 2;
    root.add(alarm);
  }
  if (kind === 3) {
    const crown = box(0.3, 0.17, 0.2, 0xfff6b0, 0, 0.42, 0.1);
    root.add(crown);
  }
  const crumbs: T.Mesh[] = [];
  if (kind === 1)
    for (let i = 0; i < 3; i++) {
      const c = box(0.12, 0.12, 0.12, 0xffa25b, 0, -0.2, -0.6 - i * 0.3);
      root.add(c);
      crumbs.push(c);
    }
  if (kind === 0)
    root.traverse((o) => {
      if (o instanceof T.Mesh) {
        const m = o.material as T.MeshPhongMaterial;
        m.transparent = true;
      }
    });
  return {
    root,
    animate(t: number, reduced: boolean) {
      for (let i = 0; i < 2; i++) wings[i].rotation.z = (i ? 1 : -1) * Math.sin(t * 22) * 0.6;
      root.rotation.y = Math.sin(t * (kind === 3 ? 3 : 1)) * 0.25;
      root.position.y = 0.9 + (reduced ? 0 : Math.sin(t * 3 + kind) * 0.15);
      if (kind === 0)
        root.traverse((o) => {
          if (o instanceof T.Mesh)
            (o.material as T.MeshPhongMaterial).opacity = 0.4 + (0.35 * (1 + Math.sin(t * 2))) / 2;
        });
      crumbs.forEach((c, i) => {
        c.rotation.x = t * 3;
        c.position.x = Math.sin(t * 2 + i) * 0.22;
      });
    },
  };
}
export function obstacle(kind: number) {
  const root = group();
  if (kind === 0) {
    const cup = new T.Mesh(
      new T.CylinderGeometry(0.58, 0.45, 1.2, 12),
      new T.MeshPhongMaterial({ color: 0xff9b79, flatShading: true }),
    );
    cup.position.y = 0.6;
    root.add(cup);
    const coffee = new T.Mesh(
      new T.CircleGeometry(0.5, 12),
      new T.MeshBasicMaterial({ color: 0x543738 }),
    );
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 1.21;
    root.add(coffee);
    const handle = ring(0.3, 0xff9b79);
    handle.position.set(0.64, 0.65, 0);
    root.add(handle);
  }
  if (kind === 1) {
    root.add(
      box(1.5, 1.15, 0.45, 0x493c76, 0, 0.97, 0),
      box(0.2, 0.45, 0.2, 0x493c76, 0, 0.25, 0),
      box(0.9, 0.12, 0.55, 0x493c76, 0, 0.06, 0),
    );
    const screen = label('500', '#ff756f', '#24234c');
    screen.position.set(0, 1, 0.24);
    root.add(screen);
  }
  if (kind === 2) {
    root.add(box(1.6, 0.4, 0.85, 0x9c8ed5, 0, 0.2, 0));
    for (let i = 0; i < 12; i++)
      root.add(
        box(
          0.22,
          0.15,
          0.2,
          i % 3 ? 0xfff2cf : 0xff7e95,
          ((i % 4) - 0.5 * 3) * 0.32,
          0.48,
          (Math.floor(i / 4) - 1) * 0.25,
        ),
      );
  }
  // Common hazard markings, absent from collectible insects.
  root.add(box(1.7, 0.025, 0.15, 0xff675d, 0, 0.02, 0.65));
  return root;
}
