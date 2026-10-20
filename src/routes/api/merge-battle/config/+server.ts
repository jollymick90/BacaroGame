import { error, type RequestHandler } from '@sveltejs/kit';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import { validateConfig } from '$lib/games/merge-battle/config';
import { getMergeConfiguration, mergeConfigDocument, mergeConfigurationCache } from '$lib/server/merge-configuration';

export const GET: RequestHandler = async () => privateJson(await getMergeConfiguration());

export const PUT: RequestHandler = async event => {
 sameOrigin(event);const user=requireUser(event);
 const payload=await body(event, 128000);
 if(Object.keys(payload).some(key=>!['config','revision'].includes(key))||!Number.isSafeInteger(payload.revision)||(payload.revision as number)<0) error(400,'Revisione non valida.');
 let config;try{config=validateConfig(payload.config);}catch(e){error(400,e instanceof Error?e.message:'Configurazione non valida.');}
 const ref=mergeConfigDocument();
 const { firebaseAdmin }=await import('$lib/firebase/firebase-admin.server');
 const revision=await firebaseAdmin().db.runTransaction(async tx=>{
  const snapshot=await tx.get(ref);
  const current=snapshot.exists?snapshot.data()!.revision:0;
  if(current!==payload.revision) error(409,'Configurazione modificata da un altro membro. Ricarica prima di salvare.');
  const next=current+1;
  tx.set(ref,{config,revision:next,updatedAt:Date.now(),updatedBy:user.uid});
  return next;
 });
 const saved = { config, revision, persisted: true };
 mergeConfigurationCache.set(saved);
 return privateJson(saved);
};
