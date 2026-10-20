// Stationary runner, approaching world; all timers use active simulation time.
export const LANE = 2.5;
export const GAP = 23;
export const JUMP_TIME = 0.85;
export const ABILITY_THRESHOLDS = [50, 25, 30, 40];
export type Phase = 'intro' | 'running' | 'paused' | 'over';
export type Obstacle = { lane: number; kind: number; hit: boolean };
export type Row = {
  index: number;
  z: number;
  lane: number;
  kind: number;
  height: number;
  caught: boolean;
  missed: boolean;
  penalized: boolean;
  obstacles: Obstacle[];
};
export function jumpHeight(time: number) {
  if (time <= 0 || time >= JUMP_TIME) return 0;
  return 2.65 * Math.sin((Math.PI * time) / JUMP_TIME);
}
export function overlaps(x: number, y: number, z: number, ox: number, oz: number, height: number) {
  return Math.abs(x - ox) < 0.88 && Math.abs(z - oz) < 0.7 && y < height - 0.12;
}
export function makeRow(index: number, rng: () => number = Math.random): Row {
  const lane = index === 0 ? 0 : Math.floor(rng() * 3) - 1;
  const obstacles: Obstacle[] = [];
  const special = index >= 5 && (index - 5) % 4 === 0;
  if (special && (index - 5) % 8 === 0) {
    for (const obstacleLane of [-1, 0, 1]) {
      obstacles.push({ lane: obstacleLane, kind: 2, hit: false });
    }
  } else if (!special && index > 1) {
    const blocked = [-1, 0, 1].filter((candidate) => candidate !== lane);
    obstacles.push({ lane: blocked[index % 2], kind: index % 3, hit: false });
    if (index > 10 && index % 3 === 0) {
      obstacles.push({ lane: blocked[1 - (index % 2)], kind: (index + 1) % 3, hit: false });
    }
  }
  return {
    index,
    z: -12 - index * GAP,
    lane,
    kind: index % 4,
    height: special ? 3 : 0.9,
    caught: false,
    missed: false,
    penalized: false,
    obstacles,
  };
}
export type RunnerEvent =
  | { type: 'capture'; kind: number; row: Row }
  | { type: 'hit' | 'miss' }
  | { type: 'ability'; kind: number }
  | { type: 'speed'; speed: number };

export class Runner {
  phase: Phase = 'intro';
  health = 3;
  distance = 0;
  time = 0;
  lane = 0;
  x = 0;
  y = 0;
  jumpTime = -1;
  invulnerable = 0;
  caught = 0;
  score = 0;
  collection = [0, 0, 0, 0];
  charges = [0, 0, 0, 0];
  healReady = false;
  shield = 0;
  slow = 0;
  double = 0;
  rows: Row[] = [];
  next = 8;
  speed = 8;
  rng: () => number;
  onEvent: (event: RunnerEvent) => void = () => {};

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
    this.reset();
  }
  reset() {
    this.health = 3;
    this.distance = 0;
    this.time = 0;
    this.lane = 0;
    this.x = 0;
    this.y = 0;
    this.jumpTime = -1;
    this.invulnerable = 0;
    this.caught = 0;
    this.score = 0;
    this.collection = [0, 0, 0, 0];
    this.charges = [0, 0, 0, 0];
    this.healReady = false;
    this.shield = 0;
    this.slow = 0;
    this.double = 0;
    this.next = 8;
    this.speed = 8;
    this.rows = Array.from({ length: 8 }, (_, index) => makeRow(index, this.rng));
  }
  start() {
    this.reset();
    this.phase = 'running';
  }
  pause() {
    if (this.phase === 'running') this.phase = 'paused';
  }
  resume() {
    if (this.phase === 'paused') this.phase = 'running';
  }
  move(direction: number) {
    if (this.phase === 'running') this.lane = Math.max(-1, Math.min(1, this.lane + direction));
  }
  jump() {
    if (this.phase === 'running' && this.jumpTime < 0) this.jumpTime = 0;
  }
  loseLife(reason: 'hit' | 'miss', row?: Row) {
    if (this.phase !== 'running' || row?.penalized) return;
    if (row) row.penalized = true;
    this.health--;
    if (this.health === 0) {
      this.phase = 'over';
    } else if (this.healReady) {
      this.health++;
      this.healReady = false;
    }
    this.onEvent({ type: reason });
  }
  hit(row?: Row) {
    if (this.invulnerable > 0 || this.shield > 0 || this.phase !== 'running') return;
    this.invulnerable = 2;
    this.loseLife('hit', row);
  }
  private charge(kind: number) {
    // A stored cure cannot accumulate additional charges.
    if (kind === 1 && this.healReady) return;
    this.charges[kind]++;
    if (this.charges[kind] < ABILITY_THRESHOLDS[kind]) return;
    this.charges[kind] = 0;
    if (kind === 0) this.shield = 8;
    if (kind === 1) {
      if (this.health < 3) this.health++;
      else this.healReady = true;
    }
    if (kind === 2) this.slow = 6;
    if (kind === 3) this.double = 10;
    this.onEvent({ type: 'ability', kind });
  }
  update(delta: number) {
    if (this.phase !== 'running') return;
    const dt = Math.min(0.05, Math.max(0, delta));
    const previousLevel = Math.min(4, Math.floor(this.time / 20));
    this.time += dt;
    const level = Math.min(4, Math.floor(this.time / 20));
    this.shield = Math.max(0, this.shield - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.double = Math.max(0, this.double - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    const baseSpeed = 8 + level * 2;
    this.speed = baseSpeed;
    if (this.slow > 0) this.speed *= 0.6;
    if (level > previousLevel) this.onEvent({ type: 'speed', speed: baseSpeed });
    this.distance += this.speed * dt;
    const target = this.lane * LANE;
    this.x += Math.sign(target - this.x) * Math.min(Math.abs(target - this.x), dt * 15);
    if (this.jumpTime >= 0) {
      this.jumpTime += dt;
      this.y = jumpHeight(this.jumpTime);
      if (this.jumpTime >= JUMP_TIME) this.jumpTime = -1;
    }
    for (const row of this.rows) {
      row.z += this.speed * dt;
      // Capture volume follows the rendered insect, including elevated rows.
      const inLane = Math.abs(this.x - row.lane * LANE) < 1.05;
      const inHeight = Math.abs(this.y + 0.9 - row.height) < 1;
      if (!row.caught && !row.missed && Math.abs(row.z) <= 1.4 && inLane && inHeight) {
        row.caught = true;
        this.caught++;
        this.score += this.double > 0 ? 2 : 1;
        this.collection[row.kind]++;
        this.onEvent({ type: 'capture', kind: row.kind, row });
        this.charge(row.kind);
      }
      for (const obstacle of row.obstacles) {
        if (
          !obstacle.hit &&
          overlaps(this.x, this.y, 0, obstacle.lane * LANE, row.z, [1.25, 1.6, 0.65][obstacle.kind])
        ) {
          obstacle.hit = true;
          this.hit(row);
        }
      }
      if (this.phase !== 'running') break;
      if (row.z > 1.4 && !row.caught && !row.missed) {
        row.missed = true;
        this.loseLife('miss', row);
      }
      if (this.phase !== 'running') break;
      if (row.z > 8) {
        const next = makeRow(this.next++, this.rng);
        next.z = Math.min(...this.rows.map((candidate) => candidate.z)) - GAP;
        Object.assign(row, next);
      }
    }
  }
}
