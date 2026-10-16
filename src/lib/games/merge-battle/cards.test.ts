import {test} from 'node:test';
import assert from 'node:assert/strict';
import {score,compareCards,validateCard} from './cards.ts';
const hot={id:'hotfix',name:'Hotfix',description:'Patch',icon:'↶',active:true,stats:[6,2,1,3]};
const regression={...hot,id:'test',stats:[2,4,5,1]};
test('weights change verdict; swapping cards reverses winner; equal scores draw',()=>{
 assert.equal(score(hot.stats,[3,2,1,1]),26);
 assert.equal(compareCards(hot,regression,[3,2,1,1]).winner,0);
 assert.equal(compareCards(hot,regression,[1,2,3,1]).winner,1);
 assert.equal(compareCards(regression,hot,[1,2,3,1]).winner,0);
 assert.equal(compareCards(hot,regression,[1,1,1,1]).winner,null);
});
test('invalid points, ids, icons and budget are rejected',()=>{
 assert.equal(validateCard(hot).id,'hotfix');
 for(const change of [{stats:[6,6,6,6]},{stats:[NaN,2,1,3]},{stats:[6,2,1,-1]},{stats:[6,2,1.5,2.5]},{id:'a/b'},{icon:'<script>'},{name:''}]) assert.throws(()=>validateCard({...hot,...change}));
});
