import { Runner, makeRow, type RunnerEvent } from './mechanics.ts';

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Il tuo vero lavoro',
    text: 'Sei un developer e lo scopo della tua vita non è fare feature ma catturare bug.',
  },
  {
    id: 'miss',
    title: 'Non lasciarli scappare',
    text: 'Cattura bug, altrimenti perdi una vita. Guarda cosa succede quando questo bug ci passa accanto.',
  },
  {
    id: 'obstacle',
    title: 'Gli ostacoli di un developer',
    text: 'Evita caffè, monitor e tastiere: tutte cose inutili. Passarci addosso costa una vita. Facciamo una prova…',
  },
  {
    id: 'ability',
    title: 'Trasforma i bug in feature',
    text: 'Come i migliori dev sanno, ogni tot bug uguali si trasforma in un potere. Raccogliamo tre Production: il mondo rallenta!',
  },
  {
    id: 'heart',
    title: 'Un difficilissimo rompicapo',
    text: 'Se perdi una vita puoi risolvere un difficile rompicapo. Mi raccomando, non farti aiutare dall’AI: una risposta giusta ti regala una nuova vita.',
  },
] as const;

export type TutorialStep = typeof TUTORIAL_STEPS[number]['id'];
export type TutorialSnapshot = {
  step: TutorialStep;
  complete: boolean;
  correct: boolean | null;
};

// Script only the setup. Captures, damage and powers remain Runner mechanics.
export class RunnerTutorial {
  private runner: Runner;
  private index = 0;
  private complete = true;
  private correct: boolean | null = null;
  private finishAt: number | null = null;

  constructor(runner: Runner) {
    this.runner = runner;
    this.prepare();
  }

  snapshot(): TutorialSnapshot {
    return {
      step: TUTORIAL_STEPS[this.index].id,
      complete: this.complete,
      correct: this.correct,
    };
  }

  next() {
    if (!this.complete || this.index >= TUTORIAL_STEPS.length - 1) return;
    this.index++;
    this.prepare();
  }

  replay() {
    this.prepare();
  }

  onEvent(event: RunnerEvent) {
    const step = TUTORIAL_STEPS[this.index].id;
    if (this.complete || this.finishAt !== null) return;
    if ((step === 'miss' && event.type === 'miss') ||
        (step === 'obstacle' && event.type === 'hit')) {
      this.finishAt = this.runner.time + 0.8;
    }
    if (step === 'ability' && event.type === 'ability' && event.kind === 2) {
      // Let the third capture finish and the slowdown become visible.
      this.finishAt = this.runner.time + 1.4;
    }
  }

  update() {
    if (this.finishAt === null || this.runner.time < this.finishAt) return;
    this.complete = true;
    this.runner.pause();
    this.finishAt = null;
  }

  resolveHeart(correct: boolean) {
    if (TUTORIAL_STEPS[this.index].id !== 'heart' || this.complete) return;
    this.complete = true;
    this.correct = correct;
  }

  private prepare() {
    this.runner.start(null);
    this.finishAt = null;
    this.correct = null;
    const step = TUTORIAL_STEPS[this.index].id;
    this.complete = step === 'welcome';
    // Keep the original pool size: scene views already exist for all eight rows.
    for (let index = 0; index < this.runner.rows.length; index++) {
      Object.assign(this.runner.rows[index], {
        z: -500 - index * 30,
        heart: false,
        caught: true,
        missed: true,
        penalized: false,
        obstacles: [],
      });
    }
    if (step === 'welcome') {
      this.runner.pause();
      return;
    }
    if (step === 'miss') {
      this.setRow(0, -10, 1);
      return;
    }
    if (step === 'obstacle') {
      this.runner.health = 2;
      this.setRow(0, -10);
      const row = this.runner.rows[0];
      row.caught = true;
      row.obstacles = [
        { lane: 0, kind: 0, hit: false },
        { lane: -1, kind: 1, hit: false },
        { lane: 1, kind: 2, hit: false },
      ];
      return;
    }
    this.runner.health = 1;
    if (step === 'ability') {
      for (let index = 0; index < 3; index++) {
        this.setRow(index, -8 - index * 10);
        this.runner.rows[index].kind = 2;
      }
      return;
    }
    this.setRow(0, -10);
    this.runner.rows[0].heart = true;
  }

  private setRow(index: number, z: number, lane = 0) {
    const row = makeRow(0, () => 0.5);
    row.z = z;
    row.lane = lane;
    Object.assign(this.runner.rows[index], row);
  }
}
