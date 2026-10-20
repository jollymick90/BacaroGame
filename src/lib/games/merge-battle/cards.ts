export const AXES=['Rapidità','Solidità','Evidenza','Adattabilità'] as const;
export const ICONS=['↶','⌕','⑂','✓','⚙','∑','⋈','⌘','⬡','▤'] as const;
export type Card={id:string;name:string;description:string;icon:string;active:boolean;stats:number[]};
export function vector(value:unknown,min:number,max:number,total?:number):number[]{
 if(!Array.isArray(value)||value.length!==4||value.some(n=>!Number.isInteger(n)||n<min||n>max)||(total!==undefined&&value.reduce((a,b)=>a+b,0)!==total))throw Error('Quattro valori interi validi richiesti'+(total===undefined?'.':`, totale ${total}.`));
 return [...value];
}
export function validateCard(value:unknown):Card{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Carta non valida.');
 const c=value as Card;
 if(Object.keys(c).some(k=>!['id','name','description','icon','active','stats'].includes(k))||typeof c.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>80||typeof c.description!=='string'||c.description.length>500||!(ICONS as readonly string[]).includes(c.icon)||typeof c.active!=='boolean')throw Error('Nome, descrizione, ID o icona della carta non validi.');
 return {id:c.id,name:c.name.trim(),description:c.description,icon:c.icon,active:c.active,stats:vector(c.stats,0,6,12)};
}
export const DEFAULT_ACTIVE_AXES = [0, 1];

export function validateActiveAxes(value: unknown): number[] {
 if (!Array.isArray(value) || value.length < 1 || value.length > AXES.length ||
     new Set(value).size !== value.length ||
     value.some(axis => !Number.isInteger(axis) || axis < 0 || axis >= AXES.length)) {
  throw Error('Abilita da uno a quattro parametri distinti e validi.');
 }
 return [...value].sort((left, right) => left - right);
}

export function score(stats: number[], weights: number[], activeAxes = DEFAULT_ACTIVE_AXES) {
 const values = vector(stats, 0, 6, 12);
 const multipliers = vector(weights, 1, 3);
 return validateActiveAxes(activeAxes).reduce((total, axis) => total + values[axis] * multipliers[axis], 0);
}

export function compareCards(a: Card, b: Card, weights: number[], activeAxes = DEFAULT_ACTIVE_AXES) {
 const scores = [score(a.stats, weights, activeAxes), score(b.stats, weights, activeAxes)];
 let winner: number | null = null;
 if (scores[0] > scores[1]) winner = 0;
 if (scores[1] > scores[0]) winner = 1;
 return {scores, winner};
}
