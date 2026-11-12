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
const consentPath = "conversations/member-1__member-2/momentSharing/consent";
const invite = () => ({ inviterUid: "member-1", inviteeUid: "member-2", state: "pending", createdAt: serverTimestamp() });
async function acceptInvite() {
  await assertSucceeds(setDoc(doc(db("member-1"), consentPath), invite()));
  await assertSucceeds(setDoc(doc(db("member-2"), consentPath), {state:"accepted",respondedAt:serverTimestamp()}, {merge:true}));
}
const moment = () => ({
  title: "Recuerdo de prueba", message: "Prueba de permisos",
  createdBy: "member-1", createdAt: serverTimestamp(), kind: "memory"
});

test("ambos participantes pueden leer y el creador puede guardar tras aceptar", async () => {
  await acceptInvite();
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
  await acceptInvite();
  await assertFails(setDoc(doc(db("member-2"), path + "forged"), moment()));
  await assertFails(setDoc(doc(db("member-1"), path + "extra"), {...moment(), public: true}));
  await assertFails(setDoc(doc(db("member-1"), path + "capsule"), {...moment(), unlockAt: Timestamp.now()}));
});
test("bloqueos impiden acceso a recuerdos", async () => {
  await acceptInvite();
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "userBlocks/member-2/blocked/member-1"), {
      blockedUid: "member-1", createdAt: Timestamp.now()
    });
  });
  await assertFails(setDoc(doc(db("member-1"), path + "blocked"), moment()));
  await assertFails(getDoc(doc(db("member-2"), path + "first")));
});

test("sin consentimiento ninguno puede crear ni leer recuerdos", async () => {
  await assertFails(setDoc(doc(db("member-1"), path + "before"), moment()));
  await assertFails(getDoc(doc(db("member-2"), path + "before")));
});
test("solo destinatario puede aceptar o rechazar", async () => {
  await assertSucceeds(setDoc(doc(db("member-1"), consentPath), invite()));
  await assertFails(setDoc(doc(db("member-1"), consentPath), {state:"accepted",respondedAt:serverTimestamp()}, {merge:true}));
  await assertFails(setDoc(doc(db("outsider"), consentPath), {state:"accepted",respondedAt:serverTimestamp()}, {merge:true}));
  await assertSucceeds(setDoc(doc(db("member-2"), consentPath), {state:"accepted",respondedAt:serverTimestamp()}, {merge:true}));
});
test("rechazo impide guardar y no se puede reactivar sin invitacion nueva", async () => {
  await assertSucceeds(setDoc(doc(db("member-1"), consentPath), invite()));
  await assertSucceeds(setDoc(doc(db("member-2"), consentPath), {state:"rejected",respondedAt:serverTimestamp()}, {merge:true}));
  await assertFails(setDoc(doc(db("member-1"), path + "rejected"), moment()));
  await assertFails(setDoc(doc(db("member-2"), consentPath), {state:"accepted",respondedAt:serverTimestamp()}, {merge:true}));
});
test("cualquiera revoca y revocacion bloquea lecturas", async () => {
  await acceptInvite();
  await assertSucceeds(setDoc(doc(db("member-1"), path + "saved"), moment()));
  await assertSucceeds(setDoc(doc(db("member-2"), consentPath), {state:"revoked",respondedAt:serverTimestamp()}, {merge:true}));
  await assertFails(getDoc(doc(db("member-1"), path + "saved")));
  await assertFails(setDoc(doc(db("member-1"), path + "after"), moment()));
});
test("un tercero no puede invitar ni ver consentimiento", async () => {
  await assertFails(setDoc(doc(db("outsider"), consentPath), invite()));
  await assertFails(getDoc(doc(db("outsider"), consentPath)));
});
