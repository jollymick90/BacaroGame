import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectSource} from './check-firestore-collections.mjs';
test('rejects direct collection access and modular Firestore imports',()=>{
 for(const source of ["db.collection('users')", "db['collection']('slots')", "db.collectionGroup('x')", "import { collection } from 'firebase/firestore';", "db.doc('users/id')", "getFirestore(app)"])
 assert.ok(inspectSource(source,'src/example.ts').length,source);
});
test('allows the existing scoped document and transaction operations',()=>{
 assert.deepEqual(inspectSource("membersCollection().doc(user.uid); tx.update(record.ref, data)",'src/example.ts'),[]);
});

test('does not confuse game collection state or ranked documents with SDK calls',()=>{
 assert.deepEqual(inspectSource('this.collection=[0,0]; const item=ranked[0].doc;', 'src/game.ts'),[]);
});

test('configuration document access remains restricted to the gateway',()=>{
 assert.ok(inspectSource("gameCollection('bacaroGameConfigurations').doc('merge-battle')",'src/example.ts').length);
 assert.deepEqual(inspectSource("gameCollection(name).doc(id)",'src/lib/firebase/game-collections.server.ts'),[]);
});
