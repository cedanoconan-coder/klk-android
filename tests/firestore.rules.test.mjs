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

test("permite a un usuario autenticado consultar el directorio", async () => {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/member-1"), {
      uid: "member-1",
      displayName: "Miembro de prueba"
    });
  });

  const db = testEnv.authenticatedContext("member-2", {
    email: "member2@example.com"
  }).firestore();

  await assertSucceeds(getDocs(collection(db, "users")));
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
