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
  deleteDoc,
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

test("el propietario puede actualizar su perfil aunque el correo del token esté desactualizado", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/member-1"), {
      uid:"member-1", email:"old@example.com", displayName:"Miembro",
      updatedAt:Timestamp.now()
    });
  });
  const owner = testEnv.authenticatedContext("member-1", {email:"old@example.com"}).firestore();
  const outsider = testEnv.authenticatedContext("member-2").firestore();
  await assertSucceeds(setDoc(doc(owner,"users/member-1"), {
    uid:"member-1", email:"new@example.com", displayName:"Miembro actualizado",
    updatedAt:serverTimestamp()
  }, {merge:true}));
  await assertFails(setDoc(doc(outsider,"users/member-1"), {
    uid:"member-1", email:"intruso@example.com", displayName:"Intruso",
    updatedAt:serverTimestamp()
  }, {merge:true}));
});

test("el propietario puede guardar su perfil si el token no incluye correo", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/member-1"), {
      uid:"member-1", email:"member@example.com", displayName:"Miembro",
      updatedAt:Timestamp.now()
    });
  });
  const owner = testEnv.authenticatedContext("member-1").firestore();
  await assertSucceeds(setDoc(doc(owner,"users/member-1"), {
    uid:"member-1", email:"", displayName:"Miembro",
    updatedAt:serverTimestamp()
  }, {merge:true}));
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

test("un miembro también puede iniciar el chat cuando su UID queda en la segunda posición", async () => {
  await seedPublicProfile("member-1", true);
  const db = testEnv.authenticatedContext("member-2").firestore();
  await assertSucceeds(setDoc(doc(db, "conversations/member-1__member-2"), {
    members:["member-1","member-2"], createdAt:serverTimestamp()
  }));
});

test("cada miembro puede listar sus propias conversaciones", async () => {
  await seedConversation();
  const member = testEnv.authenticatedContext("member-1").firestore();
  const outsider = testEnv.authenticatedContext("outsider").firestore();
  await assertFails(getDocs(collection(member,"conversations")));
  const own = await assertSucceeds(getDocs(query(
    collection(member,"conversations"),where("members","array-contains","member-1")
  )));
  assert.equal(own.size,1);
  const none = await assertSucceeds(getDocs(query(
    collection(outsider,"conversations"),where("members","array-contains","outsider")
  )));
  assert.equal(none.size,0);
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
  // UID is the authoritative sender identity; a missing/stale email claim must not block delivery.
  const {email: _email, ...messageWithoutEmail} = message;
  await assertSucceeds(setDoc(doc(member,"conversations/member-1__member-2/messages/message-2"),messageWithoutEmail));
  await assertSucceeds(getDoc(doc(recipient,"conversations/member-1__member-2/messages/message-1")));
  await assertSucceeds(getDoc(doc(recipient,"conversations/member-1__member-2/messages/message-2")));
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

test("solo el autor y sus contactos QR autorizados pueden consultar estados", async () => {
  await seedPublicProfile("owner", false);
  await testEnv.withSecurityRulesDisabled(async context => {
    const admin=context.firestore();
    await setDoc(doc(admin,"statuses/status-visible"),{
      uid:"owner",displayName:"Propietario",type:"text",text:"Hola",
      createdAt:Timestamp.now(),expiresAt:Timestamp.fromMillis(Date.now()+24*60*60*1000)
    });
    await setDoc(doc(admin,"qrContacts/owner/members/member"),{uid:"member",addedAt:Timestamp.now()});
  });
  const owner=testEnv.authenticatedContext("owner").firestore();
  const member=testEnv.authenticatedContext("member").firestore();
  const outsider=testEnv.authenticatedContext("outsider").firestore();
  await assertSucceeds(getDoc(doc(owner,"statuses/status-visible")));
  await assertSucceeds(getDoc(doc(member,"statuses/status-visible")));
  await assertFails(getDoc(doc(outsider,"statuses/status-visible")));
  await assertSucceeds(getDocs(query(collection(member,"statuses"),where("uid","==","owner"))));
  await assertFails(getDocs(query(collection(outsider,"statuses"),where("expiresAt",">",Timestamp.fromMillis(Date.now())))));
  await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(),"statuses/status-visible")));
});

test("solo contactos autorizados pueden reaccionar y registrar vistas", async () => {
  await seedPublicProfile("owner", false);
  await testEnv.withSecurityRulesDisabled(async context => {
    const admin = context.firestore();
    await setDoc(doc(admin,"statuses/status-interactions"),{
      uid:"owner",displayName:"Propietario",type:"text",text:"Estado",
      createdAt:Timestamp.now(),expiresAt:Timestamp.fromMillis(Date.now()+24*60*60*1000)
    });
    await setDoc(doc(admin,"qrContacts/owner/members/member"),{uid:"member",addedAt:Timestamp.now()});
  });
  const member = testEnv.authenticatedContext("member").firestore();
  const outsider = testEnv.authenticatedContext("outsider").firestore();
  await assertSucceeds(setDoc(doc(member,"statuses/status-interactions/likes/member"),{
    uid:"member",displayName:"Miembro",likedAt:serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(member,"statuses/status-interactions/views/member"),{
    uid:"member",displayName:"Miembro",viewedAt:serverTimestamp()
  }));
  await assertSucceeds(getDoc(doc(member,"statuses/status-interactions/likes/member")));
  await assertFails(getDoc(doc(outsider,"statuses/status-interactions/likes/member")));
  await assertFails(setDoc(doc(outsider,"statuses/status-interactions/likes/outsider"),{
    uid:"outsider",displayName:"Desconocido",likedAt:serverTimestamp()
  }));
  await assertFails(setDoc(doc(outsider,"statuses/status-interactions/views/outsider"),{
    uid:"outsider",displayName:"Desconocido",viewedAt:serverTimestamp()
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


test("cada usuario administra su propia lista de bloqueos y no puede leer la de otros", async () => {
  const owner = testEnv.authenticatedContext("member-1").firestore();
  const other = testEnv.authenticatedContext("member-2").firestore();
  const blockRef = doc(owner, "userBlocks/member-1/blocked/member-2");
  await assertSucceeds(setDoc(blockRef, {blockedUid:"member-2",createdAt:serverTimestamp()}));
  await assertSucceeds(getDoc(blockRef));
  await assertFails(getDoc(doc(other, "userBlocks/member-1/blocked/member-2")));
  await assertFails(setDoc(doc(owner, "userBlocks/member-1/blocked/member-1"), {
    blockedUid:"member-1",createdAt:serverTimestamp()
  }));
  await assertSucceeds(deleteDoc(blockRef));
});

test("un bloqueo impide abrir y leer la conversación para ambos participantes", async () => {
  await seedConversation();
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "userBlocks/member-1/blocked/member-2"), {
      blockedUid:"member-2",createdAt:Timestamp.now()
    });
  });
  const first = testEnv.authenticatedContext("member-1").firestore();
  const second = testEnv.authenticatedContext("member-2").firestore();
  await assertFails(getDoc(doc(first, "conversations/member-1__member-2")));
  await assertFails(getDoc(doc(second, "conversations/member-1__member-2")));
  await assertFails(getDocs(collection(first, "conversations/member-1__member-2/messages")));
  await assertFails(getDocs(collection(second, "conversations/member-1__member-2/messages")));
});

test("la configuración de mensajes temporales solo la pueden cambiar los miembros del chat", async () => {
  await seedConversation();
  const member = testEnv.authenticatedContext("member-1").firestore();
  const outsider = testEnv.authenticatedContext("outsider").firestore();
  const settings = doc(member, "conversations/member-1__member-2/settings/disappearingMessages");
  await assertSucceeds(setDoc(settings, {
    durationHours: 24, updatedAt: serverTimestamp(), updatedBy: "member-1"
  }));
  await assertFails(getDoc(doc(outsider, "conversations/member-1__member-2/settings/disappearingMessages")));
  await assertFails(setDoc(doc(outsider, "conversations/member-1__member-2/settings/disappearingMessages"), {
    durationHours: 0, updatedAt: serverTimestamp(), updatedBy: "outsider"
  }));
});

test("rechaza duraciones temporales no permitidas", async () => {
  await seedConversation();
  const member = testEnv.authenticatedContext("member-1").firestore();
  await assertFails(setDoc(doc(member, "conversations/member-1__member-2/settings/disappearingMessages"), {
    durationHours: 48, updatedAt: serverTimestamp(), updatedBy: "member-1"
  }));
});

test("cuando los mensajes temporales están activos, no acepta mensajes sin fecha de expiración", async () => {
  await seedConversation();
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "conversations/member-1__member-2/settings/disappearingMessages"), {
      durationHours: 24, updatedAt: Timestamp.now(), updatedBy: "member-1"
    });
  });
  const db = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  await assertFails(setDoc(doc(db, "conversations/member-1__member-2/messages/without-expiry"), {
    type:"text", text:"Este mensaje debe tener expiración", uid:"member-1",
    email:"member1@example.com", displayName:"Miembro Uno", createdAt:serverTimestamp()
  }));
});

test("permite mensajes normales sin expiración cuando la función está desactivada", async () => {
  await seedConversation();
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "conversations/member-1__member-2/settings/disappearingMessages"), {
      durationHours: 0, updatedAt: Timestamp.now(), updatedBy: "member-1"
    });
  });
  const db = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  await assertSucceeds(setDoc(doc(db, "conversations/member-1__member-2/messages/normal"), {
    type:"text", text:"Mensaje normal", uid:"member-1",
    email:"member1@example.com", displayName:"Miembro Uno", createdAt:serverTimestamp()
  }));
});


test("las invitaciones no se pueden consultar sin autenticación ni después de expirar", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "invitations/valid-code"), {
      createdBy:"owner", createdAt:Timestamp.fromMillis(Date.now()-60000),
      expiresAt:Timestamp.fromMillis(Date.now()+3600000), redeemedBy:null, redeemedAt:null
    });
    await setDoc(doc(db, "invitations/expired-code"), {
      createdBy:"owner", createdAt:Timestamp.fromMillis(Date.now()-7200000),
      expiresAt:Timestamp.fromMillis(Date.now()-3600000), redeemedBy:null, redeemedAt:null
    });
  });
  const guest = testEnv.unauthenticatedContext().firestore();
  const member = testEnv.authenticatedContext("member-1").firestore();
  await assertFails(getDoc(doc(guest,"invitations/valid-code")));
  await assertSucceeds(getDoc(doc(member,"invitations/valid-code")));
  await assertFails(getDoc(doc(member,"invitations/expired-code")));
  await assertFails(getDocs(collection(member,"invitations")));
});
