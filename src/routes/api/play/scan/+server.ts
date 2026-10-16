import { error, type RequestHandler } from '@sveltejs/kit';
import { body, privateJson, sameOrigin } from '$lib/server/http';
import { gameConfigured, validEmbedding, matchPublic, quizOptions, sealAttempt } from '$lib/server/game';
import { EMBEDDING_MODEL } from '$lib/types';
export const POST: RequestHandler = async event => {
  sameOrigin(event); const data = await body(event);
  if(data.consent !== true) error(400, 'Acconsenti al confronto temporaneo del descrittore prima di scansionare.');
  if(data.model !== EMBEDDING_MODEL || !validEmbedding(data.embedding) || Object.keys(data).some(k=>!['consent','embedding','model'].includes(k))) error(400,'Descrittore non valido. Le foto non devono essere inviate.');
  if(!gameConfigured()) error(503,'Gioco non ancora configurato dagli amministratori.');
  // No photo; submitted embedding is used only for this request, never persisted.
  const member = await matchPublic(data.embedding);
  const options = await quizOptions(member.data().pokemon, event.fetch);
  return privateJson({ options, token: sealAttempt(member.id,member.data().pokemon.id,options.map(p=>p.id),member.data().createdAt) });
};
