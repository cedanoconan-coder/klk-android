import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-klk",
    firestore: { rules: readFileSync("firestore.rules", "utf8") }
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function seedPublicProfile(uid, directoryVisible = true) {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "publicProfiles/" + uid), {
      uid, displayName: "Miembro " + uid, directoryVisible, updatedAt: Timestamp.now()
    });
  });
}

async function seedConversation(a = "member-1", b = "member-2") {
  const members = [a, b].sort();
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "conversations/" + members.join("__")), {
      members, createdAt: Timestamp.now()
    });
  });
}

test("bloquea perfiles privados sin iniciar sesión", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "users/member-1")));
});

test("cada usuario solo puede leer su perfil privado", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/member-1"), {
      uid: "member-1", email: "private@example.com"
    });
  });
  const owner = testEnv.authenticatedContext("member-1", {email:"private@example.com"}).firestore();
  const outsider = testEnv.authenticatedContext("member-2").firestore();
  await assertSucceeds(getDoc(doc(owner, "users/member-1")));
  await assertFails(getDoc(doc(outsider, "users/member-1")));
  await assertFails(getDocs(collection(outsider, "users")));
});

test("rechaza crear un perfil sin una invitación válida", async () => {
  const db = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  await assertFails(setDoc(doc(db, "users/member-1"), {
    uid:"member-1", email:"member1@example.com", displayName:"Miembro",
    updatedAt:serverTimestamp(), inviteCode:"inexistente", invitedBy:"admin"
  }));
});

test("el directorio solo expone perfiles con visibilidad activada", async () => {
  await seedPublicProfile("visible", true);
  await seedPublicProfile("hidden", false);
  const db = testEnv.authenticatedContext("visitor").firestore();
  const visible = await assertSucceeds(getDocs(query(collection(db,"publicProfiles"),where("directoryVisible","==",true))));
  assert.equal(visible.size, 1);
  assert.equal(visible.docs[0].id, "visible");
  await assertFails(getDoc(doc(db,"publicProfiles/hidden")));
});

test("los perfiles públicos no pueden incluir correo electrónico", async () => {
  const db = testEnv.authenticatedContext("member-1").firestore();
  await assertFails(setDoc(doc(db,"publicProfiles/member-1"), {
    uid:"member-1",displayName:"Miembro",email:"private@example.com",
    directoryVisible:true,updatedAt:serverTimestamp()
  }));
});

test("un miembro puede publicar su perfil público sin mostrarlo en el directorio", async () => {
  const db = testEnv.authenticatedContext("member-1").firestore();
  await assertSucceeds(setDoc(doc(db,"publicProfiles/member-1"), {
    uid:"member-1",displayName:"Miembro",about:"Hola",directoryVisible:false,updatedAt:serverTimestamp()
  }));
});

test("bloquea la colección global heredada de mensajes y las solicitudes antiguas", async () => {
  const db = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  await assertFails(getDocs(collection(db, "messages")));
  await assertFails(setDoc(doc(db, "messages/message-1"), {text:"No debe guardarse aquí"}));
  await assertFails(getDocs(collection(db, "contactRequests")));
  await assertFails(setDoc(doc(db, "contactRequests/member-1__member-2"), {status:"pending"}));
});

test("permite iniciar una conversación directamente con un perfil visible", async () => {
  await seedPublicProfile("member-2", true);
  const db = testEnv.authenticatedContext("member-1").firestore();
  await assertSucceeds(setDoc(doc(db, "conversations/member-1__member-2"), {
    members:["member-1","member-2"], createdAt:serverTimestamp()
  }));
});

test("rechaza iniciar conversaciones con perfiles ocultos", async () => {
  await seedPublicProfile("member-2", false);
  const db = testEnv.authenticatedContext("member-1").firestore();
  await assertFails(setDoc(doc(db, "conversations/member-1__member-2"), {
    members:["member-1","member-2"], createdAt:serverTimestamp()
  }));
});

test("solo los miembros pueden leer y enviar mensajes privados", async () => {
  await seedConversation();
  const member = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  const recipient = testEnv.authenticatedContext("member-2", {email:"member2@example.com"}).firestore();
  const outsider = testEnv.authenticatedContext("outsider", {email:"outsider@example.com"}).firestore();
  const message = {
    type:"text", text:"Hola", email:"member1@example.com", uid:"member-1",
    displayName:"Miembro Uno", createdAt:serverTimestamp()
  };
  await assertSucceeds(setDoc(doc(member,"conversations/member-1__member-2/messages/message-1"),message));
  await assertSucceeds(getDoc(doc(recipient,"conversations/member-1__member-2/messages/message-1")));
  await assertFails(getDoc(doc(outsider,"conversations/member-1__member-2/messages/message-1")));
  await assertFails(setDoc(doc(outsider,"conversations/member-1__member-2/messages/message-2"),{
    ...message, uid:"outsider", email:"outsider@example.com"
  }));
});

test("rechaza mensajes con identidad de remitente incorrecta", async () => {
  await seedConversation();
  const db = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  await assertFails(setDoc(doc(db,"conversations/member-1__member-2/messages/invalid"),{
    type:"text",text:"No debe enviarse",email:"someone-else@example.com",
    uid:"member-1",displayName:123,createdAt:serverTimestamp()
  }));
});

test("permite enviar stickers autorizados y rechaza contenido arbitrario", async () => {
  await seedConversation();
  const db = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  await assertSucceeds(setDoc(doc(db,"conversations/member-1__member-2/messages/sticker-ok"),{
    type:"sticker",text:"😂",email:"member1@example.com",uid:"member-1",
    displayName:"Miembro Uno",createdAt:serverTimestamp()
  }));
  await assertFails(setDoc(doc(db,"conversations/member-1__member-2/messages/sticker-invalid"),{
    type:"sticker",text:"contenido no autorizado",email:"member1@example.com",
    uid:"member-1",displayName:"Miembro Uno",createdAt:serverTimestamp()
  }));
});

test("los estados se pueden consultar por cualquier miembro autenticado", async () => {
  await seedPublicProfile("owner", false);
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(),"statuses/status-visible"),{
      uid:"owner",displayName:"Propietario",type:"text",text:"Hola",
      createdAt:Timestamp.now(),expiresAt:Timestamp.fromMillis(Date.now()+24*60*60*1000)
    });
  });
  const owner = testEnv.authenticatedContext("owner").firestore();
  const member = testEnv.authenticatedContext("member").firestore();
  const outsider = testEnv.authenticatedContext("outsider").firestore();
  await assertSucceeds(getDoc(doc(owner,"statuses/status-visible")));
  await assertSucceeds(getDoc(doc(member,"statuses/status-visible")));
  await assertSucceeds(getDoc(doc(outsider,"statuses/status-visible")));
  const anonymous = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anonymous,"statuses/status-visible")));
});

test("un miembro puede reaccionar y registrar una visualización en un estado visible", async () => {
  await seedPublicProfile("owner", false);
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(),"statuses/status-interactions"),{
      uid:"owner",displayName:"Propietario",type:"text",text:"Estado",
      createdAt:Timestamp.now(),expiresAt:Timestamp.fromMillis(Date.now()+24*60*60*1000)
    });
  });
  const member = testEnv.authenticatedContext("member").firestore();
  await assertSucceeds(setDoc(doc(member,"statuses/status-interactions/likes/member"),{
    uid:"member",displayName:"Miembro",likedAt:serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(member,"statuses/status-interactions/views/member"),{
    uid:"member",displayName:"Miembro",viewedAt:serverTimestamp()
  }));
});

test("permite crear una llamada solo dentro de una conversación privada", async () => {
  await seedConversation();
  const db = testEnv.authenticatedContext("member-1").firestore();
  await assertSucceeds(setDoc(doc(db,"calls/call-1"),{
    callerUid:"member-1",calleeUid:"member-2",conversationId:"member-1__member-2",
    mode:"audio",status:"ringing",offer:{type:"offer",sdp:"offer-sdp"},
    createdAt:serverTimestamp(),updatedAt:serverTimestamp()
  }));
});
