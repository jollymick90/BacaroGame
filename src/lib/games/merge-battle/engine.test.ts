import {test} from 'node:test';
import assert from 'node:assert/strict';
import {characters,trials,resolve,roleCards,createSession,input,publicSession} from './engine.ts';
import {DEFAULT_CONFIG} from './config.ts';
const card=(role:number,slot:number)=>DEFAULT_CONFIG.assignments[role][slot];
test('every pair, judge and card combination resolves symmetrically including ties',()=>{
 for(const a of characters)for(const b of characters)if(a.id!==b.id)for(let t=0;t<trials.length;t++)for(let x=0;x<3;x++)for(let y=0;y<3;y++){
 const r=resolve([a.id,b.id],[card(a.id,x),card(b.id,y)],t),swapped=resolve([b.id,a.id],[card(b.id,y),card(a.id,x)],t);
 assert.equal(r.winner,swapped.winner===null?null:1-swapped.winner);assert.deepEqual(r.scores,[...swapped.scores].reverse());assert.equal(r.hybrid,swapped.hybrid);assert.ok(r.reason.length>20);
 }
});
test('local handoff hides card IDs and prevents wrong-turn or unassigned cards',()=>{
 let s=input(createSession('local'),{type:'character',actor:0,value:0});
 assert.throws(()=>input(s,{type:'character',actor:1,value:0}));
 s=input(s,{type:'character',actor:1,value:1});s=input(s,{type:'ready'});
 assert.throws(()=>input(s,{type:'move',actor:0,value:card(1,0)}));
 s=input(s,{type:'move',actor:0,value:card(0,0)});assert.equal(s.phase,'handoff');assert.deepEqual(publicSession(s).moves,[null,null]);
 assert.throws(()=>input(s,{type:'move',actor:1,value:card(1,0)}));
 s=input(s,{type:'handoff'});s=input(s,{type:'move',actor:1,value:card(1,0)});
 assert.equal(resolve(s.ids as number[],s.moves as string[],s.trial,s.config).winner,null);
 assert.deepEqual(publicSession(s).moves,[card(0,0),card(1,0)]);s=input(s,{type:'finish'});s=input(s,{type:'rematch'});assert.equal(s.trial,1);assert.deepEqual(s.moves,[null,null]);
});
test('all roles finish multiple local and solo rounds with legal bot cards',()=>{
 for(const mode of ['solo','local'] as const)for(const c of characters){
 let s=input(createSession(mode),{type:'character',actor:0,value:c.id});if(mode==='local')s=input(s,{type:'character',actor:1,value:(c.id+1)%characters.length});
 for(let round=0;round<3;round++){
 s=input(s,{type:'ready'});const bot=s.moves[1];
 for(const alternative of roleCards(s.config,c.id))if(mode==='solo')assert.equal(input(s,{type:'move',actor:0,value:alternative.id}).moves[1],bot);
 s=input(s,{type:'move',actor:0,value:card(c.id,round)});if(mode==='local'){s=input(s,{type:'handoff'});s=input(s,{type:'move',actor:1,value:card(s.ids[1]!,round)});}
 assert.equal(s.phase,'battle');assert.ok(resolve(s.ids as number[],s.moves as string[],s.trial,s.config));s=input(s,{type:'finish'});s=input(s,{type:'rematch'});
 }
 }
});
test('session snapshots survive edits and deactivation in the source config',()=>{
 const config=structuredClone(DEFAULT_CONFIG);let s=createSession('local',0,config);
 config.cards[0].active=false;config.weights[0]=[1,1,1,1];config.assignments[0][0]='missing';
 assert.equal(s.config.cards[0].active,true);assert.equal(s.config.assignments[0][0],card(0,0));assert.deepEqual(s.config.weights[0],[3,2,1,1]);
 s=input(s,{type:'character',actor:0,value:0});assert.equal(s.ids[0],0);
});
test('invalid judges and card IDs cannot resolve',()=>{
 assert.throws(()=>createSession('solo',99));assert.throws(()=>resolve([0,1],['missing',card(1,0)],0));assert.throws(()=>resolve([0,0],[card(0,0),card(0,1)],0));
});

test('resolution, explanation and session snapshot respect active parameters', () => {
 const config = structuredClone(DEFAULT_CONFIG);
 config.activeAxes = [1];
 const session = createSession('solo', 0, config);
 config.activeAxes.push(2);
 assert.deepEqual(session.config.activeAxes, [1]);
 const result = resolve([0, 1], [card(0, 0), card(1, 1)], 0, session.config);
 assert.deepEqual(result.scores, [4, 8]);
 assert.deepEqual(result.contributions, [[0, 4, 0, 0], [0, 8, 0, 0]]);
 assert.equal(result.winner, 1);
 assert.equal(result.calculations[0], 'Disattivo la feature con un flag: 2×2 = 4');
 assert.ok(result.reason.includes('Solidità'));
 assert.ok(!result.reason.includes('Evidenza'));
});
