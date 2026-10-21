import { DEFAULT_RUN_SETTINGS, type RunSettings } from './run-settings.ts';

// Stationary runner, approaching world; all timers use active simulation time.
export const LANE = 2.5;
export const GAP = 23;
export const JUMP_TIME = 0.85;
export const ABILITY_THRESHOLDS = [5, 3, 3, 4];
export type Phase = 'intro' | 'running' | 'paused' | 'question' | 'over';
export type Obstacle = { lane: number; kind: number; hit: boolean };
export type Row = {
  index: number;
  z: number;
  lane: number;
  kind: number;
  height: number;
  heart: boolean;
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
  const heart = index >= 4 && (index - 4) % 6 === 0;
  const special = !heart && index >= 5 && (index - 5) % 4 === 0;
  if (special && (index - 5) % 8 === 0) {
    for (const obstacleLane of [-1, 0, 1]) {
      obstacles.push({ lane: obstacleLane, kind: 2, hit: false });
    }
  } else if (!heart && !special && index > 1) {
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
    heart,
    caught: false,
    missed: false,
    penalized: false,
    obstacles,
  };
}
export type RunnerEvent =
  | { type: 'capture'; kind: number; row: Row }
  | { type: 'hit' | 'miss' | 'heart' }
  | { type: 'ability'; kind: number }
  | { type: 'speed'; speed: number };

export type RunStats = {
  missed: number;
  collisions: number;
  healed: number;
  powers: number[];
};
export type RunProgress = RunSettings & {
  stage: 'distance' | 'bugs' | 'complete';
  bugsInFinalStage: number;
};

export class Runner {
  phase: Phase = 'intro';
  finishReason: 'lives' | 'goal' | null = null;
  stats: RunStats = { missed: 0, collisions: 0, healed: 0, powers: [0, 0, 0, 0] };
  private runSettings: RunSettings | null;
  private checkpointCaught: number | null = null;
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

  constructor(rng: () => number = Math.random, settings: RunSettings | null = DEFAULT_RUN_SETTINGS) {
    this.rng = rng;
    this.runSettings = settings ? { ...settings } : null;
    this.reset();
  }
  get progress(): RunProgress | null {
    if (!this.runSettings) return null;
    let stage: RunProgress['stage'] = 'distance';
    if (this.checkpointCaught !== null) stage = 'bugs';
    if (this.finishReason === 'goal') stage = 'complete';
    return {
      ...this.runSettings,
      stage,
      bugsInFinalStage: this.checkpointCaught === null ? 0 : this.caught - this.checkpointCaught,
    };
  }
  reset() {
    this.finishReason = null;
    this.checkpointCaught = null;
    this.stats = { missed: 0, collisions: 0, healed: 0, powers: [0, 0, 0, 0] };
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
  start(settings: RunSettings | null = this.runSettings) {
    this.runSettings = settings ? { ...settings } : null;
    this.reset();
    this.phase = 'running';
  }
  pause() {
    if (this.phase === 'running') this.phase = 'paused';
  }
  resume() {
    if (this.phase === 'paused') this.phase = 'running';
  }
  resolveHeart(correct: boolean) {
    if (this.phase !== 'question') return false;
    if (correct) {
      const recovered = Math.min(1, 3 - this.health);
      this.health += recovered;
      this.stats.healed += recovered;
    }
    // Stay paused for feedback; the UI resumes after its countdown or Continue.
    this.phase = 'paused';
    return true;
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
    if (reason === 'hit') this.stats.collisions++;
    this.health--;
    if (this.health === 0) {
      this.phase = 'over';
      this.finishReason = 'lives';
    } else if (this.healReady) {
      this.health++;
      this.stats.healed++;
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
    this.stats.powers[kind]++;
    if (kind === 0) this.shield = 8;
    if (kind === 1) {
      if (this.health < 3) {
        this.health++;
        this.stats.healed++;
      } else this.healReady = true;
    }
    if (kind === 2) this.slow = 6;
    if (kind === 3) this.double = 10;
    this.onEvent({ type: 'ability', kind });
  }
  update(delta: number) {
    if (this.phase !== 'running') return;
    const dt = Math.min(0.05, Math.max(0, delta));
    const previousLevel = Math.floor(this.time / 20);
    this.time += dt;
    const level = Math.floor(this.time / 20);
    this.shield = Math.max(0, this.shield - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.double = Math.max(0, this.double - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    const baseSpeed = 8 + this.time / 10;
    this.speed = baseSpeed;
    if (this.slow > 0) this.speed *= 0.6;
    if (level > previousLevel) this.onEvent({ type: 'speed', speed: baseSpeed });
    this.distance += this.speed * dt;
    const previousX = this.x;
    const previousY = this.y;
    const target = this.lane * LANE;
    this.x += Math.sign(target - this.x) * Math.min(Math.abs(target - this.x), dt * 15);
    if (this.jumpTime >= 0) {
      this.jumpTime += dt;
      this.y = jumpHeight(this.jumpTime);
      if (this.jumpTime >= JUMP_TIME) this.jumpTime = -1;
    }
    const travel = this.speed * dt;
    for (const row of this.rows) row.z += travel;
    // Process the closest row first; swept checks prevent tunnelling at higher speeds.
    const approachingRows = [...this.rows].sort((first, second) => second.z - first.z);
    for (const row of approachingRows) {
      const previousZ = row.z - travel;
      const contact = travel > 0 ? Math.max(0, Math.min(1, -previousZ / travel)) : 1;
      const contactX = previousX + (this.x - previousX) * contact;
      const contactY = previousY + (this.y - previousY) * contact;
      const inLane = Math.abs(contactX - row.lane * LANE) < 1.05;
      const inHeight = Math.abs(contactY + 0.9 - row.height) < 1;
      const crossedPickup = previousZ <= 1.4 && row.z >= -1.4;
      if (!row.caught && !row.missed && crossedPickup && inLane && inHeight) {
        row.caught = true;
        if (row.heart) {
          if (this.health < 3) {
            this.phase = 'question';
            this.onEvent({ type: 'heart' });
            break;
          }
        } else {
          this.caught++;
          this.score += this.double > 0 ? 2 : 1;
          this.collection[row.kind]++;
          this.onEvent({ type: 'capture', kind: row.kind, row });
          this.charge(row.kind);
        }
      }
      for (const obstacle of row.obstacles) {
        if (
          !obstacle.hit &&
          previousZ <= 0.7 &&
          row.z >= -0.7 &&
          overlaps(contactX, contactY, 0, obstacle.lane * LANE, 0, [1.25, 1.6, 0.65][obstacle.kind])
        ) {
          obstacle.hit = true;
          this.hit(row);
        }
      }
      if (this.phase !== 'running') break;
      if (row.z > 1.4 && !row.caught && !row.missed) {
        row.missed = true;
        if (!row.heart) {
          this.stats.missed++;
          this.loseLife('miss', row);
        }
      }
      if (this.phase !== 'running') break;
      if (row.z > 8) {
        const next = makeRow(this.next++, this.rng);
        // More space preserves a readable sequence while speed keeps growing.
        const spacing = GAP * Math.max(1, baseSpeed / 16);
        next.z = Math.min(-12, ...this.rows.map((candidate) => candidate.z)) - spacing;
        Object.assign(row, next);
      }
    }
    if (this.phase === 'running' && this.runSettings) {
      if (this.checkpointCaught === null && this.distance >= this.runSettings.distanceGoal) {
        this.checkpointCaught = this.caught;
      }
      if (this.checkpointCaught !== null && this.caught - this.checkpointCaught >= this.runSettings.bugGoal) {
        this.phase = 'over';
        this.finishReason = 'goal';
      }
    }
  }
}
