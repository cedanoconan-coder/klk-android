/* klk: llamadas privadas WebRTC con señalización Firestore */
(function(){
 const $=id=>document.getElementById(id);
 const configuredTurn=Array.isArray(window.KLK_TURN_SERVERS)?window.KLK_TURN_SERVERS:[];
 const ICE_CONFIG={iceServers:[{urls:["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302"]},...configuredTurn]};
 let currentUid=null, incomingUnsub=null, activeCallUnsub=null, localStream=null, peer=null, callRef=null;
 let callPeople=new Map(), callDirectoryPeople=new Map(), callConversationPeople=new Map();
 let callPeopleUnsub=null, callConversationUnsub=null;
 let callRole=null, callMode="audio", callState=null, callStarting=false, remoteCandidatesUnsub=null, localCandidatesUnsub=null, queuedCandidates=[];
 let incomingCall=null, incomingDocUnsub=null, ringTimeout=null, muted=false, cameraOff=false, cameraFacingMode="user", ending=false, pendingLocalCandidates=[];
 const overlay=$("callOverlay");

 // Gestos KLK: reactions travel privately over the existing WebRTC connection.
 let klkReactionChannel=null;
 const klkReactionChoices=["👍","❤️","😂","👏","🎉"];
 const klkReactionBar=document.createElement("div");
 klkReactionBar.id="klkReactionBar";
 klkReactionBar.setAttribute("aria-label","Reacciones de videollamada");
 klkReactionBar.style.cssText="display:none;gap:8px;justify-content:center;flex-wrap:wrap;padding:8px;z-index:20";
 const klkReactionLayer=document.createElement("div");
 klkReactionLayer.style.cssText="position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:15";
 const klkReactionStyle=document.createElement("style");
 klkReactionStyle.textContent="@keyframes klkReactionFloat{from{transform:translateY(0) scale(.8);opacity:1}to{transform:translateY(-180px) scale(1.3);opacity:0}} #klkReactionBar button{width:44px;min-width:44px;height:44px;min-height:44px;border:1px solid #ffffff66;border-radius:50%;background:#ffffff25;font-size:24px;padding:0;touch-action:manipulation}";
 document.head.append(klkReactionStyle);
 $("callVideoStage")?.append(klkReactionLayer);
 $("callControls")?.parentNode?.insertBefore(klkReactionBar,$("callControls"));
 function klkShowReaction(emoji,remote=false){
  if(!klkReactionChoices.includes(emoji)||callMode!=="video"||!overlay.classList.contains("visible"))return;
  const el=document.createElement("span");el.textContent=emoji;el.setAttribute("aria-label",remote?"Reacción recibida":"Reacción enviada");
  el.style.cssText="position:absolute;bottom:18%;left:"+(remote?65:25)+"%;font-size:44px;animation:klkReactionFloat 1.8s ease-out forwards";
  klkReactionLayer.append(el);setTimeout(()=>el.remove(),1900);
 }
 function klkAttachReactionChannel(channel){
  klkReactionChannel=channel;
  channel.onmessage=event=>{try{const data=JSON.parse(event.data);if(data?.type==="klk-reaction"&&klkReactionChoices.includes(data.emoji))klkShowReaction(data.emoji,true)}catch(e){}};
  channel.onclose=()=>{if(klkReactionChannel===channel)klkReactionChannel=null};
 }
 for(const emoji of klkReactionChoices){
  const button=document.createElement("button");button.type="button";button.textContent=emoji;button.setAttribute("aria-label","Enviar reacción "+emoji);
  button.addEventListener("click",()=>{if(klkReactionChannel?.readyState!=="open")return;klkShowReaction(emoji);klkReactionChannel.send(JSON.stringify({type:"klk-reaction",emoji}))});
  klkReactionBar.append(button);
 }
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
  callPeopleUnsub=window.db.collection("publicProfiles").where("directoryVisible","==",true).onSnapshot(snapshot=>{
   callDirectoryPeople.clear();
   snapshot.docs.forEach(doc=>callDirectoryPeople.set(doc.id,doc.data()));
   updateCallPeople();
  },error=>{
   console.error("Directorio de llamadas:",error);
   $("callContacts").textContent="No se pudo cargar el directorio: "+error.message;
  });
  callConversationUnsub=window.db.collection("conversations").where("members","array-contains",uid).onSnapshot(snapshot=>{
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
  if(!window.auth||!window.auth.currentUser){list.textContent="Inicia sesión para consultar tu historial de llamadas.";return;}
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
   const avatar=document.createElement("div");avatar.className="klkCallAvatar";
   const avatarUrl=person.photoURL||person.photoUrl||person.avatarUrl||person.profilePhotoURL||person.profilePhoto||"";
   if(avatarUrl&&(avatarUrl.startsWith("https://")||avatarUrl.startsWith("http://"))){const photo=document.createElement("img");photo.src=avatarUrl;photo.alt="";photo.onerror=()=>{photo.remove();avatar.textContent=(name||"?").slice(0,1).toUpperCase();};avatar.append(photo);}
   else if(person.photoPath&&typeof window.klkResolveProfilePhoto==="function"){
    avatar.textContent=(name||"?").slice(0,1).toUpperCase();
    const path=person.photoPath;
    window.klkResolveProfilePhoto(path).then(url=>{
     if(!url||!avatar.isConnected)return;
     const photo=document.createElement("img");photo.src=url;photo.alt="Foto de "+name;
     photo.onerror=()=>photo.remove();avatar.replaceChildren(photo);
    }).catch(error=>console.warn("No se pudo cargar la foto del contacto en llamadas",error));
   }
   else avatar.textContent=(name||"?").slice(0,1).toUpperCase();
   const info=document.createElement("div");info.className="callContactInfo";
   const title=document.createElement("strong");title.textContent=name;
   const status=document.createElement("small");
   const missed=!outgoing&&!data.connectedAt;
   const outcome=missed?"Perdida":outgoing&&!data.connectedAt?(data.status==="rejected"?"Rechazada":"Sin respuesta"):outgoing?"Realizada":"Recibida";
   const arrow=document.createElement("span");arrow.className="klkCallArrow"+(missed?" missed":"");arrow.textContent=outgoing?"↗":"↙";
   const time=document.createElement("span");time.textContent=formatCallTime(data.createdAt)+(callDuration(data)?" · "+callDuration(data):"");
   status.append(arrow,time);
   if(missed){status.classList.add("callMissed");title.classList.add("callMissedName");}
   info.append(title,status);row.append(avatar,info);
   const again=document.createElement("button");again.type="button";again.className="klkCallAgain";
   const video=data.mode==="video";
   again.innerHTML=video?'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="14" height="14" rx="2"/><path d="m16.5 10 5-3v10l-5-3z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5 10 7.2 8.2 10c1.2 2.4 3.3 4.5 5.7 5.7l2.8-1.8 3.7 3.4-2.1 3.3c-.5.8-1.5 1.1-2.4.8C9.5 20.2 3.8 14.5 2.6 7.4c-.2-.9 0-1.8.8-2.3z"/></svg>';
   again.title=video?"Volver a hacer videollamada":"Volver a llamar";
   again.setAttribute("aria-label",again.title+" a "+name);
   again.disabled=!isCallContactAccepted(otherUid);
   again.onclick=()=>startCall(otherUid,name,video?"video":"audio");
   row.append(again);list.append(row);
  });
 }
 function watchCallHistory(uid){
  if(window.klkCallHistoryUnsubs)window.klkCallHistoryUnsubs.forEach(stop=>stop());
  const history=new Map();window.klkCallHistory=history;
  const render=()=>renderCallContacts();
  const handle=snapshot=>{snapshot.docs.forEach(doc=>history.set(doc.id,{id:doc.id,data:doc.data()}));render();};
  const a=window.db.collection("calls").where("callerUid","==",uid).onSnapshot(handle,error=>{console.error("Historial de llamadas realizadas:",error);setStatus("No se pudo cargar el historial: "+error.message);});
  const b=window.db.collection("calls").where("calleeUid","==",uid).onSnapshot(handle,error=>{console.error("Historial de llamadas recibidas:",error);setStatus("No se pudo cargar el historial: "+error.message);});
  window.klkCallHistoryUnsubs=[a,b];
 }
 let klkPeerUid=null;
 async function klkCallAvatar(uid){const node=$("callAvatar");if(!node)return;node.textContent="☎️";const person=callPeople.get(uid)||{};let url=person.photoURL||person.photoUrl||person.avatarUrl||person.profilePhotoURL||person.profilePhoto||"";if(person.photoPath&&typeof window.klkResolveProfilePhoto==="function"){try{url=await window.klkResolveProfilePhoto(person.photoPath)||url}catch(e){console.warn("Foto de llamada:",e)}}if(uid!==klkPeerUid||!overlay.classList.contains("visible"))return;if(typeof url==="string"&&/^https?:\/\//i.test(url)){const img=document.createElement("img");img.src=url;img.alt="Foto del contacto";img.style.cssText="width:100%;height:100%;object-fit:cover;border-radius:50%";img.onerror=()=>{img.remove();node.textContent="☎️"};node.replaceChildren(img)}}
 // Local preview only: WebRTC sends the original, unmirrored video track.
 let klkMirrorPreview=true;
 const klkMirrorButton=document.createElement("button");
 klkMirrorButton.type="button";
 klkMirrorButton.id="klkMirrorPreview";
 klkMirrorButton.className="klkMirrorPreviewButton";
 klkMirrorButton.hidden=true;
 klkMirrorButton.setAttribute("aria-label","Activar efecto espejo");
 const klkMirrorStyle=document.createElement("style");
 klkMirrorStyle.textContent="#callOverlay .klkMirrorPreviewButton{position:absolute;top:calc(72px + env(safe-area-inset-top));right:16px;z-index:25;border:1px solid #ffffff55;border-radius:20px;background:#39235fcf;color:white;padding:9px 13px;font:600 13px system-ui;box-shadow:0 3px 12px #0004}#callOverlay .klkMirrorPreviewButton[hidden]{display:none!important}#callOverlay #localVideo.klkPreviewMirrored{transform:scaleX(-1)!important}";
 document.head.appendChild(klkMirrorStyle);
 // No mirror selector is mounted in the call interface.
 function klkUpdateMirrorPreview(){
  const video=$("localVideo");
  if(video)video.classList.toggle("klkPreviewMirrored",klkMirrorPreview&&cameraFacingMode==="user");
  klkMirrorButton.hidden=true; // Kept detached from DOM.
  klkMirrorButton.textContent=klkMirrorPreview?"Espejo: sí":"Espejo: no";
  klkMirrorButton.setAttribute("aria-label",klkMirrorPreview?"Desactivar efecto espejo":"Activar efecto espejo");
  klkMirrorButton.setAttribute("aria-pressed",String(klkMirrorPreview));
 }
 klkMirrorButton.addEventListener("click",()=>{klkMirrorPreview=!klkMirrorPreview;klkUpdateMirrorPreview()});
 function klkResetVideoLayout(){const stage=$("callVideoStage");if(stage)stage.classList.remove("klkCallSwapped")}
 let klkRingContext=null,klkRingInterval=null;
 function klkStopOutgoingRing(){if(klkRingInterval){clearInterval(klkRingInterval);klkRingInterval=null}if(klkRingContext){klkRingContext.close().catch(()=>{});klkRingContext=null}}
 function klkStartOutgoingRing(){klkStopOutgoingRing();try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;klkRingContext=new AudioCtx();const play=()=>{if(!klkRingContext||klkRingContext.state!=="running")return;const t=klkRingContext.currentTime;for(const offset of [0,.28]){const osc=klkRingContext.createOscillator(),gain=klkRingContext.createGain();osc.type="sine";osc.frequency.value=440;gain.gain.setValueAtTime(0,t+offset);gain.gain.linearRampToValueAtTime(.055,t+offset+.025);gain.gain.setValueAtTime(.055,t+offset+.18);gain.gain.linearRampToValueAtTime(0,t+offset+.24);osc.connect(gain);gain.connect(klkRingContext.destination);osc.start(t+offset);osc.stop(t+offset+.25)}};klkRingContext.resume().then(play).catch(()=>{});klkRingInterval=setInterval(play,3000)}catch(e){console.warn("Tono de llamada saliente no disponible",e)}}
 function klkSetIncomingSwipe(visible){
  const panel=$("klkIncomingSwipe"),handle=$("klkSwipeHandle");
  if(panel)panel.hidden=!visible;
  overlay.classList.toggle("klkIncoming",!!visible);
  if(handle){handle.style.transition="transform .22s cubic-bezier(.2,.8,.2,1)";handle.style.transform="translate3d(0,0,0)";handle.removeAttribute("aria-valuenow");}
 }
 // Keep the incoming-call gesture above the fullscreen video stage and controls.
 const klkSwipeFixStyle=document.createElement("style");
 klkSwipeFixStyle.textContent="#callOverlay.visible.klkIncoming #klkIncomingSwipe{display:flex!important;position:absolute!important;left:0!important;right:0!important;bottom:calc(100px + env(safe-area-inset-bottom))!important;z-index:20!important;pointer-events:auto!important;touch-action:none!important;margin:0!important;order:unset!important;justify-content:center!important}#callOverlay.visible.klkIncoming .klkSwipeTrack{pointer-events:auto!important;touch-action:none!important}#callOverlay.visible.klkIncoming #klkSwipeHandle{position:relative!important;z-index:22!important;pointer-events:auto!important;touch-action:none!important;user-select:none!important}#callOverlay.visible.klkIncoming #callVideoStage{pointer-events:none!important}#callOverlay.visible.klkIncoming #callControls{z-index:19!important}";
 document.head.appendChild(klkSwipeFixStyle);
 function klkInitIncomingSwipe(){
  const handle=$("klkSwipeHandle"),track=handle&&handle.closest(".klkSwipeTrack");
  if(!handle||!track)return;
  let startY=0,startX=0,active=false,completed=false,pointerId=null,lastY=0;
  const distance=()=>Math.max(80,Math.min(160,track.getBoundingClientRect().height-70));
  const reset=()=>{active=false;pointerId=null;handle.style.transition="transform .25s cubic-bezier(.2,.8,.2,1)";handle.style.transform="translate3d(0,0,0)";handle.setAttribute("aria-valuenow","0");};
  const finish=()=>{if(completed||!overlay.classList.contains("klkIncoming")||!incomingCall)return;completed=true;active=false;handle.style.transition="transform .16s ease-out";handle.style.transform="translate3d(0,"+(-distance())+"px,0)";if(navigator.vibrate)try{navigator.vibrate(35)}catch(_){};const answer=$("answerCall");if(answer&&!answer.disabled)answer.click();};
  handle.setAttribute("aria-valuemin","0");handle.setAttribute("aria-valuemax","100");handle.setAttribute("aria-valuenow","0");
  handle.addEventListener("pointerdown",event=>{if(!overlay.classList.contains("klkIncoming")||completed)return;if(event.button!==undefined&&event.button!==0)return;active=true;pointerId=event.pointerId;startY=event.clientY;startX=event.clientX;lastY=startY;handle.style.transition="none";try{handle.setPointerCapture(pointerId)}catch(_){}event.preventDefault()});
  handle.addEventListener("pointermove",event=>{if(!active||event.pointerId!==pointerId)return;lastY=event.clientY;const dy=Math.max(-distance(),Math.min(0,lastY-startY));handle.style.transform="translate3d(0,"+dy+"px,0)";handle.setAttribute("aria-valuenow",String(Math.round(-dy/distance()*100)));event.preventDefault()});
  handle.addEventListener("pointerup",event=>{if(!active||event.pointerId!==pointerId)return;const dy=event.clientY-startY,dx=event.clientX-startX;active=false;if(dy<=-distance()*.55&&Math.abs(dx)<Math.max(110,distance()))finish();else reset();event.preventDefault()});
  handle.addEventListener("pointercancel",reset);
  handle.addEventListener("lostpointercapture",()=>{if(active)reset()});
  handle.addEventListener("keydown",event=>{if((event.key==="Enter"||event.key===" "||event.key==="ArrowUp")&&overlay.classList.contains("klkIncoming")){event.preventDefault();finish()}});
  const observer=new MutationObserver(()=>{if(!overlay.classList.contains("klkIncoming")){completed=false;reset()}});
  observer.observe(overlay,{attributes:true,attributeFilter:["class"]});
 }
 function showOverlay(name,status){
  klkReactionBar.style.display="none";
  klkSetIncomingSwipe(false);$("callPeerName").textContent=name||"Contacto";klkResetVideoLayout();klkCallAvatar(klkPeerUid);
  // Keep the hang-up control available while browser permissions are pending.
  $("callStatus").textContent=status||"";
  overlay.classList.add("visible");klkUpdateMirrorPreview();
  $("answerCall").hidden=true;$("rejectCall").hidden=true;$("muteCall").hidden=true;$("cameraCall").hidden=true;$("switchCameraCall").hidden=true;$("endCall").hidden=false;
  $("callAvatar").style.display="grid";$("remoteVideo").style.display="none";$("localVideo").style.display="none";
  $("remoteAudio").srcObject=null;$("remoteVideo").srcObject=null;$("remoteVideo").muted=true;$("localVideo").srcObject=null;
 }
 function showActiveControls(){
  klkReactionBar.style.display=callMode==="video"?"flex":"none";
  klkSetIncomingSwipe(false);
  $("answerCall").hidden=true;$("rejectCall").hidden=true;$("endCall").hidden=false;$("muteCall").hidden=false;
  $("cameraCall").hidden=callMode!=="video";$("switchCameraCall").hidden=callMode!=="video";
  $("cameraCall").textContent="Apagar cámara";
  $("muteCall").textContent="Silenciar";$("muteCall").classList.remove("muted");
  $("callAvatar").style.display=callMode==="video"?"none":"grid";
  $("remoteVideo").style.display=callMode==="video"?"block":"none";
  $("localVideo").style.display=callMode==="video"?"block":"none";klkUpdateMirrorPreview();
 }
 function cleanup(){
  klkReactionBar.style.display="none";klkReactionLayer.replaceChildren();klkReactionChannel=null;
  klkSetIncomingSwipe(false);klkStopOutgoingRing();klkPeerUid=null;klkResetVideoLayout();callStarting=false;
  if(window.klkStopIncomingCallSound)window.klkStopIncomingCallSound();
  if(activeCallUnsub){activeCallUnsub();activeCallUnsub=null;}
  if(incomingDocUnsub){incomingDocUnsub();incomingDocUnsub=null;}
  if(ringTimeout){window.clearTimeout(ringTimeout);ringTimeout=null;}
  if(remoteCandidatesUnsub){remoteCandidatesUnsub();remoteCandidatesUnsub=null;}
  if(localCandidatesUnsub){localCandidatesUnsub();localCandidatesUnsub=null;}
  if(peer){try{peer.ontrack=null;peer.onicecandidate=null;peer.close();}catch(e){}peer=null;}
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  $("remoteVideo").srcObject=null;$("localVideo").srcObject=null;$("remoteAudio").srcObject=null;
  callRef=null;callRole=null;callState=null;incomingCall=null;queuedCandidates=[];pendingLocalCandidates=[];muted=false;cameraOff=false;cameraFacingMode="user";ending=false;
  overlay.classList.remove("visible");klkMirrorPreview=false;klkUpdateMirrorPreview();
 }
 function klkCallVideoConstraints(facing){return {facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720},frameRate:{ideal:24,max:30},resizeMode:"crop-and-scale"};}
 async function klkTuneCallVideo(track){if(!track)return;try{const caps=typeof track.getCapabilities==="function"?track.getCapabilities():{};const extras={};if(caps.frameRate&&caps.frameRate.max>=24)extras.frameRate={ideal:24,max:30};if(caps.width&&caps.width.max>=640)extras.width={ideal:Math.min(1280,caps.width.max)};if(caps.height&&caps.height.max>=480)extras.height={ideal:Math.min(720,caps.height.max)};if(Object.keys(extras).length)await track.applyConstraints(extras)}catch(e){console.warn("Ajustes opcionales de cámara no disponibles",e)}}
 async function klkTuneCallSender(sender){if(!sender||!sender.getParameters||!sender.setParameters)return;try{const params=sender.getParameters();if(!params.encodings||!params.encodings.length)return;params.degradationPreference="maintain-framerate";params.encodings.forEach(encoding=>{encoding.maxBitrate=1200000;encoding.maxFramerate=24});await sender.setParameters(params)}catch(e){console.warn("Ajustes WebRTC no disponibles",e)}}
 async function getLocalMedia(mode){
  if(!window.isSecureContext)throw new Error("Las llamadas requieren una conexión segura HTTPS. Abre klk desde su enlace oficial.");
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.RTCPeerConnection)throw new Error("Este navegador no admite llamadas WebRTC. Actualiza Chrome y vuelve a intentarlo.");
  cameraFacingMode="user";
   return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:mode==="video"?{facingMode:{ideal:cameraFacingMode},...klkCallVideoConstraints(cameraFacingMode)}:false});
 }
 function createPeer(){
  peer=new RTCPeerConnection(ICE_CONFIG);
  peer.ondatachannel=event=>{if(event.channel.label==="klk-reactions")klkAttachReactionChannel(event.channel)};
  if(callRole==="caller"&&callMode==="video")klkAttachReactionChannel(peer.createDataChannel("klk-reactions"));
  localStream.getTracks().forEach(track=>{const sender=peer.addTrack(track,localStream);if(track.kind==="video"){klkTuneCallVideo(track);klkTuneCallSender(sender)}});
  peer.ontrack=event=>{
   const stream=event.streams&&event.streams[0];
   if(stream){$("remoteVideo").srcObject=stream;$("remoteAudio").srcObject=stream;}
   $("callStatus").textContent=callMode==="video"?"Videollamada conectada":"Llamada conectada";
  };
  // A short network drop should not immediately end an established call.
  // WebRTC can recover transient ICE disconnections without renegotiation.
  let connectionWarningTimer=null;
  const clearConnectionWarning=()=>{if(connectionWarningTimer!==null){clearTimeout(connectionWarningTimer);connectionWarningTimer=null;}};
  peer.onconnectionstatechange=()=>{
   const current=peer;if(!current)return;
   const state=current.connectionState;
   if(state==="connected"){clearConnectionWarning();$("callStatus").textContent=callMode==="video"?"Videollamada conectada":"Llamada conectada";return;}
   if(state==="disconnected"){
    $("callStatus").textContent="Conexión interrumpida. Esperando recuperación de la red...";
    clearConnectionWarning();
    connectionWarningTimer=setTimeout(()=>{connectionWarningTimer=null;if(peer===current&&current.connectionState==="disconnected")$("callStatus").textContent="La conexión sigue interrumpida. Revisa Internet; la llamada se recuperará si vuelve la señal.";},12000);
   }
   if(state==="failed"){
    clearConnectionWarning();
    $("callStatus").textContent="La conexión falló. Finaliza y vuelve a llamar si no se restablece.";
   }
   if(state==="closed")clearConnectionWarning();
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
   if(data.status!=="ringing")klkStopOutgoingRing();
   if(data.status==="active"&&ringTimeout){window.clearTimeout(ringTimeout);ringTimeout=null;}
   if(data.status==="rejected"){ $("callStatus").textContent="La otra persona rechazó la llamada.";setTimeoutSafeCleanup();return; }
   if(data.status==="ended"){ $("callStatus").textContent="La llamada finalizó.";setTimeoutSafeCleanup();return; }
   if(callRole==="caller"&&data.answer&&peer&&!peer.remoteDescription){klkStopOutgoingRing();
    try{await peer.setRemoteDescription(new RTCSessionDescription(data.answer));await flushCandidates();showActiveControls();$("callStatus").textContent="Conectando llamada...";}
    catch(error){$("callStatus").textContent="No se pudo conectar la llamada: "+error.message;}
   }
  },error=>{$("callStatus").textContent="Se perdió la señal de la llamada: "+error.message;});
 }
 function setTimeoutSafeCleanup(){window.setTimeout(cleanup,1600);}
 async function startCall(uid,name,mode){
  if(callRef||callStarting){setStatus("Ya tienes una llamada en curso o preparándose.");return;}
  if(!window.auth||!window.auth.currentUser||!isCallContactAccepted(uid)){setStatus("Solo puedes llamar a miembros visibles en el directorio de klk.");return;}
  callStarting=true;
  try{
   callMode=mode;callRole="caller";klkPeerUid=uid;showOverlay(name,mode==="video"?"Solicitando cámara y micrófono...":"Solicitando micrófono...");
   const requestedStream=await getLocalMedia(mode);if(!callStarting){requestedStream.getTracks().forEach(track=>track.stop());return;}localStream=requestedStream;createPeer();
   if(mode==="video"){$("localVideo").srcObject=localStream;}
   const offer=await peer.createOffer();await peer.setLocalDescription(offer);
   const members=[currentUid,uid].sort();
   const conversationId=members.join("__");
   const conversationRef=window.db.collection("conversations").doc(conversationId);
   const conversationSnap=await conversationRef.get();
   if(!conversationSnap.exists)await conversationRef.set({members,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
   callRef=window.db.collection("calls").doc();
   await callRef.set({callerUid:currentUid,calleeUid:uid,conversationId,mode,status:"ringing",offer:{type:offer.type,sdp:offer.sdp},createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
   await flushLocalCandidates();
   $("callStatus").textContent="Llamando a "+name+"...";klkStartOutgoingRing();
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
  incomingUnsub=window.db.collection("calls").where("calleeUid","==",uid).onSnapshot(snapshot=>{
   const doc=snapshot.docs.find(d=>d.data().status==="ringing"&&!callRef&&!incomingCall);
   if(!doc)return;
   const data=doc.data();incomingCall={ref:doc.ref,data};
   incomingDocUnsub=doc.ref.onSnapshot(s=>{if(!s.exists||s.data().status!=="ringing"){if(incomingCall&&incomingCall.ref.id===doc.id){incomingCall=null;cleanup();}}},error=>{console.warn("No se pudo seguir la llamada entrante:",error);});
   ringTimeout=window.setTimeout(async()=>{if(incomingCall&&incomingCall.ref.id===doc.id&&!callRef){try{await doc.ref.update({status:"ended",updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}catch(error){console.warn("No se pudo cerrar la llamada sin respuesta:",error);}incomingCall=null;cleanup();}},45000);
   callMode=data.mode==="video"?"video":"audio";
   const person=callPeople.get(data.callerUid)||{};
   klkPeerUid=data.callerUid;showOverlay(person.displayName||person.email||"Llamada entrante",callMode==="video"?"Videollamada entrante":"Llamada de voz entrante");
   if(window.klkStartIncomingCallSound)window.klkStartIncomingCallSound();
   $("answerCall").hidden=false;$("rejectCall").hidden=false;klkSetIncomingSwipe(true);
   $("answerCall").textContent="Responder";$("rejectCall").textContent="Rechazar";
   if(navigator.vibrate)navigator.vibrate([250,120,250]);
  },error=>setStatus("No se pudieron recibir llamadas: "+error.message));
 }
 klkInitIncomingSwipe();
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
 $("switchCameraCall").addEventListener("click",async()=>{
  if(!localStream||!peer||callMode!=="video"||!navigator.mediaDevices?.getUserMedia)return;
  const nextFacing=cameraFacingMode==="user"?"environment":"user";
  let replacementStream=null;
  try{
   $("switchCameraCall").disabled=true;
   replacementStream=await navigator.mediaDevices.getUserMedia({video:klkCallVideoConstraints(nextFacing),audio:false});
   const nextTrack=replacementStream.getVideoTracks()[0];
   const sender=peer.getSenders().find(item=>item.track&&item.track.kind==="video");
   if(!nextTrack||!sender)throw new Error("No se pudo encontrar la cámara activa.");
   await klkTuneCallVideo(nextTrack);await sender.replaceTrack(nextTrack);await klkTuneCallSender(sender);
   const previousTracks=localStream.getVideoTracks();
   previousTracks.forEach(track=>localStream.removeTrack(track));
   localStream.addTrack(nextTrack);nextTrack.enabled=!cameraOff;
   $("localVideo").srcObject=localStream;
   previousTracks.forEach(track=>track.stop());
   cameraFacingMode=nextFacing;klkUpdateMirrorPreview();
   $("callStatus").textContent=nextFacing==="environment"?"Cámara trasera activa":"Cámara frontal activa";
  }catch(error){
   if(replacementStream)replacementStream.getTracks().forEach(track=>track.stop());
   $("callStatus").textContent="No se pudo cambiar de cámara: "+(error.message||"dispositivo no disponible");
  }finally{$("switchCameraCall").disabled=false;}
 });
 const klkVideoStage=$("callVideoStage");if(klkVideoStage){klkVideoStage.addEventListener("click",event=>{if(callMode!=="video"||!overlay.classList.contains("visible")||!$("remoteVideo").srcObject||!$("localVideo").srcObject)return;if(event.target===$("localVideo")||event.target===$("remoteVideo")||event.target===klkVideoStage)klkVideoStage.classList.toggle("klkCallSwapped")})}
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
 if(window.auth)window.auth.onAuthStateChanged(user=>{
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
  add("Sesión",!!(window.auth&&window.auth.currentUser),window.auth&&window.auth.currentUser?"Sesión iniciada":"Inicia sesión primero");
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
