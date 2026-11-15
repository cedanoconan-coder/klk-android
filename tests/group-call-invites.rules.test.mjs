import {readFileSync} from 'node:fs';
import {before,after,beforeEach,test} from 'node:test';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,updateDoc,getDoc,Timestamp,arrayUnion} from 'firebase/firestore';
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-klk',firestore:{rules:readFileSync('firestore.rules','utf8')}})});
after(async()=>env.cleanup());
beforeEach(async()=>env.clearFirestore());
const db=id=>env.authenticatedContext(id).firestore();
async function seed(){await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'groupCalls/room1'),{hostUid:'a',memberUids:['a','b'],activeUids:['a','b'],status:'active',createdAt:Timestamp.now()}))}
test('participante puede invitar a un tercero y éste puede entrar',async()=>{await seed();await assertSucceeds(updateDoc(doc(db('b'),'groupCalls/room1'),{memberUids:arrayUnion('c')}));await assertSucceeds(getDoc(doc(db('c'),'groupCalls/room1')));await assertSucceeds(updateDoc(doc(db('c'),'groupCalls/room1'),{activeUids:arrayUnion('c')}))});
test('externos no pueden invitar',async()=>{await seed();await assertFails(updateDoc(doc(db('x'),'groupCalls/room1'),{memberUids:arrayUnion('c')}))});
test('no se puede superar cuatro miembros',async()=>{await seed();await assertSucceeds(updateDoc(doc(db('a'),'groupCalls/room1'),{memberUids:arrayUnion('c')}));await assertSucceeds(updateDoc(doc(db('b'),'groupCalls/room1'),{memberUids:arrayUnion('d')}));await assertFails(updateDoc(doc(db('c'),'groupCalls/room1'),{memberUids:arrayUnion('e')}))});
test('no se puede eliminar otro miembro ni cambiar host al invitar',async()=>{await seed();await assertFails(updateDoc(doc(db('b'),'groupCalls/room1'),{memberUids:['a','c']}));await assertFails(updateDoc(doc(db('b'),'groupCalls/room1'),{hostUid:'b',memberUids:arrayUnion('c')}))});
test('no se puede añadir miembro a llamada terminada',async()=>{await seed();await assertSucceeds(updateDoc(doc(db('a'),'groupCalls/room1'),{status:'ended'}));await assertFails(updateDoc(doc(db('b'),'groupCalls/room1'),{memberUids:arrayUnion('c')}))});
