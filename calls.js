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
 // Prevent Android's native Copy/Select all toolbar inside the active call screen.
 // Scoped to the call overlay so chat message selection remains available.
 const klkCallSelectionStyle=document.createElement("style");
 klkCallSelectionStyle.textContent="#callOverlay,#callOverlay *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}#callOverlay input,#callOverlay textarea{user-select:text!important;-webkit-user-select:text!important}";
 document.head.appendChild(klkCallSelectionStyle);
 overlay?.addEventListener("contextmenu",event=>{if(overlay.classList.contains("visible"))event.preventDefault()});
 overlay?.addEventListener("selectstart",event=>{if(overlay.classList.contains("visible"))event.preventDefault()});
 overlay?.addEventListener("pointerdown",()=>{
  if(!overlay.classList.contains("visible"))return;
  const selection=window.getSelection?.();
  if(selection&&!selection.isCollapsed)selection.removeAllRanges();
 },{passive:true});

 // Gestos KLK: reactions travel privately over the existing WebRTC connection.
 let klkReactionChannel=null;
 const klkReactionChoices=["👍","❤️","😂","👏","🎉","😍","🥰","😘","😮","😢","🔥","💜","🙌","🤩","😎","💯"];
 const klkReactionBar=document.createElement("div");
 klkReactionBar.id="klkReactionBar";
 klkReactionBar.setAttribute("aria-label","Reacciones de videollamada");
 klkReactionBar.style.cssText="display:none;position:absolute;bottom:calc(115px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(94vw,480px);flex-direction:row;flex-wrap:nowrap;gap:7px;align-items:center;justify-content:flex-start;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding:8px 10px;z-index:30;box-sizing:border-box;scrollbar-width:none;-webkit-overflow-scrolling:touch;background:#151922bb;backdrop-filter:blur(12px);border:1px solid #ffffff33;border-radius:22px;box-shadow:0 6px 20px #0005;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none";
 const klkReactionLayer=document.createElement("div");
 klkReactionLayer.style.cssText="position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:15";
 const klkReactionStyle=document.createElement("style");
 klkReactionStyle.textContent=`#klkReactionBar[style*="display: flex"]{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;grid-template-columns:none!important}#klkReactionBar,#klkReactionBar *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}#klkReactionBar::-webkit-scrollbar{display:none}@keyframes klkReactionFloat{0%{transform:translate3d(0,20px,0) scale(.35) rotate(-15deg);opacity:0;filter:blur(3px)}15%{opacity:1;filter:blur(0);transform:translate3d(0,0,0) scale(1.22) rotate(8deg)}38%{transform:translate3d(18px,-75px,0) scale(1.05) rotate(-8deg)}70%{opacity:1;transform:translate3d(-12px,-175px,0) scale(1.35) rotate(9deg)}100%{transform:translate3d(16px,-275px,0) scale(1.65) rotate(-6deg);opacity:0}}@keyframes klkReactionSpark{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}30%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(2.1)}}#klkReactionBar button{flex:0 0 47px;scroll-snap-align:center;width:47px;height:47px;border:1px solid #ffffff80;border-radius:18px;background:linear-gradient(145deg,#ffffff55,#ffffff18);box-shadow:0 4px 12px #0004,inset 0 1px 2px #fff8;font-size:27px;padding:0;touch-action:manipulation;transition:transform .16s ease,background .16s ease}#klkReactionBar button:active{transform:scale(1.18);background:#ffffff66}#klkReactionBar button:focus-visible{outline:3px solid #e8d5ff;outline-offset:2px}.klkReactionBubble{position:absolute;bottom:12%;font-size:clamp(65px,15vw,100px);line-height:1;filter:drop-shadow(0 8px 9px #0008);animation:klkReactionFloat 2.5s cubic-bezier(.2,.7,.25,1) forwards;will-change:transform,opacity;white-space:nowrap}.klkReactionSpark{position:absolute;left:50%;top:50%;width:80px;height:80px;border-radius:50%;border:3px solid #f4c7ff;box-shadow:0 0 24px #e3b4ff;animation:klkReactionSpark .8s ease-out forwards}@media(prefers-reduced-motion:reduce){.klkReactionBubble{animation-duration:.9s}.klkReactionSpark{display:none}#klkReactionBar button{transition:none}}`;
 document.head.append(klkReactionStyle);
 $("callVideoStage")?.append(klkReactionLayer);
 $("callControls")?.parentNode?.insertBefore(klkReactionBar,$("callControls"));
 function klkShowReaction(emoji,remote=false){
  if(!klkReactionChoices.includes(emoji)||callMode!=="video"||!overlay.classList.contains("visible"))return;
  const el=document.createElement("span");el.className="klkReactionBubble";el.textContent=emoji;el.setAttribute("aria-label",remote?"Reacción recibida":"Reacción enviada");
  el.style.left=(remote?58+Math.random()*19:12+Math.random()*20)+"%";
  const spark=document.createElement("span");spark.className="klkReactionSpark";spark.setAttribute("aria-hidden","true");el.append(spark);
  klkReactionLayer.append(el);setTimeout(()=>el.remove(),2600);
 }
 function klkAttachReactionChannel(channel){
  klkReactionChannel=channel;
  channel.addEventListener("open",()=>{klkLooksBroadcast()});
  channel.onmessage=event=>{try{const data=JSON.parse(event.data);if(data?.type==="klk-reaction"&&klkReactionChoices.includes(data.emoji))klkShowReaction(data.emoji,true);if(data?.type==="klk-look"&&["","😎","🧢","👩‍🦰","👑","🤠","🥸"].includes(data.emoji)){klkLookSetGraphic(klkLooksRemote,data.emoji);klkLooksRemote.style.display=data.emoji?"block":"none"}}catch(e){}};
  channel.onclose=()=>{if(klkReactionChannel===channel){klkReactionChannel=null;klkStopReactionRepeat()}};
 }
 // A held reaction repeats until the finger/mouse is released; keyboard activation sends once.
 let klkReactionRepeatTimer=null;
 let klkReactionHeldPointer=null;
 function klkStopReactionRepeat(){
  if(klkReactionRepeatTimer!==null){clearInterval(klkReactionRepeatTimer);klkReactionRepeatTimer=null;}
  klkReactionHeldPointer=null;
 }
 function klkSendReaction(emoji){
  if(klkReactionChannel?.readyState!=="open"||callMode!=="video"||!overlay.classList.contains("visible"))return false;
  klkShowReaction(emoji);
  try{klkReactionChannel.send(JSON.stringify({type:"klk-reaction",emoji}));return true;}
  catch(error){klkStopReactionRepeat();return false;}
 }
 for(const emoji of klkReactionChoices){
  const button=document.createElement("button");button.type="button";button.textContent=emoji;button.setAttribute("aria-label","Mantener presionado para enviar reacción "+emoji);
  button.style.touchAction="pan-x";button.draggable=false;button.addEventListener("contextmenu",event=>event.preventDefault());button.addEventListener("selectstart",event=>event.preventDefault());
  button.addEventListener("pointerdown",event=>{event.preventDefault();
   if(event.button!==0||klkReactionHeldPointer!==null)return;
   klkReactionHeldPointer=event.pointerId;
   if(!klkSendReaction(emoji)){klkStopReactionRepeat();return;}
   try{button.setPointerCapture(event.pointerId)}catch(error){}
   klkReactionRepeatTimer=setInterval(()=>{if(!klkSendReaction(emoji))klkStopReactionRepeat()},320);
  });
  const stop=event=>{if(klkReactionHeldPointer===event.pointerId)klkStopReactionRepeat()};
  button.addEventListener("pointerup",stop);
  button.addEventListener("pointercancel",stop);
  button.addEventListener("lostpointercapture",stop);
  button.addEventListener("click",event=>{if(event.detail===0)klkSendReaction(emoji)});
  klkReactionBar.append(button);
 }
 // KLK Looks: first-stage local accessory preview (no camera-track modification).
 const klkLooksButton=document.createElement("button");
 klkLooksButton.type="button";klkLooksButton.textContent="🎭 Efectos";
 klkLooksButton.setAttribute("aria-label","Abrir accesorios de cámara");
 klkLooksButton.style.cssText="display:none;border-radius:18px;padding:8px 12px;border:1px solid #ffffff55;background:#33244dcc;color:white;font-weight:600";
 const klkLooksTray=document.createElement("div");
 klkLooksTray.style.cssText="display:none;position:absolute;bottom:calc(175px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(92vw,360px);padding:10px;gap:8px;flex-wrap:wrap;justify-content:center;background:#181423dd;border-radius:18px;z-index:32;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none";
 klkLooksTray.setAttribute("aria-label","Accesorios virtuales de prueba");
 const klkLooksPreview=document.createElement("div");
 klkLooksPreview.setAttribute("aria-hidden","true");
 klkLooksPreview.style.cssText="position:absolute;top:8%;left:50%;transform:translateX(-50%);font-size:clamp(60px,18vw,110px);pointer-events:none;z-index:18;display:none;filter:drop-shadow(0 5px 8px #0008)";
 const klkLooksRemote=document.createElement("div");
 klkLooksRemote.setAttribute("aria-label","Accesorio de la otra persona");
 klkLooksRemote.style.cssText="display:none;position:absolute;top:10%;left:50%;transform:translateX(-50%);font-size:clamp(60px,18vw,110px);pointer-events:none;z-index:17;filter:drop-shadow(0 5px 8px #0008)";
 $("callVideoStage")?.append(klkLooksRemote);
 let klkLooksDetector=null,klkLooksTimer=null,klkLooksBusy=false,klkLooksFallbackLoading=null,klkLooksFallback=null,klkLooksFace=null;
 let klkLooksMesh=null,klkLooksMeshLoading=null,klkLooksLandmarks=null;
 function klkLooksLoadMesh(){
  if(klkLooksMeshLoading)return klkLooksMeshLoading;
  klkLooksMeshLoading=new Promise((resolve,reject)=>{
   if(window.FaceMesh){resolve(window.FaceMesh);return}
   const script=document.createElement("script");
   script.src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js";
   script.crossOrigin="anonymous";
   script.onload=()=>window.FaceMesh?resolve(window.FaceMesh):reject(new Error("FaceMesh no disponible"));
   script.onerror=()=>reject(new Error("No se pudo cargar FaceMesh"));
   document.head.append(script);
  }).then(Mesh=>{
   klkLooksMesh=new Mesh({locateFile:file=>"https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/"+file});
   klkLooksMesh.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
   klkLooksMesh.onResults(results=>{klkLooksLandmarks=results.multiFaceLandmarks?.[0]||null});
  }).catch(error=>{console.warn("KLK Looks: FaceMesh no disponible",error);klkLooksMesh=null});
  return klkLooksMeshLoading;
 }
 function klkLooksPositionMesh(points,video){
  const rect=video.getBoundingClientRect(),stage=$("callVideoStage").getBoundingClientRect();
  if(!rect.width||!rect.height||!video.videoWidth||!video.videoHeight)return;
  const scale=getComputedStyle(video).objectFit==="cover"?Math.max(rect.width/video.videoWidth,rect.height/video.videoHeight):Math.min(rect.width/video.videoWidth,rect.height/video.videoHeight);
  const renderW=video.videoWidth*scale,renderH=video.videoHeight*scale;
  const map=p=>({x:rect.left+(rect.width-renderW)/2+p.x*renderW-stage.left,y:rect.top+(rect.height-renderH)/2+p.y*renderH-stage.top});
  const left=map(points[33]),right=map(points[263]),brow=map(points[10]),chin=map(points[152]),nose=map(points[1]);
  const eyeDistance=Math.hypot(right.x-left.x,right.y-left.y);
  const angle=Math.atan2(right.y-left.y,right.x-left.x)*180/Math.PI;
  const type=klkLooksSelected;
  const isGlasses=type==="😎",isMustache=type==="🥸",isHair=type==="👩‍🦰";
  const width=Math.max(55,Math.min(340,eyeDistance*(isGlasses?1.95:isMustache?1.25:isHair?3.25:2.75)));
  const x=(left.x+right.x)/2;
  const y=isGlasses?(left.y+right.y)/2:isMustache?nose.y+eyeDistance*.42:isHair?brow.y-eyeDistance*.47:brow.y-eyeDistance*.68;
  klkLooksPreview.style.left=x+"px";klkLooksPreview.style.top=y+"px";
  klkLooksPreview.style.width=width+"px";
  klkLooksPreview.style.height=(width*(isHair?.82:isGlasses?.45:isMustache?.38:.54))+"px";
  klkLooksPreview.style.transform="translate(-50%,-50%) rotate("+angle.toFixed(1)+"deg)";
  klkLooksPreview.style.display="block";
 }

 function klkLooksLoadFallback(){
  if(klkLooksFallbackLoading)return klkLooksFallbackLoading;
  klkLooksFallbackLoading=new Promise((resolve,reject)=>{
   if(window.FaceDetection){resolve(window.FaceDetection);return}
   const script=document.createElement("script");
   script.src="https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/face_detection.js";
   script.crossOrigin="anonymous";
   script.onload=()=>window.FaceDetection?resolve(window.FaceDetection):reject(new Error("Detector facial no disponible"));
   script.onerror=()=>reject(new Error("No se pudo cargar el detector facial"));
   document.head.append(script);
  }).then(Detector=>{
   klkLooksFallback=new Detector({locateFile:file=>"https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/"+file});
   klkLooksFallback.setOptions({model:"short",minDetectionConfidence:0.5});
   klkLooksFallback.onResults(results=>{
    const box=results.detections?.[0]?.boundingBox;
    klkLooksFace=box?{xCenter:box.xCenter,yCenter:box.yCenter,width:box.width,height:box.height}:null;
   });
  }).catch(error=>{console.warn("KLK Looks: seguimiento facial no disponible",error);klkLooksFallback=null});
  return klkLooksFallbackLoading;
 }
 function klkLooksPosition(f,video){
  const rect=video.getBoundingClientRect(),stage=$("callVideoStage").getBoundingClientRect();
  if(!rect.width||!rect.height||!video.videoWidth||!video.videoHeight)return;
  const style=getComputedStyle(video),fit=style.objectFit;
  const scale=fit==="cover"?Math.max(rect.width/video.videoWidth,rect.height/video.videoHeight):Math.min(rect.width/video.videoWidth,rect.height/video.videoHeight);
  const renderedW=video.videoWidth*scale,renderedH=video.videoHeight*scale;
  const x=rect.left+(rect.width-renderedW)/2+(f.x+f.width/2)*scale-stage.left;
  const y=rect.top+(rect.height-renderedH)/2+(f.y+(klkLooksSelected==="😎"?.42:.02)*f.height)*scale-stage.top;
  klkLooksPreview.style.left=x+"px";klkLooksPreview.style.top=y+"px";
  klkLooksPreview.style.transform="translate(-50%,-50%)";
  const width=Math.max(60,Math.min(260,f.width*scale*(klkLooksSelected==="😎"?1.18:1.55)));
  klkLooksPreview.style.width=width+"px";klkLooksPreview.style.height=(width*(klkLooksSelected==="👩‍🦰"?.95:.55))+"px";
  klkLooksPreview.style.display="block";
 }

 if(typeof window.FaceDetector==="function"){try{klkLooksDetector=new window.FaceDetector({fastMode:true,maxDetectedFaces:1})}catch(e){klkLooksDetector=null}}
 async function klkLooksTrack(){
  const video=$("localVideo");
  if(klkLooksBusy||!klkLooksSelected||!video||video.readyState<2||!overlay.classList.contains("visible"))return;
  klkLooksBusy=true;
  try{
   if(klkLooksMesh){
    klkLooksLandmarks=null;
    await klkLooksMesh.send({image:video});
    if(klkLooksLandmarks){klkLooksPositionMesh(klkLooksLandmarks,video);return}
   }
   let face=null;
   if(klkLooksDetector){
    try{const faces=await klkLooksDetector.detect(video);face=faces[0]?.boundingBox||null}
    catch(e){klkLooksDetector=null}
   }
   if(!klkLooksDetector){
    await klkLooksLoadFallback();
    if(klkLooksFallback){
     klkLooksFace=null;
     await klkLooksFallback.send({image:video});
     const f=klkLooksFace;
     if(f)face={x:(f.xCenter-f.width/2)*video.videoWidth,y:(f.yCenter-f.height/2)*video.videoHeight,width:f.width*video.videoWidth,height:f.height*video.videoHeight};
    }
   }
   if(face)klkLooksPosition(face,video);
   else if(klkLooksDetector||klkLooksFallback)klkLooksPreview.style.display="none";
  }catch(e){console.warn("KLK Looks: error de seguimiento",e)}
  finally{klkLooksBusy=false}
 }
 function klkLooksBroadcast(){
  if(klkReactionChannel?.readyState==="open"){try{klkReactionChannel.send(JSON.stringify({type:"klk-look",emoji:klkLooksSelected}))}catch(e){}}
 }
 const klkLookArtwork={
  "😎":'<svg viewBox="0 0 240 105" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lens" x2=".3" y2="1"><stop stop-color="#162f48"/><stop offset="1" stop-color="#050b18"/></linearGradient></defs><path d="M9 28 Q60 9 108 27 Q120 33 132 27 Q181 9 231 28" fill="none" stroke="#c8a66d" stroke-width="9" stroke-linecap="round"/><path d="M18 31 Q25 87 70 88 Q107 86 108 35 Q66 23 18 31ZM132 35 Q133 86 170 88 Q215 87 222 31 Q174 23 132 35Z" fill="url(#lens)" stroke="#e5bd75" stroke-width="7"/><path d="M29 37 L72 32" stroke="#ffffff" opacity=".32" stroke-width="6" stroke-linecap="round"/></svg>',
  "🧢":'<svg viewBox="0 0 240 130" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cap" x2="1" y2="1"><stop stop-color="#7153ba"/><stop offset="1" stop-color="#2e185e"/></linearGradient></defs><path d="M32 94 Q25 17 119 12 Q217 17 210 94Z" fill="url(#cap)" stroke="#21183b" stroke-width="5"/><path d="M30 91 Q112 69 211 91 Q242 98 232 112 Q109 133 10 111 Q-1 99 30 91Z" fill="#442883" stroke="#241648" stroke-width="5"/><path d="M118 16 L118 81" stroke="#ffffff" opacity=".15" stroke-width="4"/></svg>',
  "👩‍🦰":'<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="hair" x2="1" y2="1"><stop stop-color="#f5ad4d"/><stop offset=".55" stop-color="#9c4328"/><stop offset="1" stop-color="#57221d"/></linearGradient></defs><path d="M26 176 Q-1 91 31 41 Q65 -7 122 9 Q190 -8 214 52 Q244 115 213 176 L177 166 Q205 78 158 48 Q117 18 78 50 Q33 80 62 168Z" fill="url(#hair)" stroke="#72351e" stroke-width="5"/><path d="M47 49 Q111 88 193 44" fill="none" stroke="#f6bf77" opacity=".45" stroke-width="8"/></svg>',
  "👑":'<svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg"><path d="M16 25 L68 65 L120 6 L172 65 L224 25 L207 103 L33 103Z" fill="#e8b643" stroke="#9d6a17" stroke-width="7"/><path d="M35 88 H206 V110 H35Z" fill="#f8d56a" stroke="#9d6a17" stroke-width="5"/><circle cx="120" cy="75" r="12" fill="#a94acb"/><circle cx="69" cy="77" r="8" fill="#4a9ee8"/><circle cx="173" cy="77" r="8" fill="#e64f64"/></svg>',
  "🤠":'<svg viewBox="0 0 240 130" xmlns="http://www.w3.org/2000/svg"><path d="M48 93 Q58 9 118 12 Q183 10 192 93" fill="#b87535" stroke="#603b1c" stroke-width="6"/><path d="M46 79 Q120 101 194 79 L193 98 Q120 120 47 98Z" fill="#6b3b20"/><path d="M11 90 Q49 112 117 102 Q189 112 228 89 Q242 118 198 121 Q113 133 35 120 Q-1 117 11 90Z" fill="#a8662f" stroke="#603b1c" stroke-width="5"/></svg>',
  "🥸":'<svg viewBox="0 0 240 90" xmlns="http://www.w3.org/2000/svg"><path d="M119 30 Q85 -2 45 21 Q19 42 40 66 Q65 83 119 49 Q175 83 201 66 Q223 42 195 21 Q156 -2 119 30Z" fill="#3b261c" stroke="#1b1513" stroke-width="5"/><path d="M48 30 Q78 17 107 38 M131 38 Q162 17 192 30" fill="none" stroke="#9a7456" opacity=".5" stroke-width="5"/></svg>'
 };
 function klkLookSetGraphic(target,emoji){
  target.replaceChildren();
  if(!emoji)return;
  const svg=klkLookArtwork[emoji];
  if(svg){const img=document.createElement("img");img.alt="";img.draggable=false;img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);img.style.cssText="display:block;width:100%;height:100%;object-fit:contain";target.append(img)}
  else target.textContent=emoji;
 }
 const klkLooksOptions=[["","Sin efecto"],["😎","Gafas"],["🧢","Gorra"],["👩‍🦰","Peluca"],["👑","Corona"],["🤠","Sombrero"],["🥸","Bigote"]];
 let klkLooksSelected="";
 for(const [emoji,label] of klkLooksOptions){
  const button=document.createElement("button");button.type="button";button.textContent=emoji?emoji+" "+label:label;
  button.style.cssText="border:1px solid #ffffff55;border-radius:14px;padding:8px;background:#ffffff22;color:white;font-size:16px;-webkit-user-select:none;user-select:none";
  button.addEventListener("click",()=>{klkLooksSelected=emoji;klkLookSetGraphic(klkLooksPreview,emoji);klkLooksPreview.style.display=emoji?"block":"none";if(emoji){klkLooksLoadMesh();if(!klkLooksDetector)klkLooksLoadFallback()}klkLooksTray.style.display="none";klkLooksBroadcast()});
  klkLooksTray.append(button);
 }
 klkLooksButton.addEventListener("click",()=>{klkLooksTray.style.display=klkLooksTray.style.display==="flex"?"none":"flex"});
 $("callControls")?.append(klkLooksButton);
 overlay?.append(klkLooksTray);
 $("callVideoStage")?.append(klkLooksPreview);
 function klkLooksVisibility(){
  const visible=callMode==="video"&&overlay.classList.contains("visible");
  klkLooksButton.style.display=visible?"inline-block":"none";
  if(!visible)klkLooksTray.style.display="none";
  klkLooksPreview.style.display=visible&&klkLooksSelected?"block":"none";
  if(visible&&!klkLooksTimer)klkLooksTimer=setInterval(klkLooksTrack,250);
  if(!visible&&klkLooksTimer){clearInterval(klkLooksTimer);klkLooksTimer=null}
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
 let klkMirrorPreview=false;
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
  if(video)video.classList.remove("klkPreviewMirrored");
  klkMirrorButton.hidden=true; // Kept detached from DOM.
  klkMirrorButton.textContent=klkMirrorPreview?"Espejo: sí":"Espejo: no";
  klkMirrorButton.setAttribute("aria-label",klkMirrorPreview?"Desactivar efecto espejo":"Activar efecto espejo");
  klkMirrorButton.setAttribute("aria-pressed",String(klkMirrorPreview));
 }
 // Mirror toggle intentionally disabled; local preview keeps natural orientation.
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
  klkReactionBar.style.display=callMode==="video"?"flex":"none";klkLooksVisibility();
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
  if(klkLooksTimer){clearInterval(klkLooksTimer);klkLooksTimer=null}klkLooksRemote.style.display="none";klkLooksRemote.replaceChildren();klkLooksSelected="";klkLooksTray.style.display="none";klkLooksPreview.style.display="none";klkLooksButton.style.display="none";klkStopReactionRepeat();klkReactionBar.style.display="none";klkReactionLayer.replaceChildren();klkReactionChannel=null;
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
