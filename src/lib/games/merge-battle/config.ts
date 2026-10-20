import { characters, trials } from './catalog.ts';
import {validateCard,vector,validateActiveAxes,DEFAULT_ACTIVE_AXES,type Card} from './cards.ts';
export type MergeConfig={version:2;activeAxes:number[];characters:number[];judges:number[];cards:Card[];assignments:Record<string,string[]>;weights:Record<string,number[]>};
const stats=[[6,2,1,3],[2,4,5,1],[1,4,3,4]];
export const DEFAULT_CONFIG:MergeConfig={version:2,activeAxes:[...DEFAULT_ACTIVE_AXES],characters:characters.map(c=>c.id),judges:trials.map((_,i)=>i),cards:characters.flatMap(c=>c.moves.map((name,i)=>({id:`role-${c.id}-move-${i}`,name,description:'',icon:c.props[i],active:true,stats:[...stats[i]]}))),assignments:Object.fromEntries(characters.map(c=>[c.id,c.moves.map((_,i)=>`role-${c.id}-move-${i}`)])),weights:Object.fromEntries(trials.map((t,i)=>[i,t.priority===0?[3,2,1,1]:t.priority===1?[1,2,3,1]:[1,3,1,3]]))};
const ids=(value:unknown,size:number,min:number):number[]=>{
 if(!Array.isArray(value)||value.length<min||value.length>size||new Set(value).size!==value.length||value.some(id=>!Number.isInteger(id)||id<0||id>=size))throw Error('Abilita almeno due personaggi e un maintainer validi.');return [...value];
};
export function validateConfig(value:unknown):MergeConfig{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Configurazione non valida.');
 const c=value as MergeConfig;
 if(Object.keys(c).some(k=>!['version','activeAxes','characters','judges','cards','assignments','weights'].includes(k))||c.version!==2||!Array.isArray(c.cards)||c.cards.length<3||c.cards.length>100)throw Error('Schema carte non valido: massimo 100 carte.');
 const activeAxes = validateActiveAxes(c.activeAxes === undefined ? DEFAULT_ACTIVE_AXES : c.activeAxes);
 const activeCharacters=ids(c.characters,characters.length,2),judges=ids(c.judges,trials.length,1),cards=c.cards.map(validateCard);
 if(new Set(cards.map(c=>c.id)).size!==cards.length)throw Error('ID carta duplicato.');
 if(!c.assignments||typeof c.assignments!=='object'||Array.isArray(c.assignments)||!c.weights||typeof c.weights!=='object'||Array.isArray(c.weights))throw Error('Assegnazioni o pesi mancanti.');
 const assignments:Record<string,string[]>={},weights:Record<string,number[]>={};
 for(const [role,list] of Object.entries(c.assignments)){
  if(!characters.some(c=>String(c.id)===role)||!Array.isArray(list)||list.length!==3||new Set(list).size!==3||list.some(id=>!cards.some(c=>c.id===id&&(c.active||!activeCharacters.includes(Number(role))))))throw Error('Ogni ruolo attivo richiede tre carte distinte e attive.');
  assignments[role]=[...list];
 }
 for(const role of activeCharacters)if(!assignments[role])throw Error('Carte mancanti per un personaggio attivo.');
 for(const [judge,w] of Object.entries(c.weights)){if(!trials.some((_,i)=>String(i)===judge))throw Error('Maintainer non valido.');weights[judge]=vector(w,1,3);}
 for(const judge of judges)if(!weights[judge])throw Error('Pesi mancanti per un maintainer attivo.');
 const result:MergeConfig={version:2,activeAxes,characters:activeCharacters,judges,cards,assignments,weights};
 if(new TextEncoder().encode(JSON.stringify(result)).length>128000)throw Error('Configurazione troppo grande.');
 return result;
}
export function readConfig(value:unknown):MergeConfig{
 if(value&&typeof value==='object'&&!Array.isArray(value)){
  const old=value as Record<string,unknown>;
  if(old.version===undefined){
   if(Object.keys(old).some(k=>!['characters','judges','pair','judge'].includes(k)))throw Error('Configurazione precedente non valida.');
   return validateConfig({...DEFAULT_CONFIG,characters:old.characters??old.pair,judges:old.judges??[old.judge]});
  }
 }
 return validateConfig(value);
}
