import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";

let env;
const db = uid => env.authenticatedContext(uid).firestore();
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-klk",
    firestore: { rules: readFileSync("firestore.rules", "utf8") }
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

async function seed(path, data) {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), path), data);
  });
}
async function conversation() {
  await seed("conversations/alice__bob", {
    members: ["alice", "bob"], createdAt: Timestamp.now()
  });
}

test("QR requiere aprobación del destinatario antes de añadir contacto", async () => {
  await assertSucceeds(setDoc(doc(db("alice"), "qrContactRequests/alice_bob"), {
    from: "alice", to: "bob", status: "pending",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  }));
  await assertFails(setDoc(doc(db("alice"), "qrContacts/alice/members/bob"), {
    uid: "bob", addedAt: serverTimestamp()
  }));
  await assertFails(updateDoc(doc(db("alice"), "qrContactRequests/alice_bob"), {
    status: "approved", updatedAt: serverTimestamp()
  }));
  await assertSucceeds(updateDoc(doc(db("bob"), "qrContactRequests/alice_bob"), {
    status: "approved", updatedAt: serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(db("alice"), "qrContacts/alice/members/bob"), {
    uid: "bob", addedAt: serverTimestamp()
  }));
});

test("QR directo solo si el destinatario eligió modo directo", async () => {
  await assertSucceeds(setDoc(doc(db("bob"), "contactPrivacy/bob"), {
    mode: "approval", updatedAt: serverTimestamp()
  }));
  await assertFails(setDoc(doc(db("alice"), "qrContacts/alice/members/bob"), {
    uid: "bob", addedAt: serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(db("bob"), "contactPrivacy/bob"), {
    mode: "direct", updatedAt: serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(db("alice"), "qrContacts/alice/members/bob"), {
    uid: "bob", addedAt: serverTimestamp()
  }));
});

test("QR impide leer contactos ajenos y bloquea enlaces con usuarios bloqueados", async () => {
  await seed("contactPrivacy/bob", { mode: "direct", updatedAt: Timestamp.now() });
  await seed("userBlocks/bob/blocked/alice", { blockedUid: "alice", createdAt: Timestamp.now() });
  await assertFails(setDoc(doc(db("alice"), "qrContacts/alice/members/bob"), {
    uid: "bob", addedAt: serverTimestamp()
  }));
  await seed("qrContacts/bob/members/alice", { uid: "alice", addedAt: Timestamp.now() });
  await assertFails(getDoc(doc(db("charlie"), "qrContacts/bob/members/alice")));
});

test("llamadas solo para participantes y sin suplantar al llamante", async () => {
  await conversation();
  const call = {
    callerUid: "alice", calleeUid: "bob", conversationId: "alice__bob",
    mode: "audio", status: "ringing", offer: { type: "offer", sdp: "offer-sdp" },
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  };
  await assertFails(setDoc(doc(db("charlie"), "calls/fake"), call));
  await assertSucceeds(setDoc(doc(db("alice"), "calls/real"), call));
  await assertFails(getDoc(doc(db("charlie"), "calls/real")));
  await assertSucceeds(getDoc(doc(db("bob"), "calls/real")));
  await assertFails(updateDoc(doc(db("charlie"), "calls/real"), {
    status: "ended", updatedAt: serverTimestamp()
  }));
  await assertFails(updateDoc(doc(db("alice"), "calls/real"), {
    status: "active", answer: { type: "answer", sdp: "fake" },
    updatedAt: serverTimestamp()
  }));
  await assertSucceeds(updateDoc(doc(db("bob"), "calls/real"), {
    status: "active", answer: { type: "answer", sdp: "answer-sdp" },
    updatedAt: serverTimestamp()
  }));
});

test("candidatos ICE solo pueden ser escritos por el participante correspondiente", async () => {
  await conversation();
  await seed("calls/call", {
    callerUid: "alice", calleeUid: "bob", conversationId: "alice__bob",
    mode: "video", status: "ringing", offer: { type: "offer", sdp: "sdp" },
    createdAt: Timestamp.now(), updatedAt: Timestamp.now()
  });
  const candidate = { candidate: "candidate:1 1 udp 1 127.0.0.1 1234 typ host" };
  await assertSucceeds(setDoc(doc(db("alice"), "calls/call/callerCandidates/one"), candidate));
  await assertFails(setDoc(doc(db("bob"), "calls/call/callerCandidates/two"), candidate));
  await assertSucceeds(setDoc(doc(db("bob"), "calls/call/calleeCandidates/one"), candidate));
  await assertFails(setDoc(doc(db("charlie"), "calls/call/calleeCandidates/two"), candidate));
});

// Tests run only against the isolated Firestore emulator.
