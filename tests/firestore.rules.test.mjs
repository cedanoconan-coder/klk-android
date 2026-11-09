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
    firestore: {
      rules: readFileSync("firestore.rules", "utf8")
    }
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

test("bloquea la lectura de perfiles sin iniciar sesión", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "users/member-1")));
});

test("un usuario autenticado no puede listar documentos privados de otros miembros", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/member-1"), {
      uid: "member-1",
      displayName: "Miembro de prueba"
    });
  });

  const db = testEnv.authenticatedContext("member-2", {
    email: "member2@example.com"
  }).firestore();

  await assertFails(getDocs(collection(db, "users")));
  await assertFails(getDoc(doc(db, "users/member-1")));
});

test("rechaza crear perfiles sin una invitación válida", async () => {
  const db = testEnv.authenticatedContext("member-1", {
    email: "member1@example.com"
  }).firestore();

  await assertFails(setDoc(doc(db, "users/member-1"), {
    uid: "member-1",
    email: "member1@example.com",
    displayName: "Miembro",
    updatedAt: Timestamp.now(),
    inviteCode: "inexistente",
    invitedBy: "admin"
  }));
});


test("cada usuario puede leer su propio perfil privado", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/member-1"), {uid:"member-1",email:"private@example.com"});
  });
  const db = testEnv.authenticatedContext("member-1", {email:"private@example.com"}).firestore();
  await assertSucceeds(getDoc(doc(db, "users/member-1")));
});

test("el directorio solo devuelve perfiles con visibilidad activada", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db,"publicProfiles/visible"), {uid:"visible",displayName:"Visible",directoryVisible:true,updatedAt:Timestamp.now()});
    await setDoc(doc(db,"publicProfiles/hidden"), {uid:"hidden",displayName:"Oculto",directoryVisible:false,updatedAt:Timestamp.now()});
  });
  const db = testEnv.authenticatedContext("visitor").firestore();
  const visible = await assertSucceeds(getDocs(query(collection(db,"publicProfiles"),where("directoryVisible","==",true))));
  assert.equal(visible.size,1);
  assert.equal(visible.docs[0].id,"visible");
  await assertFails(getDoc(doc(db,"publicProfiles/hidden")));
});

test("un perfil público no puede incluir correo electrónico", async () => {
  const db = testEnv.authenticatedContext("member-1").firestore();
  await assertFails(setDoc(doc(db,"publicProfiles/member-1"), {
    uid:"member-1",displayName:"Miembro",email:"private@example.com",
    directoryVisible:true,updatedAt:serverTimestamp()
  }));
});

test("cada miembro puede crear su perfil público con visibilidad voluntaria", async () => {
  const db = testEnv.authenticatedContext("member-1").firestore();
  await assertSucceeds(setDoc(doc(db,"publicProfiles/member-1"), {
    uid:"member-1",displayName:"Miembro",about:"Hola",directoryVisible:false,updatedAt:serverTimestamp()
  }));
});


test("permite publicar estados sin exponer el correo electrónico", async () => {
  const db = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  await assertSucceeds(setDoc(doc(db,"statuses/status-safe"), {
    uid:"member-1",displayName:"Miembro",type:"text",text:"Hola",
    createdAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+24*60*60*1000)
  }));
});

test("rechaza guardar correo electrónico en un estado", async () => {
  const db = testEnv.authenticatedContext("member-1", {email:"member1@example.com"}).firestore();
  await assertFails(setDoc(doc(db,"statuses/status-email"), {
    uid:"member-1",email:"member1@example.com",displayName:"Miembro",type:"text",text:"Hola",
    createdAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+24*60*60*1000)
  }));
});

test("bloquea la colección global heredada de mensajes", async () => {
  const db = testEnv.authenticatedContext("member-1", {
    email: "member1@example.com"
  }).firestore();

  await assertFails(getDocs(collection(db, "messages")));
  await assertFails(setDoc(doc(db, "messages/message-1"), {
    text: "No debe guardarse aquí"
  }));
});

test("solo permite leer mensajes a miembros de la conversación", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "conversations/member-1__member-2"), {
      members: ["member-1", "member-2"],
      createdAt: Timestamp.now()
    });
    await setDoc(doc(db, "conversations/member-1__member-2/messages/message-1"), {
      type: "text",
      text: "Mensaje de prueba",
      uid: "member-1",
      email: "member1@example.com",
      createdAt: Timestamp.now()
    });
  });

  const memberDb = testEnv.authenticatedContext("member-2", {
    email: "member2@example.com"
  }).firestore();
  const outsiderDb = testEnv.authenticatedContext("outsider", {
    email: "outsider@example.com"
  }).firestore();

  await assertSucceeds(getDoc(doc(
    memberDb,
    "conversations/member-1__member-2/messages/message-1"
  )));
  await assertFails(getDoc(doc(
    outsiderDb,
    "conversations/member-1__member-2/messages/message-1"
  )));
});

test("permite enviar mensajes de texto con el nombre del remitente a contactos aceptados", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "contactRequests/member-1__member-2"), {
      senderUid: "member-1", recipientUid: "member-2", status: "accepted"
    });
    await setDoc(doc(db, "conversations/member-1__member-2"), {
      members: ["member-1", "member-2"], createdAt: Timestamp.now()
    });
  });
  const db = testEnv.authenticatedContext("member-1", {email: "member1@example.com"}).firestore();
  await assertSucceeds(setDoc(doc(db, "conversations/member-1__member-2/messages/message-sent"), {
    type: "text", text: "Hola", email: "member1@example.com", uid: "member-1",
    displayName: "Miembro Uno", createdAt: serverTimestamp()
  }));
});

test("permite iniciar una conversación con una invitación pendiente sin aceptarla", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "contactRequests/member-1__member-2"), {
      senderUid: "member-1", recipientUid: "member-2", status: "pending"
    });
  });

  const db = testEnv.authenticatedContext("member-1", {
    email: "member1@example.com"
  }).firestore();

  await assertSucceeds(setDoc(doc(db, "conversations/member-1__member-2"), {
    members: ["member-1", "member-2"],
    createdAt: serverTimestamp()
  }));
});

test("rechaza nombres de remitente inválidos en los mensajes", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "contactRequests/member-1__member-2"), {
      senderUid: "member-1", recipientUid: "member-2", status: "accepted"
    });
    await setDoc(doc(db, "conversations/member-1__member-2"), {
      members: ["member-1", "member-2"], createdAt: Timestamp.now()
    });
  });
  const db = testEnv.authenticatedContext("member-1", {email: "member1@example.com"}).firestore();
  await assertFails(setDoc(doc(db, "conversations/member-1__member-2/messages/message-invalid"), {
    type: "text", text: "No debe enviarse", email: "member1@example.com", uid: "member-1",
    displayName: 123, createdAt: serverTimestamp()
  }));
});


test("solo el propietario y sus contactos aceptados pueden leer estados", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "contactRequests/owner__friend"), {
      senderUid: "owner", recipientUid: "friend", status: "accepted"
    });
    await setDoc(doc(db, "statuses/status-private"), {
      uid: "owner", displayName: "Propietario", type: "text", text: "Solo contactos",
      createdAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + 24*60*60*1000)
    });
  });
  const ownerDb = testEnv.authenticatedContext("owner").firestore();
  const friendDb = testEnv.authenticatedContext("friend").firestore();
  const outsiderDb = testEnv.authenticatedContext("outsider").firestore();
  await assertSucceeds(getDoc(doc(ownerDb, "statuses/status-private")));
  await assertSucceeds(getDoc(doc(friendDb, "statuses/status-private")));
  await assertFails(getDoc(doc(outsiderDb, "statuses/status-private")));
});

test("un contacto aceptado puede dar me gusta y un desconocido no puede leer ni reaccionar", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "contactRequests/owner__friend"), {
      senderUid: "owner", recipientUid: "friend", status: "accepted"
    });
    await setDoc(doc(db, "statuses/status-likes"), {
      uid: "owner", displayName: "Propietario", type: "text", text: "Estado",
      createdAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + 24*60*60*1000)
    });
  });
  const friendDb = testEnv.authenticatedContext("friend").firestore();
  const outsiderDb = testEnv.authenticatedContext("outsider").firestore();
  await assertSucceeds(setDoc(doc(friendDb, "statuses/status-likes/likes/friend"), {
    uid: "friend", displayName: "Amigo", likedAt: serverTimestamp()
  }));
  await assertFails(getDocs(collection(outsiderDb, "statuses/status-likes/likes")));
  await assertFails(setDoc(doc(outsiderDb, "statuses/status-likes/likes/outsider"), {
    uid: "outsider", displayName: "Desconocido", likedAt: serverTimestamp()
  }));
});

test("solo los contactos aceptados pueden registrar visualizaciones de un estado", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "contactRequests/owner__friend"), {
      senderUid: "owner", recipientUid: "friend", status: "accepted"
    });
    await setDoc(doc(db, "statuses/status-views"), {
      uid: "owner", displayName: "Propietario", type: "text", text: "Estado",
      createdAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + 24*60*60*1000)
    });
  });
  const friendDb = testEnv.authenticatedContext("friend").firestore();
  const outsiderDb = testEnv.authenticatedContext("outsider").firestore();
  await assertSucceeds(setDoc(doc(friendDb, "statuses/status-views/views/friend"), {
    uid: "friend", displayName: "Amigo", viewedAt: serverTimestamp()
  }));
  await assertFails(setDoc(doc(outsiderDb, "statuses/status-views/views/outsider"), {
    uid: "outsider", displayName: "Desconocido", viewedAt: serverTimestamp()
  }));
});
