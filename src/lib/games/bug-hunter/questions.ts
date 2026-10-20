export type HeartQuestion = {
  id: string;
  prompt: string;
  answers: [string, string, string];
  correctIndex: number;
  explanation: string;
};

export type QuestionConfig = { questions: HeartQuestion[] };

export const DEFAULT_QUESTIONS: HeartQuestion[] = [
  {
    id: 'algoritmo',
    prompt: 'Sono una sequenza di passi per risolvere un problema. Chi sono?',
    answers: ['Un algoritmo', 'Un monitor', 'Un cavo'],
    correctIndex: 0,
    explanation: 'Un algoritmo descrive i passi da seguire per risolvere un problema.',
  },
  {
    id: 'bit',
    prompt: 'Posso valere soltanto 0 oppure 1. Chi sono?',
    answers: ['Una cartella', 'Un bit', 'Una stampante'],
    correctIndex: 1,
    explanation: 'Il bit è una cifra binaria: può essere 0 oppure 1.',
  },
  {
    id: 'byte',
    prompt: 'Sono un gruppo di otto bit. Come mi chiamo?',
    answers: ['Pixel', 'Password', 'Byte'],
    correctIndex: 2,
    explanation: 'Un byte contiene otto bit.',
  },
  {
    id: 'variabile',
    prompt: 'Nel programma ho un nome e custodisco un valore che può cambiare. Chi sono?',
    answers: ['Una variabile', 'Una tastiera', 'Un sito web'],
    correctIndex: 0,
    explanation: 'Una variabile permette di conservare e aggiornare un valore.',
  },
  {
    id: 'ciclo',
    prompt: 'Faccio ripetere le stesse istruzioni più volte. Chi sono?',
    answers: ['Un commento', 'Un ciclo', 'Un file audio'],
    correctIndex: 1,
    explanation: 'Un ciclo ripete un insieme di istruzioni.',
  },
  {
    id: 'condizione',
    prompt: 'Eseguo una strada se una condizione è vera, un’altra se è falsa. Quale istruzione sono?',
    answers: ['Stampa', 'Somma', 'Se / altrimenti'],
    correctIndex: 2,
    explanation: 'Se / altrimenti sceglie le istruzioni in base a una condizione.',
  },
  {
    id: 'booleano',
    prompt: 'Posso essere vero oppure falso. Che tipo di valore sono?',
    answers: ['Un booleano', 'Un’immagine', 'Una cartella'],
    correctIndex: 0,
    explanation: 'Un valore booleano rappresenta vero o falso.',
  },
  {
    id: 'stringa',
    prompt: 'Conservo un testo, per esempio «ciao». Che tipo di dato sono?',
    answers: ['Un numero intero', 'Una stringa', 'Un valore booleano'],
    correctIndex: 1,
    explanation: 'Una stringa è una sequenza di caratteri, come una parola o una frase.',
  },
  {
    id: 'bug',
    prompt: 'Sono un errore nel programma che può farlo comportare male. Chi sono?',
    answers: ['Un backup', 'Un pixel', 'Un bug'],
    correctIndex: 2,
    explanation: 'Un bug è un difetto nel software.',
  },
  {
    id: 'debug',
    prompt: 'Cerchi un errore nel programma e lo correggi. Che cosa stai facendo?',
    answers: ['Debug', 'Una stampa', 'Una ricarica della batteria'],
    correctIndex: 0,
    explanation: 'Fare debug significa individuare e correggere errori nel programma.',
  },
  {
    id: 'funzione',
    prompt: 'Raccolgo istruzioni sotto un nome e puoi richiamarmi nel programma. Chi sono?',
    answers: ['Un mouse', 'Una funzione', 'Una presa elettrica'],
    correctIndex: 1,
    explanation: 'Una funzione raccoglie istruzioni che possono essere richiamate.',
  },
  {
    id: 'commento',
    prompt: 'Spiego il codice a chi lo legge, ma non sono un’istruzione da eseguire. Chi sono?',
    answers: ['Un ciclo', 'Un calcolo', 'Un commento'],
    correctIndex: 2,
    explanation: 'Un commento documenta il codice e non viene eseguito come istruzione.',
  },
  {
    id: 'backup',
    prompt: 'Sono una copia dei dati conservata per recuperarli se li perdi. Chi sono?',
    answers: ['Un backup', 'Un cursore', 'Un bug'],
    correctIndex: 0,
    explanation: 'Un backup è una copia di sicurezza dei dati.',
  },
  {
    id: 'input',
    prompt: 'Scrivi il tuo nome con la tastiera: per il programma, il nome ricevuto è…',
    answers: ['Un output', 'Un input', 'Un backup'],
    correctIndex: 1,
    explanation: 'Un input è un dato che entra nel programma.',
  },
  {
    id: 'output',
    prompt: 'Il programma mostra sullo schermo il risultato di un calcolo. Il risultato mostrato è…',
    answers: ['Un input', 'Una password', 'Un output'],
    correctIndex: 2,
    explanation: 'Un output è un risultato prodotto dal programma.',
  },
  {
    id: 'file',
    prompt: 'Conservo dati sul dispositivo e ho un nome, come «appunti.txt». Chi sono?',
    answers: ['Un file', 'Un cavo', 'Un tasto'],
    correctIndex: 0,
    explanation: 'Un file è un insieme di dati memorizzato con un nome.',
  },
  {
    id: 'cartella',
    prompt: 'Ti aiuto a organizzare file e posso contenere altre cartelle. Chi sono?',
    answers: ['Un processore', 'Una cartella', 'Una variabile'],
    correctIndex: 1,
    explanation: 'Le cartelle servono a organizzare file e altre cartelle.',
  },
  {
    id: 'hardware',
    prompt: 'Puoi toccarmi: sono la parte fisica del computer. Come mi chiami?',
    answers: ['Software', 'Algoritmo', 'Hardware'],
    correctIndex: 2,
    explanation: 'Hardware indica i componenti fisici, come tastiera e processore.',
  },
  {
    id: 'software',
    prompt: 'Sono l’insieme dei programmi che un computer può eseguire. Come mi chiami?',
    answers: ['Software', 'Hardware', 'Batteria'],
    correctIndex: 0,
    explanation: 'Software indica i programmi e le istruzioni eseguiti dal computer.',
  },
  {
    id: 'ordine',
    prompt: 'Metto i numeri 3, 1, 2 in ordine crescente. Qual è il risultato?',
    answers: ['3, 2, 1', '1, 2, 3', '2, 3, 1'],
    correctIndex: 1,
    explanation: 'In ordine crescente si procede dal valore più piccolo al più grande.',
  },
];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new Error(`${label}: inserisci un testo da 1 a ${maximum} caratteri.`);
  }
  return value.trim();
}

export function validateQuestionConfig(value: unknown): QuestionConfig {
  if (!record(value) || !Array.isArray(value.questions)) {
    throw new Error('Configurazione non valida: manca l’elenco delle domande.');
  }
  if (value.questions.length < 1 || value.questions.length > 100) {
    throw new Error('La banca deve contenere da 1 a 100 domande.');
  }
  const identifiers = new Set<string>();
  const questions = value.questions.map((candidate: unknown, index: number): HeartQuestion => {
    const label = `Domanda ${index + 1}`;
    if (!record(candidate)) {
      throw new Error(`${label}: formato non valido.`);
    }
    const id = text(candidate.id, `${label}, identificativo`, 80);
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || identifiers.has(id)) {
      throw new Error(`${label}: identificativo non valido o duplicato.`);
    }
    identifiers.add(id);
    const prompt = text(candidate.prompt, `${label}, testo`, 300);
    const explanation = text(candidate.explanation, `${label}, spiegazione`, 300);
    if (!Array.isArray(candidate.answers) || candidate.answers.length !== 3) {
      throw new Error(`${label}: servono esattamente tre risposte.`);
    }
    const answers = candidate.answers.map((answer: unknown) => text(answer, `${label}, risposta`, 120));
    if (new Set(answers.map(answer => answer.toLocaleLowerCase('it'))).size !== 3) {
      throw new Error(`${label}: le tre risposte devono essere diverse.`);
    }
    const correctIndex = candidate.correctIndex;
    if (typeof correctIndex !== 'number' || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 2) {
      throw new Error(`${label}: seleziona una risposta corretta tra le tre opzioni.`);
    }
    return { id, prompt, answers: [answers[0], answers[1], answers[2]], correctIndex, explanation };
  });
  return { questions };
}
