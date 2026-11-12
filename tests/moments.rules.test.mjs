import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, collection, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";

let env;
const path = "conversations/member-1__member-2/moments/";
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-klk",
    firestore: { rules: readFileSync("firestore.rules", "utf8") }
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "conversations/member-1__member-2"), {
      members: ["member-1", "member-2"], createdAt: Timestamp.now()
    });
  });
});
const db = uid => env.authenticatedContext(uid).firestore();
const moment = () => ({
  title: "Recuerdo de prueba", message: "Prueba de permisos",
  createdBy: "member-1", createdAt: serverTimestamp(), kind: "memory"
});

test("ambos participantes pueden leer y el creador puede guardar", async () => {
  await assertSucceeds(setDoc(doc(db("member-1"), path + "first"), moment()));
  await assertSucceeds(getDoc(doc(db("member-2"), path + "first")));
  await assertSucceeds(getDocs(collection(db("member-2"), "conversations/member-1__member-2/moments")));
});
test("un tercero no puede leer ni crear recuerdos", async () => {
  await assertFails(setDoc(doc(db("outsider"), path + "bad"), moment()));
  await assertFails(getDoc(doc(db("outsider"), path + "first")));
  await assertFails(getDocs(collection(db("outsider"), "conversations/member-1__member-2/moments")));
});
test("rechaza autor falso y campos no autorizados", async () => {
  await assertFails(setDoc(doc(db("member-2"), path + "forged"), moment()));
  await assertFails(setDoc(doc(db("member-1"), path + "extra"), {...moment(), public: true}));
  await assertFails(setDoc(doc(db("member-1"), path + "capsule"), {...moment(), unlockAt: Timestamp.now()}));
});
test("bloqueos impiden acceso a recuerdos", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "userBlocks/member-2/blocked/member-1"), {
      blockedUid: "member-1", createdAt: Timestamp.now()
    });
  });
  await assertFails(setDoc(doc(db("member-1"), path + "blocked"), moment()));
  await assertFails(getDoc(doc(db("member-2"), path + "first")));
});
