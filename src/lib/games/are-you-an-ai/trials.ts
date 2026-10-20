export type Outcome = 'human' | 'robot';
export type TrialId = 'windows' | 'loading' | 'robot' | 'math';
export type Trial = {
  id: TrialId;
  title: string;
  description: string;
  response: string;
  result: string;
  symbol: string;
  hints: [string, string];
};
export const trials: Trial[] = [
  {
    id: 'windows',
    title: 'Chiudi tutte le finestre.',
    description: 'È una richiesta semplicissima. In teoria.',
    response: 'Tecnicamente corretto. Umanamente preoccupante.',
    result: 'Desktop spento. Finestre chiuse.',
    symbol: '⏻',
    hints: [
      'Le finestre tornano sempre. Cerca un modo per chiudere tutto insieme.',
      'Premi Spegni, in basso nel desktop simulato.',
    ],
  },
  {
    id: 'loading',
    title: 'Completa il caricamento.',
    description: 'Il progresso dipende da te. Letteralmente.',
    response: 'Cinque clic per scaricare il buon senso. File non trovato.',
    result: 'Caricamento completato.',
    symbol: '100%',
    hints: [
      'Non basta aspettare. Il pulsante cambia quando ha bisogno di te.',
      'Premi quando compare ORA. Servono cinque conferme; puoi disattivare la scadenza.',
    ],
  },
  {
    id: 'robot',
    title: 'Seleziona il robot.',
    description: 'Leggi bene. Io ho già letto abbastanza.',
    response: 'Non era previsto che leggessi davvero la consegna.',
    result: 'Robot individuato. Ego danneggiato.',
    symbol: '✓',
    hints: [
      'La consegna non dice che devi cercare dentro la griglia.',
      'Seleziona il robot assistente accanto alla consegna, fuori dalla griglia.',
    ],
  },
  {
    id: 'math',
    title: 'Un calcolo semplicissimo.',
    description: 'Calcolatrici ammesse. Conseguenze imprevedibili.',
    response: 'Un errore di calcolo. Finalmente una prova di umanità.',
    result: 'Approssimazione molto umana.',
    symbol: '≈',
    hints: [
      'Questo ufficio cerca esseri umani, non precisione assoluta.',
      'La risposta esatta è 42. Ma un robot sarebbe fin troppo bravo.',
    ],
  },
];
export function selectTrials(rng: () => number = Math.random): Trial[] {
  const pool = [...trials];
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(rng() * (index + 1));
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  return pool.slice(0, 3);
}
export function mathOutcome(input: string): Outcome | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const answer = Number(normalized);
  if (!Number.isFinite(answer)) return null;
  return answer === 42 ? 'robot' : 'human';
}
// Explicit timestamps make the rhythm testable without browser timers.
export class TimedLoading {
  progress = 0;
  relaxed = false;
  readyAt = Infinity;
  closesAt = -Infinity;
  schedule(now: number, rng: () => number = Math.random) {
    this.readyAt = now + 800 + rng() * 800;
    this.closesAt = this.readyAt + 1200;
  }
  isReady(now: number) {
    return now >= this.readyAt && (this.relaxed || now <= this.closesAt);
  }
  confirm(now: number) {
    if (this.progress >= 100 || !this.isReady(now)) return false;
    this.progress += 20;
    this.readyAt = Infinity;
    this.closesAt = -Infinity;
    return true;
  }
}
