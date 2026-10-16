import { error, type RequestHandler } from '@sveltejs/kit';
import { gameDocument } from '$lib/firebase/game-collections.server';
import { GAME_COLLECTIONS } from '$lib/firebase/collections';
import { firebaseConfigured } from '$lib/firebase/firebase-admin.server';
import { body, privateJson, requireUser, sameOrigin } from '$lib/server/http';
import { DEFAULT_CONFIG, validateConfig, readConfig } from '$lib/games/merge-battle/config';
const configDocument = () => gameDocument(GAME_COLLECTIONS.configurations, 'merge-battle');
export const GET: RequestHandler = async () => {
 if(!firebaseConfigured()) return privateJson({config:DEFAULT_CONFIG,revision:0,persisted:false});
 const snapshot=await configDocument().get();
 if(!snapshot.exists) return privateJson({config:DEFAULT_CONFIG,revision:0,persisted:false});
 const data=snapshot.data()!;
 return privateJson({config:readConfig(data.config),revision:data.revision,persisted:true});
};
export const PUT: RequestHandler = async event => {
 sameOrigin(event);const user=requireUser(event);
 const payload=await body(event, 128000);
 if(Object.keys(payload).some(key=>!['config','revision'].includes(key))||!Number.isSafeInteger(payload.revision)||(payload.revision as number)<0) error(400,'Revisione non valida.');
 let config;try{config=validateConfig(payload.config);}catch(e){error(400,e instanceof Error?e.message:'Configurazione non valida.');}
 const ref=configDocument();
 const { firebaseAdmin }=await import('$lib/firebase/firebase-admin.server');
 const revision=await firebaseAdmin().db.runTransaction(async tx=>{
  const snapshot=await tx.get(ref);
  const current=snapshot.exists?snapshot.data()!.revision:0;
  if(current!==payload.revision) error(409,'Configurazione modificata da un altro membro. Ricarica prima di salvare.');
  const next=current+1;
  tx.set(ref,{config,revision:next,updatedAt:Date.now(),updatedBy:user.uid});
  return next;
 });
 return privateJson({config,revision,persisted:true});
};
