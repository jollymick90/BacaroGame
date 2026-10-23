import * as T from 'three';
import { isLocalRunnerDevelopment } from './dev-mode';
import { RunnerTutorial, type TutorialSnapshot } from './tutorial';
import { Runner, LANE, type Phase, type RunStats, type RunProgress } from './mechanics';
import { insect, obstacle, sphere, heartPickup, hunter } from './models';
import { bugs } from './content';
import { createVeniceEnvironment } from './venice-environment';
import { octopusHunter } from './octopus-hunter';
import { DEFAULT_RUN_SETTINGS, type RunSettings } from './run-settings';
export type Snapshot = {
  phase: Phase;
  finishReason: 'lives' | 'goal' | null;
  stats: RunStats;
  progress: RunProgress | null;
  tutorial: TutorialSnapshot | null;
  health: number;
  distance: number;
  caught: number;
  collection: number[];
  score: number;
  charges: number[];
  shield: number;
  slow: number;
  double: number;
  healReady: boolean;
  speed: number;
  message: string;
  messageTone: 'positive' | 'negative' | 'neutral';
  capture: number;
};
// Scene/camera/hemisphere setup and scrolling-world architecture adapted from
// gift-secret-santa/.../starship-run/game.ts. Lifecycle, pools and input scoped here.
export function mountRunner(
  host: HTMLElement,
  output: (s: Snapshot) => void,
  onError: () => void,
  runSettings: RunSettings = DEFAULT_RUN_SETTINGS,
) {
  const engine = new Runner(Math.random, runSettings);
  let tutorial: RunnerTutorial | null = null;
  let devFrozen = false;
  let devBackgrounded = false;
  const scene = new T.Scene();
  scene.background = new T.Color(0xb8dde0);
  scene.fog = new T.Fog(0xb8dde0, 55, 155);
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const camera = new T.PerspectiveCamera(58, 1, 0.1, 180);
  camera.position.set(0, 5.8, 9);
  camera.lookAt(0, 1, -14);
  scene.add(new T.HemisphereLight(0xfff4d7, 0x538b89, 2.4));
  const sun = new T.DirectionalLight(0xffe7c2, 2.5);
  sun.position.set(-8, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -10;
  scene.add(sun);
  const developer = hunter();
  const octopus = octopusHunter();
  let player: ReturnType<typeof octopusHunter> = developer;
  scene.add(developer.root, octopus.root);
  octopus.root.visible = false;
  let transformed = false;
  // A full-width, full-height pickup: changing lane or jumping cannot avoid it.
  const transformationGate = new T.Group();
  const gateMaterial = new T.MeshPhongMaterial({
    color: 0x00e5a3,
    transparent: true,
    opacity: 0.24,
    side: T.DoubleSide,
    depthWrite: false,
  });
  const gatePanel = new T.Mesh(new T.BoxGeometry(LANE * 3 + 1, 7, 0.18), gateMaterial);
  gatePanel.position.y = 3.5;
  transformationGate.add(gatePanel);
  const gateEdges = new T.LineSegments(
    new T.EdgesGeometry(gatePanel.geometry),
    new T.LineBasicMaterial({ color: 0x00e5a3 }),
  );
  gateEdges.position.copy(gatePanel.position);
  transformationGate.add(gateEdges);
  const rewardMascot = octopusHunter();
  rewardMascot.root.position.y = 1.8;
  transformationGate.add(rewardMascot.root);
  scene.add(transformationGate);
  const environment = createVeniceEnvironment();
  scene.add(environment.root);
  const tiles: T.Group[] = [];
  for (let i = 0; i < 10; i++) {
    const tile = environment.createTrackTile();
    tile.position.z = 6 - i * 16;
    scene.add(tile);
    tiles.push(tile);
  }
  const views = engine.rows.map(() => {
    const heart = heartPickup();
    scene.add(heart.root);
    const insects = bugs.map((_, i) => insect(i)),
      obstacles = Array.from({ length: 3 }, () => [0, 1, 2].map(obstacle));
    for (const b of insects) scene.add(b.root);
    for (const slot of obstacles) for (const o of slot) scene.add(o);
    return { insects, obstacles, heart };
  });
  const flyers = bugs.map((_, i) => insect(i));
  flyers.forEach((f) => {
    f.root.visible = false;
    scene.add(f.root);
  });
  const sparks = Array.from({ length: 12 }, (_, i) => {
    const p = sphere(0.07, i % 2 ? 0xffd64c : 0xffffff);
    p.visible = false;
    scene.add(p);
    return p;
  });
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = media.matches;
  let raf = 0,
    disposed = false,
    last = 0,
    elapsed = 0,
    lastUi = 0,
    capture = 0,
    flyKind = 0,
    impact = 0,
    message = '',
    messageUntil = 0;
  let messageTone: Snapshot['messageTone'] = 'neutral';
  const origin = new T.Vector3(),
    destination = new T.Vector3(),
    netPosition = new T.Vector3();
  function emit() {
    output({
      phase: engine.phase,
      finishReason: engine.finishReason,
      progress: engine.progress,
      stats: { ...engine.stats, powers: [...engine.stats.powers] },
      tutorial: tutorial?.snapshot() ?? null,
      health: engine.health,
      distance: Math.floor(engine.distance),
      caught: engine.caught,
      collection: [...engine.collection],
      score: engine.score,
      charges: [...engine.charges],
      shield: engine.shield,
      slow: engine.slow,
      double: engine.double,
      healReady: engine.healReady,
      speed: engine.speed,
      message,
      messageTone,
      capture,
    });
  }
  engine.onEvent = (event) => {
    tutorial?.onEvent(event);
    messageTone = 'neutral';
    if (event.type === 'capture') {
      messageTone = 'positive';
      capture = 1;
      flyKind = event.kind;
      origin.set(event.row.lane * LANE, event.row.height, event.row.z);
      message = `${bugs[event.kind].name} catturato! ${bugs[event.kind].quote}`;
    } else if (event.type === 'ability') {
      messageTone = 'positive';
      message = [
        'Heisenbug: ostacoli attraversabili per 8 s!',
        'Regression: una vita recuperata o pronta!',
        'Production: tempo rallentato per 6 s!',
        'Feature: punti doppi per 10 s!',
      ][event.kind];
    } else if (event.type === 'speed') {
      message = `Si accelera! Velocità ${event.speed.toFixed(1)}`;
    } else if (event.type === 'heart') {
      messageTone = 'positive';
      message = 'Un cuore trovato! Una risposta giusta per recuperare una vita.';
    } else {
      messageTone = 'negative';
      impact = 0.6;
      message =
        event.type === 'miss' ? 'Bug scappato: una vita in meno.' : 'Ops. Quel caffè era portante.';
      if (!engine.health) message = 'Vite finite. I bug chiedono una rivincita.';
    }
    messageUntil = engine.time + 2.5;
    emit();
  };
  function resize() {
    if (disposed) return;
    const w = Math.max(1, host.clientWidth),
      h = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w < h ? 68 : 58;
    camera.updateProjectionMatrix();
    if (devFrozen) renderer.render(scene, camera);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  window.addEventListener('resize', resize);
  resize();
  function action(type: 'left' | 'right' | 'jump' | 'pause') {
    if (devFrozen || tutorial) return;
    if (type === 'pause') {
      if (engine.phase === 'running') engine.pause();
      else if (engine.phase === 'paused' && !document.hidden) engine.resume();
    } else if (type === 'jump') engine.jump();
    else engine.move(type === 'left' ? -1 : 1);
    emit();
  }
  const key = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.closest('button,a,input,textarea,select') || e.repeat) return;
    const keys: Record<string, 'left' | 'right' | 'jump' | 'pause'> = {
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
      ArrowUp: 'jump',
      w: 'jump',
      W: 'jump',
      ' ': 'jump',
      ArrowDown: 'pause',
      s: 'pause',
      S: 'pause',
      p: 'pause',
      P: 'pause',
      Escape: 'pause',
    };
    const a = keys[e.key];
    if (a) {
      e.preventDefault();
      action(a);
    }
  };
  host.addEventListener('keydown', key);
  let pointer: number | null = null,
    sx = 0,
    sy = 0;
  const down = (e: PointerEvent) => {
    if (engine.phase !== 'running') return;
    if ((e.target as HTMLElement).closest('button,a')) return;
    pointer = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    host.setPointerCapture(e.pointerId);
    host.focus({ preventScroll: true });
  };
  const up = (e: PointerEvent) => {
    if (pointer !== e.pointerId) return;
    pointer = null;
    const dx = e.clientX - sx,
      dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) action(dx < 0 ? 'left' : 'right');
    else if (dy < 0) action('jump');
  };
  const cancel = () => {
    pointer = null;
  };
  host.addEventListener('pointerdown', down);
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', cancel);
  const visibility = () => {
    if (document.hidden) {
      if (devFrozen) {
        devBackgrounded = true;
        return;
      }
      engine.pause();
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      emit();
    } else if (!raf && !disposed && !devFrozen) raf = requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', visibility);
  const motion = () => {
    reduced = media.matches;
  };
  media.addEventListener('change', motion);
  const lost = (e: Event) => {
    e.preventDefault();
    engine.pause();
    cancelAnimationFrame(raf);
    raf = 0;
    onError();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  function frame(now: number) {
    if (disposed || devFrozen) return;
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    const running = engine.phase === 'running';
    if (running) {
      engine.update(dt);
      tutorial?.update();
      elapsed += dt;
      capture = Math.max(0, capture - dt / 1.1);
      impact = Math.max(0, impact - dt);
      if (engine.time > messageUntil) message = '';
    } else if (engine.phase === 'intro' && !reduced) elapsed += dt * 0.3;
    for (let i = 0; i < tiles.length; i++)
      tiles[i].position.z = 6 - i * 16 + (engine.distance % 16);
    environment.update(engine.distance, elapsed, reduced);
    const gateDistance = runSettings.distanceGoal - engine.distance;
    transformationGate.visible = !tutorial && !transformed && gateDistance >= 0 && gateDistance < 85;
    transformationGate.position.z = -gateDistance;
    if (transformationGate.visible) {
      rewardMascot.animate(elapsed, 1.8, 0, false, false, reduced);
    }
    const shouldTransform = !tutorial && engine.distance >= runSettings.distanceGoal;
    if (shouldTransform !== transformed) {
      transformed = shouldTransform;
      transformationGate.visible = false;
      player.root.visible = false;
      player = transformed ? octopus : developer;
      if (transformed) {
        capture = 1;
        messageTone = 'positive';
        message = `${runSettings.distanceGoal} metri! Hai catturato il polpo! Sei diventato il polipo Bacaro! Ora cattura altri ${runSettings.bugGoal} bug.`;
        messageUntil = engine.time + 4;
      }
    }
    player.root.position.x = engine.x;
    player.animate(elapsed, engine.y, capture, impact > 0, engine.finishReason === 'lives', reduced);
    player.root.visible =
      (!!tutorial && engine.phase === 'paused') || engine.invulnerable <= 0 || reduced || Math.floor(engine.time * 8) % 2 === 0;
    for (let i = 0; i < views.length; i++) {
      const row = engine.rows[i],
        v = views[i];
      v.heart.root.visible = row.heart && !row.caught && !row.missed;
      if (v.heart.root.visible) {
        v.heart.root.position.set(row.lane * LANE, row.height, row.z);
        v.heart.animate(elapsed, reduced);
      }
      for (let k = 0; k < 4; k++) {
        const b = v.insects[k];
        b.root.visible = !row.heart && k === row.kind && !row.caught && !row.missed;
        if (b.root.visible) {
          b.animate(elapsed + row.index, reduced);
          b.root.position.x = row.lane * LANE;
          b.root.position.z = row.z;
          b.root.position.y += row.height - 0.9;
        }
      }
      for (let slot = 0; slot < 3; slot++) {
        const obstacle = row.obstacles[slot];
        for (let kind = 0; kind < 3; kind++) {
          const mesh = v.obstacles[slot][kind];
          mesh.visible = !!obstacle && obstacle.kind === kind;
          if (mesh.visible) {
            mesh.position.set(obstacle.lane * LANE, 0, row.z);
            mesh.rotation.z = obstacle.hit ? 0.12 : 0;
          }
        }
      }
    }
    for (let k = 0; k < 4; k++) flyers[k].root.visible = k === flyKind && capture > 0;
    if (capture > 0) {
      const t = 1 - capture,
        fly = flyers[flyKind].root;
      player.root.updateMatrixWorld(true);
      netPosition.set(0, 1.3, 0);
      player.net.localToWorld(netPosition);
      destination
        .set(0.76, 0.8, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize()
        .multiplyScalar(7)
        .add(camera.position);
      if (t < 0.35) fly.position.lerpVectors(origin, netPosition, t / 0.35);
      else fly.position.lerpVectors(netPosition, destination, (t - 0.35) / 0.65);
      fly.scale.setScalar(1 - t * 0.65);
      fly.rotation.z = t * Math.PI * 3;
      for (let i = 0; i < sparks.length; i++) {
        const p = sparks[i];
        p.visible = !reduced;
        const a = (i * Math.PI) / 6;
        p.position.set(
          origin.x + Math.cos(a) * t * 2,
          origin.y + Math.sin(a) * t * 2,
          origin.z + t,
        );
        p.scale.setScalar(capture);
      }
    } else for (const p of sparks) p.visible = false;
    // Use the existing camera translation for natural depth-dependent parallax.
    // Damping is visual only: lane movement and collision positions are untouched.
    const cameraTargetX = reduced ? 0 : engine.x * 0.08;
    camera.position.x = reduced ? 0 : T.MathUtils.damp(camera.position.x, cameraTargetX, 9, dt);
    renderer.render(scene, camera);
    if (now - lastUi > 100) {
      emit();
      lastUi = now;
    }
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  emit();
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    host.removeEventListener('keydown', key);
    host.removeEventListener('pointerdown', down);
    host.removeEventListener('pointerup', up);
    host.removeEventListener('pointercancel', cancel);
    document.removeEventListener('visibilitychange', visibility);
    media.removeEventListener('change', motion);
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    scene.traverse((o) => {
      if (o instanceof T.InstancedMesh) o.dispose();
      if (o instanceof T.Mesh) {
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          materials.add(m);
          for (const value of Object.values(m)) if (value instanceof T.Texture) textures.add(value);
        }
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    sun.shadow.dispose();
    renderer.renderLists.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    scene.clear();
  }
  function resetTutorialVisuals() {
    capture = 0;
    impact = 0;
    message = '';
    last = 0;
    emit();
  }
  return {
    startTutorial() {
      if (devFrozen || disposed) return;
      tutorial = new RunnerTutorial(engine);
      resetTutorialVisuals();
    },
    nextTutorial() {
      if (devFrozen || !tutorial) return;
      tutorial.next();
      resetTutorialVisuals();
    },
    replayTutorial() {
      if (devFrozen || !tutorial) return;
      tutorial.replay();
      resetTutorialVisuals();
    },
    exitTutorial() {
      if (devFrozen) return;
      tutorial = null;
      engine.reset();
      engine.phase = 'intro';
      resetTutorialVisuals();
    },
    setDevFrozen(value: boolean) {
      if (!isLocalRunnerDevelopment() || disposed || devFrozen === value) return;
      devFrozen = value;
      last = 0;
      if (value) {
        cancelAnimationFrame(raf);
        raf = 0;
        cancel();
      } else {
        if (devBackgrounded) {
          engine.pause();
          emit();
          devBackgrounded = false;
        }
        if (!document.hidden && !raf) raf = requestAnimationFrame(frame);
      }
    },
    start() {
      if (devFrozen) return;
      tutorial = null;
      engine.start(runSettings);
      capture = 0;
      impact = 0;
      messageTone = 'neutral';
      message = 'Prendi ogni bug: se scappa perdi una vita. Salta quelli in aria!';
      messageUntil = 5;
      emit();
      host.focus({ preventScroll: true });
    },
    action,
    resolveHeart(correct: boolean) {
      if (devFrozen) return false;
      const resolved = engine.resolveHeart(correct);
      if (resolved) {
        tutorial?.resolveHeart(correct);
        messageTone = correct ? 'positive' : 'neutral';
        message = correct ? 'Risposta giusta: una vita recuperata ♥' : 'Nessuna vita persa. Il prossimo cuore ti aspetta!';
        messageUntil = engine.time + 3;
        emit();
      }
      return resolved;
    },
    dispose,
  };
}
