import {characters,trials} from './catalog.ts';
import {DEFAULT_CONFIG,validateConfig,type MergeConfig} from './config.ts';
import {AXES,compareCards} from './cards.ts';
export {characters,trials} from './catalog.ts';
const merges:Record<string,string>={'0-1':'Contract Test','1-7':'Atomic Commit','4-6':'Incident Replay','8-9':'Reproducible Pipeline','9-10':'Train → Serve','3-5':'Policy as Code','8-11':'Single Source of Truth'};

export function roleCards(config:MergeConfig,id:number){return config.assignments[id].map(key=>config.cards.find(c=>c.id===key)!);}
export function resolve(ids:number[],moves:string[],trial:number,config:MergeConfig=DEFAULT_CONFIG){
 if(ids.length!==2||moves.length!==2||ids[0]===ids[1]||!config.judges.includes(trial)||ids.some(id=>!config.characters.includes(id))||moves.some((key,i)=>!config.assignments[ids[i]].includes(key)))throw Error('Battaglia non valida');
 const cards=moves.map(key=>config.cards.find(c=>c.id===key)!);
 if(cards.some(c=>!c||!c.active))throw Error('Carta non disponibile');
 const weights=config.weights[trial],outcome=compareCards(cards[0],cards[1],weights,config.activeAxes);
 const sorted=[...ids].sort((a,b)=>a-b);
 const hybrid=merges[sorted.join('-')]??`${characters[sorted[0]].short} × ${characters[sorted[1]].short}`;
 const contributions=cards.map(c=>c.stats.map((n,i)=>config.activeAxes.includes(i)?n*weights[i]:0));
 const differences=contributions[0].map((n,i)=>Math.abs(n-contributions[1][i]));
 const decisive=AXES.filter((_,i)=>differences[i]===Math.max(...differences)&&differences[i]>0).join(', ');
 const calculations=cards.map((c,i)=>`${c.name}: ${config.activeAxes.map(axis=>`${c.stats[axis]}×${weights[axis]}`).join(' + ')} = ${outcome.scores[i]}`);
 const reason=`${calculations.join('. ')}. ${outcome.winner===null?'Pareggio: stesso punteggio, nessuno spareggio.':`Vince ${cards[outcome.winner].name}. Maggiore differenza su: ${decisive}.`}`;
 return {...outcome,contributions,calculations,reason,effect:'stack',gag:`${cards[0].name} contro ${cards[1].name}.`,hybrid,hybridGag:`${characters[sorted[0]].trait} ${characters[sorted[1]].trait} Due competenze nello stesso branch.`};
}
export type Mode='solo'|'local';
export type Session={config:MergeConfig;allowedCharacters:number[];allowedJudges:number[];mode:Mode;phase:'character1'|'character2'|'brief'|'move1'|'handoff'|'move2'|'battle'|'result';ids:[number|null,number|null];moves:[string|null,string|null];trial:number;round:number;previous:string|null;botLine:string};
export type Input={type:'character';actor:0|1;value:number}|{type:'move';actor:0|1;value:string}|{type:'ready'|'handoff'|'finish'|'rematch'};
export function createSession(mode:Mode,trial=DEFAULT_CONFIG.judges[0],configuration:MergeConfig=DEFAULT_CONFIG):Session{
 const config=validateConfig(configuration);
 if(!config.judges.includes(trial))throw Error('Maintainer non valido');
 return {config,allowedCharacters:config.characters,allowedJudges:config.judges,mode,phase:'character1',ids:[null,null],moves:[null,null],trial,round:0,previous:null,botLine:''};
}
export function publicSession(s:Session){return {...s,moves:['battle','result'].includes(s.phase)?[...s.moves]:[null,null]};}
export function input(s:Session,event:Input):Session{
 const n:Session={...s,ids:[...s.ids],moves:[...s.moves]};
 if(event.type==='character'){
  if(s.phase!==`character${event.actor+1}`||!s.allowedCharacters.includes(event.value)||s.ids.includes(event.value))throw Error('Scelta personaggio fuori turno');
  n.ids[event.actor]=event.value;
  if(s.mode==='solo'){n.ids[1]=s.allowedCharacters[(s.allowedCharacters.indexOf(event.value)+1)%s.allowedCharacters.length];n.phase='brief';}else n.phase=event.actor===0?'character2':'brief';
 }else if(event.type==='ready'&&s.phase==='brief'){
  n.phase='move1';if(s.mode==='solo'){const cards=roleCards(s.config,s.ids[1]!);n.moves[1]=cards[(s.round+s.trial)%cards.length].id;n.botLine='Il rivale ha fissato la propria carta prima della tua scelta.';}
 }else if(event.type==='move'){
  if(s.phase!==`move${event.actor+1}`||!s.config.assignments[s.ids[event.actor]!].includes(event.value))throw Error('Mossa fuori turno o non assegnata');
  n.moves[event.actor]=event.value;n.phase=s.mode==='solo'||event.actor===1?'battle':'handoff';
 }else if(event.type==='handoff'&&s.phase==='handoff')n.phase='move2';
 else if(event.type==='finish'&&s.phase==='battle')n.phase='result';
 else if(event.type==='rematch'&&s.phase==='result'){n.previous=s.moves[0];n.moves=[null,null];n.trial=s.allowedJudges[(s.allowedJudges.indexOf(s.trial)+1)%s.allowedJudges.length];n.round++;n.phase='brief';n.botLine='';}
 else throw Error('Input non valido per questa fase');
 return n;
}
