import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RESERVED_COLLECTIONS, GAME_COLLECTIONS, approvedCollectionName} from './collections.ts';
test('all six existing collections are reserved and rejected',()=>{
 assert.deepEqual([...RESERVED_COLLECTIONS],['change_requests','fcm_tokens','invites','slots','speakers','users']);
 for(const name of RESERVED_COLLECTIONS)assert.throws(()=>approvedCollectionName(name));
});
test('only explicitly registered top-level game collections are allowed',()=>{
 assert.deepEqual(Object.values(GAME_COLLECTIONS),['bacarodexMembers','bacaroGameConfigurations']);
 assert.equal(approvedCollectionName(GAME_COLLECTIONS.members),'bacarodexMembers');
 assert.equal(approvedCollectionName(GAME_COLLECTIONS.configurations),'bacaroGameConfigurations');
 for(const name of ['newCollection','bacarodexMembers/member/slots','users/uid','', 'members'])assert.throws(()=>approvedCollectionName(name));
});
