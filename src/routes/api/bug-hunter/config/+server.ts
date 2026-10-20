import { error, type RequestHandler } from '@sveltejs/kit';
import { firebaseAdmin } from '$lib/firebase/firebase-admin.server';
import { validateQuestionConfig, type QuestionConfig } from '$lib/games/bug-hunter/questions';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import { bugHunterConfigDocument, readRevision, readBugHunterConfiguration, bugHunterConfigurationCache } from '$lib/server/bug-hunter-configuration';

// The editor reads current revisions; public game loads use the shared cache.
export const GET: RequestHandler = async () => privateJson(await readBugHunterConfiguration());

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
  const reference = bugHunterConfigDocument();
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
  const saved = { config, revision, persisted: true };
  bugHunterConfigurationCache.set(saved);
  return privateJson(saved);
};
