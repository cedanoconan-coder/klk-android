"use strict";
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");
initializeApp();

// Only the backend may send notifications. Never trust client-supplied tokens or caller names.
exports.notifyIncomingCall = onDocumentCreated("calls/{callId}", async event => {
  const call = event.data?.data();
  const callId = event.params.callId;
  if (!call || call.status !== "ringing" || !call.calleeUid || !call.callerUid || call.calleeUid === call.callerUid) return;
  const db = getFirestore();
  const tokensSnap = await db.collection("users").doc(call.calleeUid).collection("pushTokens").get();
  const tokens = [...new Set(tokensSnap.docs.map(doc => doc.data().token).filter(token => typeof token === "string" && token.length > 30))];
  if (!tokens.length) { console.info("No registered push tokens for recipient", callId); return; }
  const profile = await db.collection("publicProfiles").doc(call.callerUid).get();
  const callerName = String(profile.data()?.displayName || "Un contacto").slice(0, 80);
  const latest = await event.data.ref.get();
  if (!latest.exists || latest.data().status !== "ringing") return;
  const message = {
    tokens,
    data: {type:"incoming_call",callId,mode:call.mode === "video" ? "video" : "audio",callerName},
    android: {priority:"high",ttl:45000},
    webpush: {headers:{Urgency:"high",TTL:"45"}}
  };
  const response = await getMessaging().sendEachForMulticast(message);
  console.info("Incoming call push result", {callId,success:response.successCount,failure:response.failureCount});
  await Promise.all(response.responses.map(async (result,index) => {
    if (result.success || !["messaging/registration-token-not-registered","messaging/invalid-registration-token"].includes(result.error?.code)) return;
    const invalid = tokens[index];
    await Promise.all(tokensSnap.docs.filter(doc => doc.data().token === invalid).map(doc => doc.ref.delete()));
  }));
});
