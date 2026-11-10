const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { isAuthTimeAfterRevocation } = require("./session-guard");
if (!getApps().length) initializeApp();
const allowedOrigins = [
  "https://cedanoconan-coder.github.io",
  "https://localhost",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost"
];
exports.revokeAllSessions = onRequest({region:"us-central1",cors:allowedOrigins,maxInstances:10,timeoutSeconds:30},async(req,res)=>{
  res.set("Cache-Control","no-store");
  if(req.method!=="POST"){res.status(405).json({error:"Método no permitido."});return;}
  const match=(req.get("authorization")||"").match(/^Bearer\s+(.+)$/i);
  if(!match){res.status(401).json({error:"Inicia sesión para continuar."});return;}
  try{
    const auth=getAuth(), decoded=await auth.verifyIdToken(match[1]);
    const ref=getFirestore().collection("sessionRevocations").doc(decoded.uid);
    const current=await ref.get();
    const previous=current.exists?Number(current.get("revokedAt")):null;
    if(!isAuthTimeAfterRevocation(decoded.auth_time,previous)){
      res.status(401).json({error:"Esta sesión ya fue revocada. Inicia sesión de nuevo."});return;
    }
    const revokedAt=Math.floor(Date.now()/1000);
    await ref.set({revokedAt,updatedAt:FieldValue.serverTimestamp()});
    await auth.revokeRefreshTokens(decoded.uid);
    res.status(200).json({ok:true,revokedAt});
  }catch(error){
    console.error("No se pudieron revocar las sesiones:",error?.code||error?.name||"unknown");
    res.status(401).json({error:"No se pudo validar la sesión o completar la revocación."});
  }
});
