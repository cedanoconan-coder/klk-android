/* KLK Clips v2 — standalone, local-only interactive prototype. No backend, no public uploads. */
(()=>{'use strict';
const $=(root,sel)=>root.querySelector(sel);
function init(){
 const root=document.getElementById('clipsPanel');if(!root||root.dataset.ready)return;root.dataset.ready='1';
 root.innerHTML=`<header class="clipsHead"><strong>▶ KLK Clips <small>DEMO</small></strong><div class="clipsTopActions"><button id="clipsStudio" type="button" aria-label="Abrir estudio de creadores">✦ Estudio</button><button id="clipsCreate" type="button">＋ Crear</button></div></header>
 <nav class="clipsTabs" aria-label="Explorar videos"><button data-feed="foryou" aria-pressed="true">Para ti</button><button data-feed="following" aria-pressed="false">Siguiendo</button><button data-feed="mine" aria-pressed="false">Mis clips</button></nav>
 
 <div class="clipsStage" tabindex="0" aria-label="Visor de clips. Usa flechas arriba y abajo para cambiar">
 <div class="clipsMedia"></div><div class="clipsProgress" aria-hidden="true"><span></span></div><div class="clipsEmpty"><span class="symbol">🎬</span><h2>KLK Clips</h2><p>Selecciona «Crear» para probar un video de tu teléfono. Desliza hacia arriba para cambiar entre tus clips.</p></div>
 <div class="clipsActions"><button type="button" data-action="sound" aria-label="Activar sonido">🔇</button><button data-action="like" aria-label="Me gusta">♡</button><button data-action="comment" aria-label="Comentarios">💬</button><button data-action="follow" aria-label="Seguir creador">＋</button><button data-action="share" aria-label="Compartir">↗</button><button data-action="report" aria-label="Denunciar">⚑</button></div>
 <div class="clipsCaption"><strong class="clipsAuthor">@KLKManin</strong><p class="clipsDescription">Tu espacio para crear y descubrir.</p><span class="clipsCounter"></span></div>
 <button class="clipsNext" type="button" aria-label="Siguiente video">↓ Siguiente</button></div>
 <div class="clipsFooter" id="clipsFeedback" role="status" aria-live="polite">Tus chats y contactos no se utilizan en esta demostración.</div>
 <div class="clipsModal" id="clipsCreateMenu" hidden><div class="clipsDialog" role="dialog" aria-modal="true" aria-label="Opciones para crear un clip"><h3>Crear clip</h3><button type="button" id="clipsRecordChoice">📷 Grabar video</button><button type="button" id="clipsGalleryChoice">🗂 Elegir de la galería</button><button type="button" id="clipsTemplatesChoice">✦ Plantillas para creadores</button><button type="button" id="clipsFaceEffectsChoice">🧔 Efectos de barba</button><button type="button" id="clipsMenuClose" class="secondary">Cancelar</button><input id="clipsCameraFile" type="file" accept="video/*" capture="environment" hidden><p>La opción Grabar video abre la cámara del dispositivo cuando el navegador lo permite.</p></div></div>
 <div class="clipsModal" id="clipsCameraModal" hidden><div class="clipsDialog" role="dialog" aria-modal="true" aria-label="Cámara de KLK Clips"><h3>Grabar video</h3><label>Duración máxima <select id="clipsRecordDuration"><option value="15">15 segundos</option><option value="60">60 segundos</option><option value="600">10 minutos</option></select></label><div class="clipsCameraViewport"><video id="clipsCameraPreview" autoplay muted playsinline></video><canvas id="clipsFaceCanvas" aria-hidden="true"></canvas></div><details id="clipsBeardControls"><summary>Barba adaptativa · seguimiento facial</summary><div class="clipsBeardOptions"><p>La textura sigue mejillas, labios, mandíbula y mentón. La abertura respeta la boca.</p><div class="clipsBeardStyles"><button type="button" data-clips-beard="none" class="active">Sin barba</button><button type="button" data-clips-beard="full">Perfilada</button><button type="button" data-clips-beard="vandyke">Van Dyke</button><button type="button" data-clips-beard="goatee">Candado</button><button type="button" data-clips-beard="shadow">Sombra</button></div><label class="clipsBeardColor">Color de barba <input id="clipsBeardColor" type="color" value="#171211"></label><p id="clipsBeardStatus" role="status" aria-live="polite">Elige un estilo para activar el seguimiento.</p></div></details><p id="clipsCameraStatus" role="status" aria-live="polite">Preparando cámara…</p><video id="clipsRecordedPreview" controls playsinline hidden style="width:100%;max-height:42dvh;background:#000;border-radius:12px"></video><a id="clipsRecordedDownload" hidden download="klk-clip.webm">Guardar video en el dispositivo</a><button type="button" id="clipsRecordedUse" hidden>Usar este video</button><button type="button" id="clipsRecordedRetry" hidden>Repetir grabación</button><button type="button" id="clipsCameraStart">● Iniciar grabación</button><button type="button" id="clipsCameraStop" disabled>■ Detener</button><button type="button" id="clipsCameraFlip">↻ Cambiar cámara</button><button type="button" id="clipsCameraCancel" class="secondary">Cerrar cámara</button></div></div>
 <div class="clipsModal" id="clipsModal" hidden><div class="clipsDialog" role="dialog" aria-modal="true" aria-labelledby="clipsDialogTitle"><h3 id="clipsDialogTitle">Crear clip de prueba</h3><label>Video de tu teléfono (hasta 10 minutos)<input id="clipsFile" type="file" accept="video/*"></label><label>Descripción<textarea id="clipsDescriptionInput" maxlength="200" rows="3" placeholder="¿Qué quieres contar?"></textarea></label><p id="clipsFormError" role="alert"></p><button type="button" id="clipsAdd">Añadir a mi demo</button><button type="button" id="clipsClose" class="secondary">Cancelar</button></div></div>
 <div class="clipsModal" id="clipsStudioModal" hidden><div class="clipsDialog clipsStudioDialog" role="dialog" aria-modal="true" aria-label="Estudio de creadores"><h3>✦ Estudio de creadores</h3><p>Herramientas locales para preparar tus clips.</p><div class="clipsStudioStats" id="clipsStudioStats"></div><label>Seleccionar clip para editar<select id="clipsEditSelect"></select></label><label>Descripción<textarea id="clipsEditDescription" maxlength="200" rows="2"></textarea></label><label>Inicio de reproducción (segundos)<input type="number" min="0" step="0.5" id="clipsTrimStart" value="0"></label><label>Fin de reproducción (segundos)<input type="number" min="0" step="0.5" id="clipsTrimEnd" value="60"></label><label>Velocidad de reproducción<select id="clipsEditSpeed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><div class="clipsStudioButtons"><button id="clipsSaveEdit" type="button">Guardar ajustes</button><button id="clipsCover" type="button">Guardar portada</button><button id="clipsDelete" type="button" class="secondary">Quitar clip</button><button id="clipsStudioClose" type="button" class="secondary">Cerrar</button></div><p class="clipsStudioHelp">Los ajustes no modifican el archivo original. La portada se guarda como imagen en tu teléfono.</p></div></div><div class="clipsModal" id="clipsCommentsModal" hidden><div class="clipsDialog" role="dialog" aria-modal="true" aria-label="Comentarios de prueba"><h3>Comentarios</h3><div id="clipsCommentsList"></div><label>Escribe un comentario<input id="clipsCommentInput" maxlength="180" placeholder="Comentario de prueba"></label><button id="clipsCommentSend" type="button">Comentar</button><button id="clipsCommentsClose" type="button" class="secondary">Cerrar</button></div></div>`;
 const stage=$(root,'.clipsStage'),media=$(root,'.clipsMedia'),empty=$(root,'.clipsEmpty'),feedback=$(root,'#clipsFeedback'),modal=$(root,'#clipsModal'),commentsModal=$(root,'#clipsCommentsModal');
 const clips=[];let index=0,feed='foryou',startY=null;const studio=$(root,'#clipsStudioModal');const following=new Set(['KLKManin']);
 const current=()=>{const items=clips.filter(c=>feed!=='following'||following.has(c.author));return {items,clip:items[index]||null};};
 let toastTimer=null;function notify(s){feedback.textContent=s;feedback.classList.add('is-visible');if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>feedback.classList.remove('is-visible'),2300);}
 function render(){
  const {items,clip}=current();media.replaceChildren();empty.hidden=!!clip;
  $(root,'.clipsActions').hidden=!clip;$(root,'.clipsCaption').hidden=!clip;$(root,'.clipsNext').hidden=items.length<2;
  if(!clip){empty.querySelector('p').textContent=feed==='following'?'Aún no tienes clips de creadores seguidos.':'Añade un video con «Crear» para probar el reproductor.';return;}
  const video=document.createElement('video');video.src=clip.url;video.controls=false;video.muted=true;video.playsInline=true;video.loop=true;video.preload='auto';video.autoplay=true;video.addEventListener('click',()=>{if(video.paused)video.play().catch(()=>{});else video.pause();});video.addEventListener('loadeddata',()=>{video.currentTime=clip.trimStart||0;video.playbackRate=clip.speed||1;video.play().catch(()=>notify('Toca el video para reproducirlo.'));});video.addEventListener('timeupdate',()=>{const end=clip.trimEnd||video.duration;if(video.currentTime>=end&&end>0)video.currentTime=clip.trimStart||0;const span=$(root,'.clipsProgress span');if(span&&Number.isFinite(video.duration))span.style.width=(100*video.currentTime/video.duration)+'%';});video.setAttribute('aria-label','Video de '+clip.author);media.append(video);video.play().catch(()=>{});
  $(root,'.clipsAuthor').textContent='@'+clip.author;$(root,'.clipsDescription').textContent=clip.description||'Mi nuevo clip';$(root,'.clipsCounter').textContent=(index+1)+' de '+items.length;
  $(root,'[data-action="sound"]').textContent='🔇';$(root,'[data-action="like"]').textContent=clip.liked?'♥':'♡';$(root,'[data-action="follow"]').textContent=following.has(clip.author)?'✓':'＋';
 }
 function next(delta){const {items}=current();if(items.length<2)return;index=(index+delta+items.length)%items.length;render();}
 const createMenu=$(root,'#clipsCreateMenu');
 $(root,'#clipsCreate').addEventListener('click',()=>{createMenu.hidden=false;});
 $(root,'#clipsMenuClose').addEventListener('click',()=>{createMenu.hidden=true;});
 $(root,'#clipsTemplatesChoice').addEventListener('click',()=>{createMenu.hidden=true;window.location.href='./klk-clips-templates-v5.html';});
 $(root,'#clipsFaceEffectsChoice').addEventListener('click',()=>{createMenu.hidden=true;clearRecording();$(root,'#clipsBeardControls').open=true;openCamera();});
 $(root,'#clipsGalleryChoice').addEventListener('click',()=>{createMenu.hidden=true;modal.hidden=false;$(root,'#clipsFormError').textContent='';$(root,'#clipsFile').focus();});
 const cameraModal=$(root,'#clipsCameraModal'),cameraPreview=$(root,'#clipsCameraPreview'),cameraStatus=$(root,'#clipsCameraStatus'),recordedPreview=$(root,'#clipsRecordedPreview'),recordedDownload=$(root,'#clipsRecordedDownload'),recordedUse=$(root,'#clipsRecordedUse'),recordedRetry=$(root,'#clipsRecordedRetry');
 let cameraStream=null,recorder=null,recordChunks=[],recordTimer=null,recordTimeout=null,facing='environment',recording=false,recordedFile=null,recordedUrl=null,recordCanvasStream=null,session=0;
 const faceCanvas=$(root,'#clipsFaceCanvas'),faceCtx=faceCanvas.getContext('2d'),beardStatus=$(root,'#clipsBeardStatus');
 const inputFrame=document.createElement('canvas'),inputCtx=inputFrame.getContext('2d');
 const beardOverlay=new Image();beardOverlay.src='./klk-face-assets/beard-realistic.png';
 let beardStyle='none',beardColor='#171211',faceTracker=null,faceTaskPromise=null,faceRaf=0,lastFaceTime=-1,latestFace=null;
 const cameraButton=$(root,'#clipsCameraStart'),stopButton=$(root,'#clipsCameraStop'),flipButton=$(root,'#clipsCameraFlip');

 async function ensureFaceTracker(){
  if(faceTracker)return faceTracker;
  if(faceTaskPromise)return faceTaskPromise;
  faceTaskPromise=(async()=>{
   beardStatus.textContent='Cargando seguimiento facial…';
   let vision;
   try{vision=await import('./klk-face-assets/vision_bundle.mjs');}
   catch(localError){try{vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');}
    catch(primaryError){vision=await import('https://esm.sh/@mediapipe/tasks-vision@0.10.22');}}
   let files;
   try{files=await vision.FilesetResolver.forVisionTasks('./klk-face-assets/wasm');}
   catch(localWasmError){files=await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');}
   faceTracker=await vision.FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./klk-face-assets/face_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numFaces:1,refineLandmarks:true});
   beardStatus.textContent='Seguimiento activo. La barba se ajusta a la cara.';
   return faceTracker;
  })().catch(error=>{faceTaskPromise=null;beardStatus.textContent='No se pudo cargar el seguimiento: '+error.message;throw error;});
  return faceTaskPromise;
 }
 function renderFaceFrame(){
  if(!cameraStream||cameraModal.hidden)return;
  if(cameraPreview.readyState>=2&&cameraPreview.videoWidth){
   const box=faceCanvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
   const w=Math.max(1,Math.round(box.width*dpr)),h=Math.max(1,Math.round(box.height*dpr));
   if(faceCanvas.width!==w||faceCanvas.height!==h){faceCanvas.width=w;faceCanvas.height=h;lastFaceTime=-1;}
   const vw=cameraPreview.videoWidth,vh=cameraPreview.videoHeight;
   if(inputFrame.width!==vw||inputFrame.height!==vh){inputFrame.width=vw;inputFrame.height=vh;lastFaceTime=-1;}
   if(cameraPreview.currentTime!==lastFaceTime){
    inputCtx.drawImage(cameraPreview,0,0,vw,vh);
    if(faceTracker&&beardStyle!=='none'){
     try{const result=faceTracker.detectForVideo(inputFrame,performance.now());latestFace=result.faceLandmarks?.[0]||null;}
     catch(error){latestFace=null;beardStatus.textContent='Seguimiento interrumpido: '+error.message;}
    }else latestFace=null;
    lastFaceTime=cameraPreview.currentTime;
   }
   const scale=Math.max(w/vw,h/vh),ox=(w-vw*scale)/2,oy=(h-vh*scale)/2,mirror=facing==='user';
   faceCtx.clearRect(0,0,w,h);faceCtx.save();
   if(mirror){faceCtx.translate(w,0);faceCtx.scale(-1,1);}
   faceCtx.drawImage(inputFrame,ox,oy,vw*scale,vh*scale);faceCtx.restore();
   if(latestFace&&beardStyle!=='none'){
    const pt=p=>({x:mirror?w-(p.x*vw*scale+ox):p.x*vw*scale+ox,y:p.y*vh*scale+oy});
    drawBeard(latestFace,pt);
    beardStatus.textContent='Rostro detectado · textura adaptada y labios despejados';
   }else if(beardStyle!=='none'&&faceTracker){beardStatus.textContent='Buscando rostro…';}
  }
  faceRaf=requestAnimationFrame(renderFaceFrame);
 }
 function setBeardStyle(style){
  beardStyle=style;faceCanvas.closest('.clipsCameraViewport').classList.toggle('has-beard',style!=='none');
  root.querySelectorAll('[data-clips-beard]').forEach(button=>button.classList.toggle('active',button.dataset.clipsBeard===style));
  if(style==='none'){latestFace=null;beardStatus.textContent='Efecto de barba desactivado.';return;}
  ensureFaceTracker().then(()=>{if(cameraStream&&!faceRaf)faceRaf=requestAnimationFrame(renderFaceFrame);}).catch(()=>{});
 }
 root.querySelectorAll('[data-clips-beard]').forEach(button=>button.addEventListener('click',()=>setBeardStyle(button.dataset.clipsBeard)));
 $(root,'#clipsBeardColor').addEventListener('input',event=>{beardColor=event.target.value;});

function drawBeard(landmarks,pt){
 const required=[13,14,61,132,136,148,149,150,152,172,176,288,291,361,365,377,378,379,397,400,454];
 if(beardStyle==='none'||required.some(i=>!landmarks[i]))return;
 const left=pt(landmarks[234]),right=pt(landmarks[454]);
 const mouthLeft=pt(landmarks[61]),mouthRight=pt(landmarks[291]);
 const upperLip=pt(landmarks[13]),lowerLip=pt(landmarks[14]),chin=pt(landmarks[152]);
 const origin={x:(mouthLeft.x+mouthRight.x)/2,y:(mouthLeft.y+mouthRight.y)/2};
 const axisX=right.x-left.x,axisY=right.y-left.y,width=Math.hypot(axisX,axisY);
 if(width<30)return;
 const ux=axisX/width,uy=axisY/width,px=-uy,py=ux;
 const toChinX=chin.x-origin.x,toChinY=chin.y-origin.y;
 const angle=Math.atan2(uy,ux)+((px*toChinX+py*toChinY)<0?Math.PI:0);
 const height=Math.abs(-Math.sin(angle)*toChinX+Math.cos(angle)*toChinY);
 if(height<12)return;
 const local=p=>({x:(p.x-origin.x)*Math.cos(angle)+(p.y-origin.y)*Math.sin(angle),y:-(p.x-origin.x)*Math.sin(angle)+(p.y-origin.y)*Math.cos(angle)});
 const upper=local(upperLip),lower=local(lowerLip),leftMouth=local(mouthLeft),rightMouth=local(mouthRight);
 const rgb=[1,3,5].map(i=>parseInt(beardColor.slice(i,i+2),16));
 if(rgb.some(Number.isNaN))return;
 const shade=(factor,alpha)=>'rgba('+rgb.map(n=>Math.round(n*factor)).join(',')+','+alpha+')';
 const beardFill=faceCtx.createLinearGradient(0,-height*.1,0,height);
 beardFill.addColorStop(0,shade(1,.12));
 beardFill.addColorStop(.28,shade(1,.25));
 beardFill.addColorStop(.72,shade(.82,.38));
 beardFill.addColorStop(1,shade(.68,.48));
 const texture=(count,minY,maxY)=>{
  // Stable, fine strokes read as hair while avoiding the dotted, stamped look.
  let seed=719;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  faceCtx.lineCap='round';
  for(let i=0;i<count;i++){
   const x=(rand()-.5)*width*.76,y=minY+rand()*(maxY-minY);
   const len=height*(.012+rand()*.027),dx=(rand()-.5)*width*.009;
   const light=i%7===0;
   faceCtx.strokeStyle=light?'rgba(213,184,158,.16)':shade(.48+rand()*.4,.22+rand()*.18);
   faceCtx.lineWidth=Math.max(.45,width*(.0011+rand()*.0018));
   faceCtx.beginPath();faceCtx.moveTo(x,y);faceCtx.quadraticCurveTo(x+dx,y+len*.52,x+dx*.45,y+len);faceCtx.stroke();
  }
 };
 const fillHair=(path,count,minY,maxY,opacity,customPainter=null,mouth=null)=>{
  faceCtx.save();
  faceCtx.beginPath();path();faceCtx.closePath();
  if(mouth)faceCtx.ellipse(mouth.x,mouth.y,mouth.rx,mouth.ry,0,0,Math.PI*2);
  faceCtx.clip(mouth?'evenodd':'nonzero');
  faceCtx.globalCompositeOperation='source-over';
  faceCtx.globalAlpha=beardStyle==='shadow'?.19:(beardStyle==='full'&&beardOverlay.complete&&beardOverlay.naturalWidth?0.10:opacity);
  faceCtx.fillStyle=beardFill;faceCtx.fill();
  faceCtx.globalAlpha=1;
  if(beardStyle==='full'&&beardOverlay.complete&&beardOverlay.naturalWidth&&customPainter){
   faceCtx.globalAlpha=.94;
   faceCtx.save();
   faceCtx.filter='brightness(.52) contrast(1.1) saturate(.72)';
   customPainter();
   faceCtx.restore();
   faceCtx.globalAlpha=1;
  }else texture(count,minY,maxY);
  faceCtx.restore();
 };
 const drawMoustache=()=>{
  if(beardStyle==='full'&&beardOverlay.complete&&beardOverlay.naturalWidth)return;
  const moustache=()=>{
   faceCtx.moveTo(-width*.29,upper.y-height*.04);
   faceCtx.quadraticCurveTo(-width*.15,upper.y-height*.14,0,upper.y-height*.025);
   faceCtx.quadraticCurveTo(width*.15,upper.y-height*.14,width*.29,upper.y-height*.04);
   faceCtx.quadraticCurveTo(width*.23,lower.y+height*.005,width*.07,lower.y-height*.005);
   faceCtx.quadraticCurveTo(0,lower.y+height*.012,-width*.07,lower.y-height*.005);
   faceCtx.quadraticCurveTo(-width*.23,lower.y+height*.005,-width*.29,upper.y-height*.04);
  };
  fillHair(moustache,Math.round(width*.72),upper.y-height*.12,lower.y+height*.008,.42);
 };
 const drawFullBeard=()=>{
  // Warp the beard across tracked cheek, lip, jaw, and chin points while preserving a clear mouth opening.
  const contour=[132,172,136,150,149,176,148,152,377,400,378,379,365,397,361].map(i=>local(pt(landmarks[i])));
  const first=contour[0],last=contour[contour.length-1];
  const drawAdaptiveTexture=()=>{
   const source={
    leftTop:{x:140,y:500},topCenter:{x:627,y:390},rightTop:{x:1114,y:500},
    leftMouth:{x:340,y:600},rightMouth:{x:914,y:600},
    leftJaw:{x:300,y:890},rightJaw:{x:954,y:890},chin:{x:627,y:1050},lowerCenter:{x:627,y:800}
   };
   const target={
    leftTop:contour[0],topCenter:{x:0,y:upper.y-height*.06},rightTop:contour[contour.length-1],
    leftMouth,rightMouth,leftJaw:contour[4],rightJaw:contour[10],chin,
    lowerCenter:{x:0,y:lower.y+(height-lower.y)*.56}
   };
   const triangle=(names)=>{
    const s=names.map(n=>source[n]),t=names.map(n=>target[n]);
    const [s1,s2,s3]=s,[t1,t2,t3]=t;
    const den=s1.x*(s2.y-s3.y)+s2.x*(s3.y-s1.y)+s3.x*(s1.y-s2.y);
    if(Math.abs(den)<1)return;
    const a=(t1.x*(s2.y-s3.y)+t2.x*(s3.y-s1.y)+t3.x*(s1.y-s2.y))/den;
    const c=(t1.x*(s3.x-s2.x)+t2.x*(s1.x-s3.x)+t3.x*(s2.x-s1.x))/den;
    const e=(t1.x*(s2.x*s3.y-s3.x*s2.y)+t2.x*(s3.x*s1.y-s1.x*s3.y)+t3.x*(s1.x*s2.y-s2.x*s1.y))/den;
    const b=(t1.y*(s2.y-s3.y)+t2.y*(s3.y-s1.y)+t3.y*(s1.y-s2.y))/den;
    const d=(t1.y*(s3.x-s2.x)+t2.y*(s1.x-s3.x)+t3.y*(s2.x-s1.x))/den;
    const f=(t1.y*(s2.x*s3.y-s3.x*s2.y)+t2.y*(s3.x*s1.y-s1.x*s3.y)+t3.y*(s1.x*s2.y-s2.x*s1.y))/den;
    faceCtx.save();faceCtx.beginPath();faceCtx.moveTo(t1.x,t1.y);faceCtx.lineTo(t2.x,t2.y);faceCtx.lineTo(t3.x,t3.y);faceCtx.closePath();faceCtx.clip();
    faceCtx.transform(a,b,c,d,e,f);faceCtx.drawImage(beardOverlay,0,0);faceCtx.restore();
   };
   [['leftTop','topCenter','leftMouth'],['topCenter','rightMouth','leftMouth'],['topCenter','rightTop','rightMouth'],
    ['leftTop','leftJaw','leftMouth'],['leftJaw','lowerCenter','leftMouth'],['leftMouth','lowerCenter','rightMouth'],
    ['leftJaw','chin','lowerCenter'],['lowerCenter','chin','rightJaw'],['lowerCenter','rightJaw','rightMouth'],['rightMouth','rightJaw','rightTop']]
    .forEach(triangle);
  };
  const beardShape=()=>{
   faceCtx.moveTo(first.x,first.y);
   for(let i=1;i<contour.length;i++)faceCtx.lineTo(contour[i].x,contour[i].y);
   faceCtx.bezierCurveTo(last.x+(rightMouth.x-last.x)*.38,last.y+(rightMouth.y-last.y)*.18,rightMouth.x+width*.025,upper.y-height*.055,rightMouth.x,upper.y-height*.02);
   faceCtx.quadraticCurveTo(0,upper.y-height*.11,leftMouth.x,upper.y-height*.02);
   faceCtx.bezierCurveTo(leftMouth.x-width*.025,upper.y-height*.055,first.x+(leftMouth.x-first.x)*.38,first.y+(leftMouth.y-first.y)*.18,first.x,first.y);
  };
  fillHair(beardShape,Math.min(560,Math.round(width*2.05)),height*.10,height*.91,beardStyle==='shadow'?.19:.34,beardStyle==='full'?drawAdaptiveTexture:null,beardStyle==='full'?{x:(leftMouth.x+rightMouth.x)/2,y:(upper.y+lower.y)/2,rx:Math.hypot(rightMouth.x-leftMouth.x,rightMouth.y-leftMouth.y)*.52,ry:Math.max(4,Math.abs(lower.y-upper.y)*.8+height*.018)}:null);
  if(beardStyle==='full'){
   // Soft cheek guides replace the hard black outline that made the filter look painted on.
   const cheekLine=()=>{
    const a=contour[0],b=contour[contour.length-1];
    faceCtx.moveTo(a.x,a.y);faceCtx.quadraticCurveTo(leftMouth.x-width*.025,a.y+height*.07,leftMouth.x,lower.y+height*.045);
    faceCtx.moveTo(b.x,b.y);faceCtx.quadraticCurveTo(rightMouth.x+width*.025,b.y+height*.07,rightMouth.x,lower.y+height*.045);
   };
   faceCtx.save();faceCtx.beginPath();cheekLine();faceCtx.strokeStyle=shade(.5,.16);faceCtx.lineWidth=Math.max(.8,width*.004);faceCtx.lineCap='round';faceCtx.stroke();faceCtx.restore();
   if(!(beardOverlay.complete&&beardOverlay.naturalWidth)){
    const chinPatch=()=>{faceCtx.moveTo(-width*.105,lower.y+height*.13);faceCtx.quadraticCurveTo(-width*.075,height*.70,0,height*.96);faceCtx.quadraticCurveTo(width*.075,height*.70,width*.105,lower.y+height*.13);faceCtx.quadraticCurveTo(0,lower.y+height*.19,-width*.105,lower.y+height*.13);};
    fillHair(chinPatch,Math.round(width*.72),lower.y+height*.15,height*.91,.30);
   }
  }
 };
 const drawGoatee=(narrow=false)=>{
  const half=width*(narrow?.15:.20),top=lower.y+height*.07;
  const shape=()=>{
   faceCtx.moveTo(-half,top);
   faceCtx.quadraticCurveTo(-half*1.05,height*.44,0,height*.97);
   faceCtx.quadraticCurveTo(half*1.05,height*.44,half,top);
   faceCtx.quadraticCurveTo(0,top+height*.10,-half,top);
  };
  fillHair(shape,Math.round(width*(narrow?1.05:1.35)),top,height*.92,.40);
 };
 faceCtx.save();faceCtx.translate(origin.x,origin.y);faceCtx.rotate(angle);
 if(beardStyle==='full'||beardStyle==='shadow'){drawFullBeard();drawMoustache();}
 else if(beardStyle==='vandyke'){drawGoatee(true);drawMoustache();}
 else if(beardStyle==='goatee'){drawGoatee(false);drawMoustache();}
 faceCtx.restore();
}
 function releaseCamera(){clearTimeout(recordTimeout);clearInterval(recordTimer);recordTimeout=recordTimer=null;if(faceRaf)cancelAnimationFrame(faceRaf);faceRaf=0;if(recordCanvasStream){recordCanvasStream.getTracks().forEach(track=>track.stop());recordCanvasStream=null;}if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;cameraPreview.srcObject=null;faceCtx.clearRect(0,0,faceCanvas.width,faceCanvas.height);}
 function clearRecording(){if(recordedUrl)URL.revokeObjectURL(recordedUrl);recordedUrl=null;recordedFile=null;recordedPreview.pause();recordedPreview.removeAttribute('src');recordedPreview.load();recordedPreview.hidden=true;recordedDownload.hidden=true;recordedUse.hidden=true;recordedRetry.hidden=true;cameraPreview.hidden=false;}
 async function openCamera(){const token=++session;cameraModal.hidden=false;cameraStatus.textContent='Solicitando acceso a cámara y micrófono…';cameraButton.disabled=true;stopButton.disabled=true;releaseCamera();if(!navigator.mediaDevices?.getUserMedia){cameraStatus.textContent='Abre KLK Clips en Chrome con HTTPS para utilizar la cámara.';return;}
  try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing}},audio:true});if(token!==session||cameraModal.hidden){stream.getTracks().forEach(t=>t.stop());return;}cameraStream=stream;cameraPreview.srcObject=stream;await cameraPreview.play();cameraButton.disabled=false;flipButton.disabled=false;cameraStatus.textContent='Cámara lista. Selecciona la duración y pulsa grabar.';faceRaf=requestAnimationFrame(renderFaceFrame);if(beardStyle!=='none')ensureFaceTracker().catch(()=>{});}
  catch(error){if(token!==session)return;releaseCamera();cameraStatus.textContent=error.name==='NotAllowedError'?'Permite cámara y micrófono en los ajustes del navegador.':'No se pudo abrir la cámara: '+error.message;}}
 function finishRecording(){if(!recording)return;recording=false;clearTimeout(recordTimeout);clearInterval(recordTimer);cameraButton.disabled=true;stopButton.disabled=true;if(recorder?.state==='recording')recorder.stop();}
 $(root,'#clipsRecordChoice').addEventListener('click',()=>{createMenu.hidden=true;clearRecording();openCamera();});
 $(root,'#clipsCameraCancel').addEventListener('click',()=>{++session;cameraModal.hidden=true;if(recording){recording=false;recordChunks=[];if(recorder?.state==='recording')recorder.stop();}releaseCamera();clearRecording();});
 flipButton.addEventListener('click',()=>{if(recording||recordedFile)return;facing=facing==='environment'?'user':'environment';openCamera();});
 cameraButton.addEventListener('click',()=>{if(!cameraStream||!window.MediaRecorder)return void(cameraStatus.textContent='Este navegador no admite grabación integrada.');
  try{recordChunks=[];if(!faceCanvas.captureStream)throw Error('Este navegador no permite grabar la vista con efectos.');recordCanvasStream=faceCanvas.captureStream(30);const recordStream=new MediaStream([...recordCanvasStream.getVideoTracks(),...cameraStream.getAudioTracks()]);const mime=['video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));const activeRecorder=new MediaRecorder(recordStream,mime?{mimeType:mime}:undefined);recorder=activeRecorder;
   activeRecorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data);};
   activeRecorder.onerror=()=>{cameraStatus.textContent='Ocurrió un error durante la grabación.';recording=false;releaseCamera();};
   activeRecorder.onstop=()=>{const chunks=recordChunks.slice();if(cameraModal.hidden||!chunks.length||activeRecorder!==recorder)return;const type=activeRecorder.mimeType||'video/webm',ext=type.includes('mp4')?'mp4':'webm';recordedFile=new File(chunks,'klk-clip-'+Date.now()+'.'+ext,{type});recordedUrl=URL.createObjectURL(recordedFile);releaseCamera();cameraPreview.hidden=true;recordedPreview.src=recordedUrl;recordedPreview.hidden=false;recordedDownload.href=recordedUrl;recordedDownload.download=recordedFile.name;recordedDownload.hidden=false;recordedUse.hidden=false;recordedRetry.hidden=false;cameraStatus.textContent='Grabación terminada. Reproduce, guarda o utiliza tu video.';flipButton.disabled=true;};
   activeRecorder.start(250);recording=true;cameraButton.disabled=true;stopButton.disabled=false;flipButton.disabled=true;const duration=Number($(root,'#clipsRecordDuration').value)||15,started=Date.now();cameraStatus.textContent='Grabando: 0 / '+duration+' s';recordTimer=setInterval(()=>{cameraStatus.textContent='Grabando: '+Math.min(duration,Math.floor((Date.now()-started)/1000))+' / '+duration+' s';},300);recordTimeout=setTimeout(finishRecording,duration*1000);
  }catch(error){cameraStatus.textContent='No se pudo iniciar la grabación: '+error.message;}});
 stopButton.addEventListener('click',finishRecording);
 recordedRetry.addEventListener('click',()=>{clearRecording();openCamera();});
 recordedUse.addEventListener('click',()=>{if(!recordedFile)return;const dt=new DataTransfer();dt.items.add(recordedFile);$(root,'#clipsFile').files=dt.files;cameraModal.hidden=true;++session;releaseCamera();clearRecording();modal.hidden=false;$(root,'#clipsFormError').textContent='';});
 $(root,'#clipsCameraFile').addEventListener('change',event=>{const file=event.target.files?.[0];if(!file)return;const transfer=new DataTransfer();transfer.items.add(file);$(root,'#clipsFile').files=transfer.files;event.target.value='';createMenu.hidden=true;modal.hidden=false;$(root,'#clipsFormError').textContent='';});
 function close(m){m.hidden=true;}
 $(root,'#clipsClose').addEventListener('click',()=>close(modal));
 $(root,'#clipsCommentsClose').addEventListener('click',()=>close(commentsModal));
 function selectedStudioClip(){const i=Number($(root,'#clipsEditSelect').value);return Number.isInteger(i)?clips[i]:null;}
 function updateStudio(){const stats=$(root,'#clipsStudioStats');stats.textContent=clips.length+' clips de prueba · '+clips.filter(c=>c.liked).length+' Me gusta · '+clips.reduce((n,c)=>n+c.comments.length,0)+' comentarios';const select=$(root,'#clipsEditSelect');select.replaceChildren();clips.forEach((c,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=(i+1)+'. '+(c.description||'Sin descripción');select.append(opt);});loadStudio();}
 function loadStudio(){const c=selectedStudioClip();for(const id of ['clipsEditDescription','clipsTrimStart','clipsTrimEnd','clipsEditSpeed'])$(root,'#'+id).disabled=!c;if(!c)return;$(root,'#clipsEditDescription').value=c.description;$(root,'#clipsTrimStart').value=c.trimStart||0;$(root,'#clipsTrimEnd').value=c.trimEnd||60;$(root,'#clipsEditSpeed').value=String(c.speed||1);}
 $(root,'#clipsStudio').addEventListener('click',()=>{updateStudio();studio.hidden=false;});
 $(root,'#clipsStudioClose').addEventListener('click',()=>close(studio));
 $(root,'#clipsEditSelect').addEventListener('change',loadStudio);
 $(root,'#clipsSaveEdit').addEventListener('click',()=>{const c=selectedStudioClip();if(!c)return notify('Primero añade un clip.');const start=Number($(root,'#clipsTrimStart').value),end=Number($(root,'#clipsTrimEnd').value),speed=Number($(root,'#clipsEditSpeed').value);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>60||end<=start||![.75,1,1.25,1.5,2].includes(speed))return notify('Revisa el inicio, fin y velocidad.');c.trimStart=start;c.trimEnd=end;c.speed=speed;c.description=$(root,'#clipsEditDescription').value.trim();render();notify('Ajustes guardados en esta sesión de prueba.');});
 $(root,'#clipsCover').addEventListener('click',()=>{const c=selectedStudioClip();if(!c)return notify('Primero añade un clip.');const v=document.createElement('video');v.src=c.url;v.muted=true;v.playsInline=true;v.preload='auto';v.addEventListener('loadedmetadata',()=>{v.currentTime=Math.min(c.trimStart||0,Math.max(0,v.duration-.1));});v.addEventListener('seeked',()=>{try{const canvas=document.createElement('canvas');canvas.width=Math.min(v.videoWidth,720);canvas.height=Math.round(canvas.width*v.videoHeight/v.videoWidth);canvas.getContext('2d').drawImage(v,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{if(!blob)return notify('No se pudo crear la portada.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='klk-clips-portada.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('Portada generada para descargar.');},'image/png');}catch{notify('Este video no permite extraer una portada.');}v.removeAttribute('src');v.load();},{once:true});});
 $(root,'#clipsDelete').addEventListener('click',()=>{const i=Number($(root,'#clipsEditSelect').value);if(!clips[i])return;URL.revokeObjectURL(clips[i].url);clips.splice(i,1);index=0;updateStudio();render();notify('Clip quitado de la demo.');});
 [modal,commentsModal,studio].forEach(m=>m.addEventListener('click',e=>{if(e.target===m)close(m);}));
 $(root,'#clipsAdd').addEventListener('click',()=>{
  const file=$(root,'#clipsFile').files[0],err=$(root,'#clipsFormError');err.textContent='';
  if(!file||!file.type.startsWith('video/')){err.textContent='Selecciona un archivo de video válido.';return;}
  if(file.size>600*1024*1024){err.textContent='Para esta demo selecciona un video de menos de 600 MB.';return;}
  const url=URL.createObjectURL(file),probe=document.createElement('video');probe.preload='metadata';probe.src=url;
  probe.onloadedmetadata=()=>{if(!Number.isFinite(probe.duration)||probe.duration>600){URL.revokeObjectURL(url);err.textContent='El video debe durar como máximo 10 minutos.';return;}
   clips.push({url,author:'KLKManin',description:$(root,'#clipsDescriptionInput').value.trim(),liked:false,comments:[],trimStart:0,trimEnd:Math.min(600,probe.duration),speed:1});feed='foryou';index=clips.length-1;$(root,'#clipsFile').value='';$(root,'#clipsDescriptionInput').value='';close(modal);setFeed('foryou');index=clips.length-1;render();notify('Video añadido solo a esta demo. No se ha publicado.');};
  probe.onerror=()=>{URL.revokeObjectURL(url);err.textContent='No se pudo abrir este video.';};
 });
 function setFeed(value){feed=value;index=0;root.querySelectorAll('[data-feed]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.feed===feed)));render();}
 root.querySelectorAll('[data-feed]').forEach(b=>b.addEventListener('click',()=>setFeed(b.dataset.feed)));
 $(root,'.clipsNext').addEventListener('click',()=>next(1));
 stage.addEventListener('touchstart',e=>{startY=e.touches[0]?.clientY??null;},{passive:true});
 stage.addEventListener('touchend',e=>{if(startY===null)return;const d=(e.changedTouches[0]?.clientY??startY)-startY;startY=null;if(Math.abs(d)>55)next(d<0?1:-1);},{passive:true});
 stage.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();next(1);}if(e.key==='ArrowUp'){e.preventDefault();next(-1);}});
 root.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{
  const clip=current().clip;if(!clip)return;switch(b.dataset.action){
   case 'sound':{const v=media.querySelector('video');if(v){v.muted=!v.muted;b.textContent=v.muted?'🔇':'🔊';notify(v.muted?'Sonido desactivado.':'Sonido activado.');}break;}
   case 'like':clip.liked=!clip.liked;render();notify(clip.liked?'Me gusta guardado solo en la demo.':'Me gusta retirado.');break;
   case 'follow':if(following.has(clip.author))following.delete(clip.author);else following.add(clip.author);render();notify('Seguimiento de prueba actualizado.');break;
   case 'comment':commentsModal.hidden=false;renderComments(clip);$(root,'#clipsCommentInput').focus();break;
   case 'share':if(navigator.share){navigator.share({title:'KLK Clips — prototipo',text:'Conoce la demo de KLK Clips',url:location.href}).catch(()=>{});}else notify('Puedes copiar el enlace de esta demo desde el navegador.');break;
   case 'report':notify('Denuncias de prueba: aún no se envían al servidor.');break;
  }
 }));
 function renderComments(clip){const list=$(root,'#clipsCommentsList');list.replaceChildren();if(!clip.comments.length)list.textContent='Todavía no hay comentarios.';clip.comments.forEach(t=>{const p=document.createElement('p');p.textContent=t;list.append(p);});}
 $(root,'#clipsCommentSend').addEventListener('click',()=>{const clip=current().clip,t=$(root,'#clipsCommentInput').value.trim();if(!clip||!t)return;clip.comments.push(t);$(root,'#clipsCommentInput').value='';renderComments(clip);notify('Comentario guardado solo en esta demo.');});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close(modal);close(commentsModal);close(studio);}});
 window.addEventListener('pagehide',()=>{if(toastTimer)clearTimeout(toastTimer);if(faceRaf)cancelAnimationFrame(faceRaf);faceTracker?.close();clips.forEach(c=>URL.revokeObjectURL(c.url));},{once:true});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
