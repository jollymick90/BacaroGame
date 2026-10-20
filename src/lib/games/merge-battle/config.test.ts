import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig,readConfig,DEFAULT_CONFIG} from './config.ts';
import {createSession,input} from './engine.ts';
const copy=()=>structuredClone(DEFAULT_CONFIG);
test('default deck is valid; legacy catalogs migrate preserving enabled roles and judges',()=>{
 assert.deepEqual(validateConfig(DEFAULT_CONFIG),DEFAULT_CONFIG);
 for(const legacy of [{judge:7,pair:[9,11]},{characters:[9,11],judges:[7]}]){const c=readConfig(legacy);assert.equal(c.version,2);assert.deepEqual(c.characters,[9,11]);assert.deepEqual(c.judges,[7]);assert.equal(c.assignments[9].length,3);}
});
test('rejects missing, inactive and duplicate card assignments',()=>{
 for(const mutate of [(c:ReturnType<typeof copy>)=>{c.assignments[0][0]='missing';},(c:ReturnType<typeof copy>)=>{c.cards[0].active=false;},(c:ReturnType<typeof copy>)=>{c.assignments[0][1]=c.assignments[0][0];},(c:ReturnType<typeof copy>)=>{c.cards.push({...c.cards[0]});}]){const c=copy();mutate(c);assert.throws(()=>validateConfig(c));}
});
test('rejects invalid active catalogs, judge weights and overlong content',()=>{
 for(const c of [{...copy(),characters:[0]},{...copy(),judges:[]},{...copy(),judges:[8]},{...copy(),characters:[0,0]}])assert.throws(()=>validateConfig(c));
 const c=copy();c.weights[0]=[1,2,3,4];assert.throws(()=>validateConfig(c));c.weights[0]=[1,2,3,1];c.cards[0].description='x'.repeat(501);assert.throws(()=>validateConfig(c));
});
test('custom cards use stable IDs and restricted bots/rematches stay enabled',()=>{
 const c=copy();c.characters=[9,11];c.judges=[7,5];c.cards.push({id:'my-card',name:'Mossa nostra',description:'Test libero',icon:'⌘',active:true,stats:[3,3,3,3]});c.assignments[11][0]='my-card';
 let s=createSession('solo',7,c);assert.throws(()=>input(s,{type:'character',actor:0,value:0}));s=input(s,{type:'character',actor:0,value:11});assert.equal(s.ids[1],9);
 for(const judge of [7,5,7]){assert.equal(s.trial,judge);s=input(s,{type:'ready'});s=input(s,{type:'move',actor:0,value:'my-card'});s=input(s,{type:'finish'});s=input(s,{type:'rematch'});}
});

test('old v2 configurations default to two axes without altering stored values', () => {
 const legacy = structuredClone(DEFAULT_CONFIG) as Record<string, unknown>;
 delete legacy.activeAxes;
 const migrated = readConfig(legacy);
 assert.deepEqual(migrated.activeAxes, [0, 1]);
 assert.deepEqual(migrated.cards, legacy.cards);
 assert.deepEqual(migrated.weights, legacy.weights);
 assert.deepEqual(validateConfig({...legacy, activeAxes: [3, 0]}).activeAxes, [0, 3]);
 for (const activeAxes of [[], [0, 0], [4], [null], 'all', null]) {
  assert.throws(() => validateConfig({...legacy, activeAxes}));
 }
});
