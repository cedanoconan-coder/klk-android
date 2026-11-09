/* klk: llamadas privadas WebRTC con señalización Firestore */
(function(){
 const $=id=>document.getElementById(id);
 const configuredTurn=Array.isArray(window.KLK_TURN_SERVERS)?window.KLK_TURN_SERVERS:[];
 const ICE_CONFIG={iceServers:[{urls:["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302"]},...configuredTurn]};
 let currentUid=null, incomingUnsub=null, activeCallUnsub=null, localStream=null, peer=null, callRef=null;
 let callPeople=new Map(), callDirectoryPeople=new Map(), callConversationPeople=new Map();
 let callPeopleUnsub=null, callConversationUnsub=null;
 let callRole=null, callMode="audio", callState=null, callStarting=false, remoteCandidatesUnsub=null, localCandidatesUnsub=null, queuedCandidates=[];
 let incomingCall=null, incomingDocUnsub=null, ringTimeout=null, muted=false, cameraOff=false, ending=false, pendingLocalCandidates=[];
 const overlay=$("callOverlay");
 const setStatus=(message)=>{if($("callsStatus"))$("callsStatus").textContent=message||"";};
 function isCallContactAccepted(uid){return callPeople.has(uid);}
 function acceptedPeople(){return [...callPeople.entries()].filter(([uid])=>uid!==currentUid&&isCallContactAccepted(uid));}
 function updateCallPeople(){
  callPeople=new Map(callConversationPeople);
  for(const [peerUid,profile] of callDirectoryPeople)callPeople.set(peerUid,profile);
  renderCallContacts();
 }
 function watchCallContacts(uid){
  if(callPeopleUnsub){callPeopleUnsub();callPeopleUnsub=null;}
  if(callConversationUnsub){callConversationUnsub();callConversationUnsub=null;}
  callPeopleUnsub=db.collection("publicProfiles").where("directoryVisible","==",true).onSnapshot(snapshot=>{
   callDirectoryPeople.clear();
   snapshot.docs.forEach(doc=>callDirectoryPeople.set(doc.id,doc.data()));
   updateCallPeople();
  },error=>{
   console.error("Directorio de llamadas:",error);
   $("callContacts").textContent="No se pudo cargar el directorio: "+error.message;
  });
  callConversationUnsub=db.collection("conversations").where("members","array-contains",uid).onSnapshot(snapshot=>{
   callConversationPeople.clear();
   snapshot.docs.forEach(doc=>{
    const peerUid=(doc.data().members||[]).find(member=>member!==uid);
    if(peerUid)callConversationPeople.set(peerUid,{displayName:"Contacto"});
   });
   updateCallPeople();
  },error=>{
   console.error("Conversaciones disponibles para llamadas:",error);
   setStatus("No se pudieron cargar los chats para llamadas: "+error.message);
  });
 }
 function formatCallTime(value){
  if(!value)return "Fecha no disponible";
  const date=value.toDate?value.toDate():new Date(value);
  return Number.isNaN(date.getTime())?"Fecha no disponible":date.toLocaleString("es-DO",{dateStyle:"medium",timeStyle:"short"});
 }
 function callDuration(data){
  const start=data.connectedAt&&(data.connectedAt.toDate?data.connectedAt.toDate():new Date(data.connectedAt));
  const end=data.endedAt&&(data.endedAt.toDate?data.endedAt.toDate():new Date(data.endedAt));
  if(!start||!end||Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))return "";
  const seconds=Math.max(0,Math.floor((end-start)/1000));
  return Math.floor(seconds/60)+" min "+(seconds%60)+" s";
 }
 function renderCallContacts(){
  const list=$("callContacts"); if(!list)return;
  list.innerHTML="";
  if(!auth||!auth.currentUser){list.textContent="Inicia sesión para consultar tu historial de llamadas.";return;}
  const entries=[...(window.klkCallHistory||new Map()).values()].sort((a,b)=>{
   const av=a.data.createdAt&&(a.data.createdAt.toMillis?a.data.createdAt.toMillis():new Date(a.data.createdAt).getTime())||0;
   const bv=b.data.createdAt&&(b.data.createdAt.toMillis?b.data.createdAt.toMillis():new Date(b.data.createdAt).getTime())||0;
   return bv-av;
  });
  if(!entries.length){const empty=document.createElement("p");empty.className="hint";empty.textContent="Todavía no tienes llamadas. Aquí aparecerán tus llamadas de voz y videollamadas.";list.append(empty);return;}
  entries.forEach(({id,data})=>{
   const outgoing=data.callerUid===currentUid;
   const otherUid=outgoing?data.calleeUid:data.callerUid;
   const person=callPeople.get(otherUid)||{};
   const name=person.displayName||person.email||"Contacto";
   const row=document.createElement("div");row.className="callContact callHistoryItem";
   const info=document.createElement("div");info.className="callContactInfo";
   const title=document.createElement("strong");title.textContent=(data.mode==="video"?"▣ Videollamada":"☎ Llamada de voz")+" · "+name;
   const status=document.createElement("small");
   const missed=!outgoing&&!data.connectedAt;
   const outcome=missed?"Perdida":outgoing&&!data.connectedAt?(data.status==="rejected"?"Rechazada":"Sin respuesta"):outgoing?"Realizada":"Recibida";
   status.textContent=outcome+" · "+formatCallTime(data.createdAt)+(callDuration(data)?" · "+callDuration(data):"");
   if(missed)status.classList.add("callMissed");
   info.append(title,status);row.append(info);
   const again=document.createElement("button");again.type="button";again.className="secondary";again.textContent="↗";again.title="Volver a llamar";again.setAttribute("aria-label","Volver a llamar a "+name);
   again.disabled=!isCallContactAccepted(otherUid);
   again.onclick=()=>startCall(otherUid,name,data.mode==="video"?"video":"audio");
   row.append(again);list.append(row);
  });
 }
 function watchCallHistory(uid){
  if(window.klkCallHistoryUnsubs)window.klkCallHistoryUnsubs.forEach(stop=>stop());
  const history=new Map();window.klkCallHistory=history;
  const render=()=>renderCallContacts();
  const handle=snapshot=>{snapshot.docs.forEach(doc=>history.set(doc.id,{id:doc.id,data:doc.data()}));render();};
  const a=db.collection("calls").where("callerUid","==",uid).onSnapshot(handle,error=>{console.error("Historial de llamadas realizadas:",error);setStatus("No se pudo cargar el historial: "+error.message);});
  const b=db.collection("calls").where("calleeUid","==",uid).onSnapshot(handle,error=>{console.error("Historial de llamadas recibidas:",error);setStatus("No se pudo cargar el historial: "+error.message);});
  window.klkCallHistoryUnsubs=[a,b];
 }
 function showOverlay(name,status){
  $("callPeerName").textContent=name||"Contacto";
  $("callStatus").textContent=status||"";
  overlay.classList.add("visible");
  $("answerCall").hidden=true;$("rejectCall").hidden=true;$("muteCall").hidden=true;$("cameraCall").hidden=true;$("endCall").hidden=true;
  $("callAvatar").style.display="grid";$("remoteVideo").style.display="none";$("localVideo").style.display="none";
  $("remoteAudio").srcObject=null;$("remoteVideo").srcObject=null;$("remoteVideo").muted=true;$("localVideo").srcObject=null;
 }
 function showActiveControls(){
  $("answerCall").hidden=true;$("rejectCall").hidden=true;$("endCall").hidden=false;$("muteCall").hidden=false;
  $("cameraCall").hidden=callMode!=="video";
  $("muteCall").textContent="Silenciar";$("muteCall").classList.remove("muted");
  $("callAvatar").style.display=callMode==="video"?"none":"grid";
  $("remoteVideo").style.display=callMode==="video"?"block":"none";
  $("localVideo").style.display=callMode==="video"?"block":"none";
 }
 function cleanup(){
  callStarting=false;
  if(window.klkStopIncomingCallSound)window.klkStopIncomingCallSound();
  if(activeCallUnsub){activeCallUnsub();activeCallUnsub=null;}
  if(incomingDocUnsub){incomingDocUnsub();incomingDocUnsub=null;}
  if(ringTimeout){window.clearTimeout(ringTimeout);ringTimeout=null;}
  if(remoteCandidatesUnsub){remoteCandidatesUnsub();remoteCandidatesUnsub=null;}
  if(localCandidatesUnsub){localCandidatesUnsub();localCandidatesUnsub=null;}
  if(peer){try{peer.ontrack=null;peer.onicecandidate=null;peer.close();}catch(e){}peer=null;}
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  $("remoteVideo").srcObject=null;$("localVideo").srcObject=null;$("remoteAudio").srcObject=null;
  callRef=null;callRole=null;callState=null;incomingCall=null;queuedCandidates=[];pendingLocalCandidates=[];muted=false;cameraOff=false;ending=false;
  overlay.classList.remove("visible");
 }
 async function getLocalMedia(mode){
  if(!window.isSecureContext)throw new Error("Las llamadas requieren una conexión segura HTTPS. Abre klk desde su enlace oficial.");
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.RTCPeerConnection)throw new Error("Este navegador no admite llamadas WebRTC. Actualiza Chrome y vuelve a intentarlo.");
  return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:mode==="video"?{facingMode:"user",width:{ideal:640},height:{ideal:480}}:false});
 }
 function createPeer(){
  peer=new RTCPeerConnection(ICE_CONFIG);
  localStream.getTracks().forEach(track=>peer.addTrack(track,localStream));
  peer.ontrack=event=>{
   const stream=event.streams&&event.streams[0];
   if(stream){$("remoteVideo").srcObject=stream;$("remoteAudio").srcObject=stream;}
   $("callStatus").textContent=callMode==="video"?"Videollamada conectada":"Llamada conectada";
  };
  peer.onconnectionstatechange=()=>{
   if(!peer)return;
   if(peer.connectionState==="connected")$("callStatus").textContent=callMode==="video"?"Videollamada conectada":"Llamada conectada";
   if(peer.connectionState==="failed")$("callStatus").textContent="No se pudo establecer la conexión. Comprueba la red e inténtalo de nuevo.";
   if(peer.connectionState==="disconnected")$("callStatus").textContent="Conexión interrumpida. Intentando recuperar...";
  };
  peer.onicecandidate=async event=>{
   if(!event.candidate||!callRole)return;
   if(!callRef){pendingLocalCandidates.push(event.candidate.toJSON());return;}
   try{await callRef.collection(callRole==="caller"?"callerCandidates":"calleeCandidates").add(event.candidate.toJSON());}
   catch(error){console.error("No se pudo enviar candidato ICE:",error);$("callStatus").textContent="Error de conexión. No se pudo intercambiar la señal de red.";}
  };
  return peer;
 }
 async function addRemoteCandidate(data){
  if(!peer||!data||!data.candidate)return;
  const candidate=new RTCIceCandidate(data);
  if(!peer.remoteDescription)queuedCandidates.push(candidate);
  else try{await peer.addIceCandidate(candidate);}catch(error){console.warn("Candidato ICE descartado:",error);}
 }
 async function flushCandidates(){
  if(!peer||!peer.remoteDescription)return;
  const pending=queuedCandidates.splice(0);
  for(const c of pending)try{await peer.addIceCandidate(c);}catch(error){console.warn(error);}
 }
 async function flushLocalCandidates(){
  if(!callRef||!callRole)return;
  const pending=pendingLocalCandidates.splice(0);
  for(const candidate of pending)try{await callRef.collection(callRole==="caller"?"callerCandidates":"calleeCandidates").add(candidate);}catch(error){console.warn("No se pudo enviar candidato ICE pendiente:",error);}
 }
 function watchRemoteCandidates(){
  const collection=callRef.collection(callRole==="caller"?"calleeCandidates":"callerCandidates");
  remoteCandidatesUnsub=collection.onSnapshot(snapshot=>snapshot.docChanges().filter(c=>c.type==="added").forEach(c=>addRemoteCandidate(c.doc.data())),error=>{$("callStatus").textContent="Error recibiendo señal de llamada: "+error.message;});
 }
 function watchCallDocument(){
  activeCallUnsub=callRef.onSnapshot(async snap=>{
   if(!snap.exists){cleanup();return;}
   const data=snap.data();callState=data.status;
   if(data.status==="active"&&ringTimeout){window.clearTimeout(ringTimeout);ringTimeout=null;}
   if(data.status==="rejected"){ $("callStatus").textContent="La otra persona rechazó la llamada.";setTimeoutSafeCleanup();return; }
   if(data.status==="ended"){ $("callStatus").textContent="La llamada finalizó.";setTimeoutSafeCleanup();return; }
   if(callRole==="caller"&&data.answer&&peer&&!peer.remoteDescription){
    try{await peer.setRemoteDescription(new RTCSessionDescription(data.answer));await flushCandidates();showActiveControls();$("callStatus").textContent="Conectando llamada...";}
    catch(error){$("callStatus").textContent="No se pudo conectar la llamada: "+error.message;}
   }
  },error=>{$("callStatus").textContent="Se perdió la señal de la llamada: "+error.message;});
 }
 function setTimeoutSafeCleanup(){window.setTimeout(cleanup,1600);}
 async function startCall(uid,name,mode){
  if(callRef||callStarting){setStatus("Ya tienes una llamada en curso o preparándose.");return;}
  if(!auth||!auth.currentUser||!isCallContactAccepted(uid)){setStatus("Solo puedes llamar a miembros visibles en el directorio de klk.");return;}
  callStarting=true;
  try{
   callMode=mode;callRole="caller";showOverlay(name,mode==="video"?"Solicitando cámara y micrófono...":"Solicitando micrófono...");
   localStream=await getLocalMedia(mode);createPeer();
   if(mode==="video"){$("localVideo").srcObject=localStream;}
   const offer=await peer.createOffer();await peer.setLocalDescription(offer);
   const members=[currentUid,uid].sort();
   const conversationId=members.join("__");
   const conversationRef=db.collection("conversations").doc(conversationId);
   const conversationSnap=await conversationRef.get();
   if(!conversationSnap.exists)await conversationRef.set({members,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
   callRef=db.collection("calls").doc();
   await callRef.set({callerUid:currentUid,calleeUid:uid,conversationId,mode,status:"ringing",offer:{type:offer.type,sdp:offer.sdp},createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
   await flushLocalCandidates();
   $("callStatus").textContent="Llamando a "+name+"...";
   $("endCall").hidden=false;watchCallDocument();watchRemoteCandidates();
   ringTimeout=window.setTimeout(()=>{if(callRef&&callRole==="caller"&&(callState==="ringing"||!callState)){ $("callStatus").textContent="No hubo respuesta.";endCall();}},45000);
  }catch(error){console.error("No se pudo iniciar la llamada:",error);$("callStatus").textContent=permissionMessage(error);setTimeoutSafeCleanup();}
  finally{callStarting=false;}
 }
 function permissionMessage(error){
  if(error&&error.name==="NotAllowedError")return "Permite el acceso al micrófono"+(callMode==="video"?" y a la cámara":"")+" en los permisos de klk/Chrome.";
  if(error&&error.name==="NotFoundError")return "No se encontró "+(callMode==="video"?"una cámara o micrófono":"un micrófono")+" disponible.";
  if(error&&error.name==="NotReadableError")return "La cámara o el micrófono están siendo utilizados por otra aplicación.";
  return error&&error.message?error.message:"No se pudo iniciar la llamada.";
 }
 async function acceptCall(){
  if(!incomingCall||callRef||callStarting)return;
  callStarting=true;
  if(window.klkStopIncomingCallSound)window.klkStopIncomingCallSound();
  if(incomingDocUnsub){incomingDocUnsub();incomingDocUnsub=null;}
  if(ringTimeout){window.clearTimeout(ringTimeout);ringTimeout=null;}
  const data=incomingCall.data;callRef=incomingCall.ref;callRole="callee";callMode=data.mode==="video"?"video":"audio";
  try{
   $("callStatus").textContent=callMode==="video"?"Activando cámara y micrófono...":"Activando micrófono...";
   localStream=await getLocalMedia(callMode);createPeer();
   if(callMode==="video")$("localVideo").srcObject=localStream;
   await peer.setRemoteDescription(new RTCSessionDescription(data.offer));await flushCandidates();
   const answer=await peer.createAnswer();await peer.setLocalDescription(answer);
   await callRef.update({answer:{type:answer.type,sdp:answer.sdp},status:"active",connectedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
   showActiveControls();$("callStatus").textContent="Conectando...";
   watchCallDocument();watchRemoteCandidates();
  }catch(error){console.error("No se pudo responder:",error);$("callStatus").textContent=permissionMessage(error);try{await callRef.update({status:"ended",updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}catch(e){}setTimeoutSafeCleanup();}
  finally{callStarting=false;}
 }
 async function rejectCall(){
  if(!incomingCall)return;
  if(window.klkStopIncomingCallSound)window.klkStopIncomingCallSound();
  try{await incomingCall.ref.update({status:"rejected",updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}catch(error){console.warn(error);}
  cleanup();
 }
 async function endCall(){
  if(ending)return;ending=true;
  const ref=callRef;
  try{if(ref)await ref.update({status:"ended",endedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}
  catch(error){console.warn("No se pudo actualizar el estado de la llamada:",error);}
  cleanup();
 }
 function listenIncoming(uid){
  if(incomingUnsub)incomingUnsub();
  incomingUnsub=db.collection("calls").where("calleeUid","==",uid).onSnapshot(snapshot=>{
   const doc=snapshot.docs.find(d=>d.data().status==="ringing"&&!callRef&&!incomingCall);
   if(!doc)return;
   const data=doc.data();incomingCall={ref:doc.ref,data};
   incomingDocUnsub=doc.ref.onSnapshot(s=>{if(!s.exists||s.data().status!=="ringing"){if(incomingCall&&incomingCall.ref.id===doc.id){incomingCall=null;cleanup();}}},error=>{console.warn("No se pudo seguir la llamada entrante:",error);});
   ringTimeout=window.setTimeout(async()=>{if(incomingCall&&incomingCall.ref.id===doc.id&&!callRef){try{await doc.ref.update({status:"ended",updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}catch(error){console.warn("No se pudo cerrar la llamada sin respuesta:",error);}incomingCall=null;cleanup();}},45000);
   callMode=data.mode==="video"?"video":"audio";
   const person=callPeople.get(data.callerUid)||{};
   showOverlay(person.displayName||person.email||"Llamada entrante",callMode==="video"?"Videollamada entrante":"Llamada de voz entrante");
   if(window.klkStartIncomingCallSound)window.klkStartIncomingCallSound();
   $("answerCall").hidden=false;$("rejectCall").hidden=false;
   $("answerCall").textContent="Responder";$("rejectCall").textContent="Rechazar";
   if(navigator.vibrate)navigator.vibrate([250,120,250]);
  },error=>setStatus("No se pudieron recibir llamadas: "+error.message));
 }
 $("answerCall").addEventListener("click",acceptCall);
 $("rejectCall").addEventListener("click",rejectCall);
 $("endCall").addEventListener("click",endCall);
 $("muteCall").addEventListener("click",()=>{
  if(!localStream)return;muted=!muted;localStream.getAudioTracks().forEach(t=>t.enabled=!muted);
  $("muteCall").textContent=muted?"Activar micrófono":"Silenciar";$("muteCall").classList.toggle("muted",muted);
 });
 $("cameraCall").addEventListener("click",()=>{
  if(!localStream)return;cameraOff=!cameraOff;localStream.getVideoTracks().forEach(t=>t.enabled=!cameraOff);
  $("cameraCall").textContent=cameraOff?"Activar cámara":"Apagar cámara";
 });
 document.querySelectorAll('.homeBottom button').forEach(button=>{
  if(button.dataset.tab!=="calls"){button.addEventListener("click",()=>{if($("callsPanel"))$("callsPanel").style.display="none";});return;}
  button.addEventListener("click",()=>{
   $("chatsPanel").style.display="none";$("requestsPanel").style.display="none";$("peopleList").style.display="none";
   $("callsPanel").style.display="block";$("homeGroup").style.display="none";renderCallContacts();setStatus("");
  });
 });
 document.querySelectorAll('.homeFilters button').forEach(button=>button.addEventListener("click",()=>{
  if($("callsPanel"))$("callsPanel").style.display="none";
 }));
 if(auth)auth.onAuthStateChanged(user=>{
  currentUid=user?user.uid:null;
  if(incomingUnsub){incomingUnsub();incomingUnsub=null;}
  if(!user){if(callRef)endCall();cleanup();if(window.klkCallHistoryUnsubs){window.klkCallHistoryUnsubs.forEach(stop=>stop());window.klkCallHistoryUnsubs=[];}callPeople.clear();callDirectoryPeople.clear();callConversationPeople.clear();[callPeopleUnsub,callConversationUnsub].forEach(stop=>{if(stop)stop();});callPeopleUnsub=callConversationUnsub=null;renderCallContacts();return;}
  listenIncoming(user.uid);watchCallContacts(user.uid);watchCallHistory(user.uid);renderCallContacts();
 });

 window.klkStartCall=startCall;
 async function runCallDiagnostics(){
  const output=$("callDiagnosticsStatus");if(!output)return;
  const checks=[];
  const add=(label,ok,detail)=>checks.push((ok?"✓ ":"⚠ ")+label+": "+detail);
  add("Conexión segura",!!window.isSecureContext,window.isSecureContext?"HTTPS activo":"Abre klk desde su enlace HTTPS");
  add("Sesión",!!(auth&&auth.currentUser),auth&&auth.currentUser?"Sesión iniciada":"Inicia sesión primero");
  add("Micrófono",!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia),"getUserMedia "+(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia?"disponible":"no disponible"));
  add("WebRTC",!!window.RTCPeerConnection,window.RTCPeerConnection?"RTCPeerConnection disponible":"Navegador sin soporte WebRTC");
  let devices=[];
  try{if(navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices)devices=await navigator.mediaDevices.enumerateDevices();}
  catch(error){add("Dispositivos",false,error.message);}
  if(devices.length){add("Micrófono detectado",devices.some(d=>d.kind==="audioinput"),devices.filter(d=>d.kind==="audioinput").length+" entrada(s)");add("Cámara detectada",devices.some(d=>d.kind==="videoinput"),devices.filter(d=>d.kind==="videoinput").length+" cámara(s)");}
  if(navigator.permissions&&navigator.permissions.query){
   for(const [name,label] of [["microphone","Permiso de micrófono"],["camera","Permiso de cámara"]]){
    try{const p=await navigator.permissions.query({name});add(label,p.state!=="denied",p.state);}catch(error){add(label,true,"el navegador no permite consultar este permiso");}
   }
  }
  add("STUN",true,"servidores públicos configurados");
  add("TURN",configuredTurn.length>0,configuredTurn.length?"servidor TURN configurado":"no configurado; algunas redes pueden impedir la conexión");
  output.textContent=checks.join("\n");
  output.style.whiteSpace="pre-line";
  setStatus("Diagnóstico terminado. Las llamadas todavía deben probarse entre dos teléfonos.");
 }
 $("callDiagnostics")?.addEventListener("click",runCallDiagnostics);

 // La pantalla de llamadas mantiene sus propias suscripciones a Firestore.
 window.klkRefreshCallContacts=renderCallContacts;
})();
