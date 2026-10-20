import { error, type RequestHandler } from '@sveltejs/kit';
import { GAME_COLLECTIONS } from '$lib/firebase/collections';
import { firebaseAdmin, firebaseConfigured } from '$lib/firebase/firebase-admin.server';
import { gameDocument } from '$lib/firebase/game-collections.server';
import { DEFAULT_QUESTIONS, validateQuestionConfig, type QuestionConfig } from '$lib/games/bug-hunter/questions';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';

function configDocument() {
  return gameDocument(GAME_COLLECTIONS.configurations, 'bug-hunter');
}

function readRevision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value >= Number.MAX_SAFE_INTEGER) {
    throw new Error('Revisione della configurazione Bug Hunter non valida.');
  }
  return value;
}

export const GET: RequestHandler = async () => {
  const defaults = { config: { questions: DEFAULT_QUESTIONS }, revision: 0, persisted: false };
  if (!firebaseConfigured()) {
    return privateJson(defaults);
  }
  const snapshot = await configDocument().get();
  if (!snapshot.exists) {
    return privateJson(defaults);
  }
  const data = snapshot.data()!;
  return privateJson({
    config: validateQuestionConfig(data.config),
    revision: readRevision(data.revision),
    persisted: true,
  });
};

export const PUT: RequestHandler = async event => {
  sameOrigin(event);
  const user = requireUser(event);
  const payload = await body(event, 512000);
  if (Object.keys(payload).some(key => key !== 'config' && key !== 'revision')) {
    error(400, 'La richiesta deve contenere soltanto configurazione e revisione.');
  }
  let config: QuestionConfig;
  let expectedRevision: number;
  try {
    expectedRevision = readRevision(payload.revision);
    config = validateQuestionConfig(payload.config);
  } catch (failure) {
    error(400, failure instanceof Error ? failure.message : 'Configurazione non valida.');
  }
  const reference = configDocument();
  const revision = await firebaseAdmin().db.runTransaction(async transaction => {
    const snapshot = await transaction.get(reference);
    let currentRevision = 0;
    if (snapshot.exists) {
      currentRevision = readRevision(snapshot.data()!.revision);
    }
    if (currentRevision !== expectedRevision) {
      error(409, 'Domande modificate da un altro membro. Le tue modifiche sono conservate: ricarica per vedere la versione pubblicata.');
    }
    const nextRevision = currentRevision + 1;
    transaction.set(reference, {
      config,
      revision: nextRevision,
      updatedAt: Date.now(),
      updatedBy: user.uid,
    });
    return nextRevision;
  });
  return privateJson({ config, revision, persisted: true });
};
