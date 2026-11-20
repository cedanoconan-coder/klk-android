/* Cámara de estados KLK con efecto de iris y seguimiento facial opcional. */
(function(){
 'use strict';
 function init(){
  const trigger=document.getElementById('statusCameraButton'),input=document.getElementById('statusPhoto');
  if(!trigger||!input||document.getElementById('klkStatusCamera'))return;
  const panel=document.createElement('div');panel.id='klkStatusCamera';
  panel.innerHTML='<div class="klkCameraBar"><button type="button" data-cam="close">✕ Cerrar</button><strong>Cámara de estados</strong><button type="button" data-cam="flash" aria-label="Flash apagado" title="Flash apagado">⚡ Off</button><button type="button" data-cam="flip" aria-label="Cambiar cámara">↻</button></div><div class="klkCameraPreview"><video autoplay playsinline muted></video><canvas aria-label="Vista previa de la cámara con efecto"></canvas><div class="klkRecordTimer" role="timer" aria-live="off"><span class="klkRecordDot"></span><span class="klkRecordClock">00:00</span><span class="klkRecordMax">/ 00:30</span></div><div class="klkRecordProgress"><span></span></div></div><div class="klkCameraMessage">Toca para foto · Mantén pulsado para grabar video</div><div class="klkCameraEffects"><button type="button" data-cam="effects" aria-expanded="false">✨ Efectos selfie</button><div class="klkCameraEffectsPanel" hidden><div class="klkEffectCategories" role="tablist" aria-label="Categorías de efectos"><button type="button" role="tab" data-effect-tab="eyes" aria-selected="true">Ojos</button><button type="button" role="tab" data-effect-tab="beauty" aria-selected="false">Belleza</button><button type="button" role="tab" data-effect-tab="filters" aria-selected="false">Filtros</button><button type="button" role="tab" data-effect-tab="face" aria-selected="false">Rostro</button><button type="button" role="tab" data-effect-tab="men" hidden disabled aria-selected="false">Hombres</button><button type="button" role="tab" data-effect-tab="creative" aria-selected="false">Creativos</button></div><section class="klkEffectGroup" data-effect-category="eyes"><strong>Color de ojos</strong><div class="klkEffectChoices"><button type="button" data-eye-color="blue" aria-pressed="false">Azul</button><button type="button" data-eye-color="green" aria-pressed="false">Verde</button><button type="button" data-eye-color="hazel" aria-pressed="false">Miel</button><button type="button" data-eye-color="violet" aria-pressed="false">Violeta</button><button type="button" data-eye-color="gray" aria-pressed="false">Gris</button><button type="button" data-eye-color="none" class="active" aria-pressed="true">Natural</button></div><label>Intensidad de ojos <input data-eye-strength type="range" min="0" max="100" value="75" aria-label="Intensidad del color de ojos"></label></section><section class="klkEffectGroup" data-effect-category="filters" hidden><strong>Filtro selfie</strong><div class="klkEffectChoices"><button type="button" data-selfie-filter="normal" class="active" aria-pressed="true">Natural</button><button type="button" data-selfie-filter="warm" aria-pressed="false">Cálido</button><button type="button" data-selfie-filter="cool" aria-pressed="false">Frío</button><button type="button" data-selfie-filter="glow" aria-pressed="false">Brillo</button><button type="button" data-selfie-filter="vintage" aria-pressed="false">Vintage</button><button type="button" data-selfie-filter="mono" aria-pressed="false">B&N</button></div><label>Intensidad del filtro <input data-filter-strength type="range" min="0" max="100" value="65" aria-label="Intensidad del filtro selfie"></label></section><section class="klkEffectGroup" data-effect-category="beauty" hidden><strong>Suavizado de piel</strong><div class="klkEffectChoices"><button type="button" data-skin-preset="0" class="active" aria-pressed="true">Natural</button><button type="button" data-skin-preset="35" aria-pressed="false">Suave</button><button type="button" data-skin-preset="65" aria-pressed="false">Limpia</button><button type="button" data-skin-preset="85" aria-pressed="false">Luz suave</button></div><label>Intensidad de piel <input data-skin-strength type="range" min="0" max="100" value="0" aria-label="Intensidad del suavizado de piel"></label><small>Suaviza textura manteniendo visibles los rasgos.</small></section><section class="klkEffectGroup" data-effect-category="face" hidden><strong>Maquillaje con seguimiento facial</strong><div class="klkEffectChoices"><button type="button" data-face-look="none" class="active" aria-pressed="true">Natural</button><button type="button" data-face-look="blush" aria-pressed="false">Rubor</button><button type="button" data-face-look="freckles" aria-pressed="false">Pecas</button><button type="button" data-face-look="lipstick" aria-pressed="false">Labios</button><button type="button" data-face-look="glam" aria-pressed="false">Glam</button><button type="button" data-face-look="golden" aria-pressed="false">Dorado</button></div><label>Intensidad del maquillaje <input data-face-strength type="range" min="0" max="100" value="80" aria-label="Intensidad del maquillaje facial"></label><small>Los detalles siguen los rasgos de tu cara en vivo y también salen en la foto o el video.</small></section><section class="klkEffectGroup" data-effect-category="men" hidden aria-hidden="true"><strong>Barbas y bigotes con seguimiento facial</strong><div class="klkEffectChoices"><button type="button" data-man-look="none" class="active" aria-pressed="true">Natural</button><button type="button" data-man-look="stubble" aria-pressed="false">3 días</button><button type="button" data-man-look="short" aria-pressed="false">Barba corta</button><button type="button" data-man-look="goatee" aria-pressed="false">Candado</button><button type="button" data-man-look="mustache" aria-pressed="false">Bigote</button><button type="button" data-man-look="full" aria-pressed="false">Completa</button></div><label>Intensidad de barba <input data-man-strength type="range" min="0" max="100" value="82" aria-label="Intensidad de la barba o el bigote"></label><small>El vello se dibuja sobre la mandíbula y alrededor de la boca; acompaña el movimiento de tu cara.</small></section><section class="klkEffectGroup" data-effect-category="creative" hidden><strong>Looks creativos</strong><div class="klkEffectChoices"><button type="button" data-selfie-filter="rose" aria-pressed="false">Rosa</button><button type="button" data-selfie-filter="cinematic" aria-pressed="false">Cine</button><button type="button" data-selfie-filter="dream" aria-pressed="false">Sueño</button><button type="button" data-selfie-filter="vivid" aria-pressed="false">Vibrante</button></div><label>Intensidad del look <input data-filter-strength type="range" min="0" max="100" value="65" aria-label="Intensidad del look creativo"></label></section></div></div><div class="klkCameraBar klkShutterBar"><button type="button" class="klkShutter" data-cam="shutter" aria-label="Tocar para foto, mantener pulsado para video"><span class="klkShutterLogo" aria-hidden="true">KLK</span></button></div>';
  const effectStyle=document.createElement('style');effectStyle.textContent=`
#klkStatusCamera{position:fixed!important;inset:0!important;z-index:2147483000!important;width:100vw!important;height:100vh!important;height:100dvh!important;box-sizing:border-box!important;background:#050608!important;color:#fff!important;overflow:hidden!important}
#klkStatusCamera.open{display:block!important}
#klkStatusCamera .klkCameraPreview{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;border:0!important;border-radius:0!important;background:#101114!important;overflow:hidden!important;z-index:0!important}
#klkStatusCamera .klkCameraPreview video,#klkStatusCamera .klkCameraPreview canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:0!important}
#klkStatusCamera .klkCameraPreview video{z-index:0!important}
#klkStatusCamera .klkCameraPreview canvas{z-index:1!important}
#klkStatusCamera .klkCameraBar{position:absolute!important;left:0!important;right:0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:12px 18px!important;background:transparent!important;border:0!important;z-index:5!important}
#klkStatusCamera .klkCameraBar:first-child{top:env(safe-area-inset-top,0px)!important}
#klkStatusCamera .klkCameraBar:first-child strong{font-size:17px!important;font-weight:700!important;text-shadow:0 1px 5px #000!important}
#klkStatusCamera .klkCameraBar button:not(.klkShutter){min-width:48px!important;min-height:48px!important;border:0!important;border-radius:28px!important;background:rgba(20,21,25,.58)!important;color:#fff!important;backdrop-filter:blur(14px)!important}
#klkStatusCamera .klkCameraMessage{position:absolute!important;top:calc(env(safe-area-inset-top,0px) + 76px)!important;left:50%!important;transform:translateX(-50%)!important;z-index:4!important;width:max-content!important;max-width:86vw!important;padding:8px 13px!important;border-radius:20px!important;background:rgba(0,0,0,.42)!important;color:#fff!important;font-size:13px!important;text-align:center!important;backdrop-filter:blur(12px)!important}
#klkStatusCamera .klkRecordTimer,#klkStatusCamera .klkRecordProgress{z-index:3!important}
#klkStatusCamera .klkCameraEffects{position:absolute!important;left:0!important;right:0!important;bottom:calc(env(safe-area-inset-bottom,0px) + 106px)!important;z-index:8!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:10px!important}
#klkStatusCamera [data-cam="effects"]{border:0!important;border-radius:24px!important;padding:10px 18px!important;background:rgba(28,29,34,.78)!important;color:#fff!important;font-weight:700!important;backdrop-filter:blur(16px)!important}
#klkStatusCamera .klkCameraEffectsPanel{position:relative!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:12px!important;width:calc(100vw - 28px)!important;max-height:38dvh!important;overflow-y:auto!important;box-sizing:border-box!important;padding:14px!important;border-radius:22px!important;background:rgba(22,23,28,.92)!important;backdrop-filter:blur(22px)!important}
#klkStatusCamera .klkCameraEffectsPanel[hidden]{display:none!important}
#klkStatusCamera .klkEffectCategories{display:flex!important;gap:6px!important;overflow-x:auto!important;scrollbar-width:none!important;border-bottom:1px solid rgba(255,255,255,.12)!important;padding-bottom:10px!important}
#klkStatusCamera .klkEffectCategories button{flex:0 0 auto!important;border:0!important;border-radius:18px!important;padding:8px 11px!important;background:transparent!important;color:#c8c8d0!important;font-size:12px!important;font-weight:700!important}
#klkStatusCamera .klkEffectCategories button[aria-selected="true"]{background:#fff!important;color:#17181b!important}
#klkStatusCamera .klkEffectGroup{display:grid!important;gap:10px!important;text-align:left!important}
#klkStatusCamera .klkEffectGroup[hidden]{display:none!important}
#klkStatusCamera .klkEffectGroup>strong{font-size:13px!important;color:#e8e8ee!important}#klkStatusCamera .klkEffectGroup small{color:#b9bac2!important;font-size:11px!important}
#klkStatusCamera .klkEffectChoices{display:flex!important;flex-wrap:nowrap!important;gap:9px!important;overflow-x:auto!important;overscroll-behavior-x:contain!important;padding:2px 1px 6px!important;scrollbar-width:none!important}
#klkStatusCamera .klkEffectChoices::-webkit-scrollbar{display:none!important}
#klkStatusCamera .klkEffectChoices button{flex:0 0 auto!important;min-width:66px!important;min-height:54px!important;padding:9px 12px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:18px!important;background:rgba(255,255,255,.1)!important;color:#fff!important;font-size:12px!important;font-weight:700!important}
#klkStatusCamera .klkEffectChoices button.active{background:#1769db!important;border-color:#4e9bff!important}
#klkStatusCamera .klkEffectChoices [data-eye-color]::before{content:""!important;display:block!important;width:14px!important;height:14px!important;margin:0 auto 5px!important;border-radius:50%!important;background:var(--eye-swatch,#888)!important}
#klkStatusCamera .klkEffectGroup label{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;color:#eee!important;font-size:13px!important}
#klkStatusCamera .klkEffectGroup input{width:min(42vw,170px)!important;accent-color:#1683ff!important}
#klkStatusCamera .klkShutterBar{top:auto!important;bottom:calc(env(safe-area-inset-bottom,0px) + 14px)!important;justify-content:center!important;padding:8px!important}
#klkStatusCamera .klkShutter{display:grid!important;place-items:center!important;width:78px!important;height:78px!important;padding:5px!important;border:4px solid #fff!important;border-radius:50%!important;background:rgba(255,255,255,.2)!important;box-shadow:0 0 0 3px rgba(0,0,0,.45)!important}
#klkStatusCamera .klkShutterLogo{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;border-radius:50%!important;background:#fff!important;color:#111!important;font-size:17px!important;font-weight:900!important}
#klkStatusCamera .klkShutter.recording{border-color:#ff4055!important}
@media(max-height:700px){#klkStatusCamera .klkCameraEffects{bottom:calc(env(safe-area-inset-bottom,0px) + 88px)!important}#klkStatusCamera .klkCameraEffectsPanel{max-height:32dvh!important}#klkStatusCamera .klkShutter{width:68px!important;height:68px!important}}
`;document.head.appendChild(effectStyle);
  document.body.appendChild(panel);
  const video=panel.querySelector('video'),canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d'),message=panel.querySelector('.klkCameraMessage'),shutter=panel.querySelector('[data-cam="shutter"]'),effectsButton=panel.querySelector('[data-cam="effects"]'),effectsPanel=panel.querySelector('.klkCameraEffectsPanel'),eyeStrengthInput=panel.querySelector('[data-eye-strength]'),filterStrengthInput=panel.querySelector('[data-filter-strength]'),skinStrengthInput=panel.querySelector('[data-skin-strength]'),faceStrengthInput=panel.querySelector('[data-face-strength]'),manStrengthInput=panel.querySelector('[data-man-strength]'),timerDisplay=panel.querySelector('.klkRecordTimer'),clock=panel.querySelector('.klkRecordClock'),progress=panel.querySelector('.klkRecordProgress span');

// Carrusel de efectos siempre visible: la opción central se aplica al tocar o deslizar.
  const carousel=document.createElement('div');carousel.className='klkEffectCarousel';carousel.setAttribute('aria-label','Efectos de cámara');
  // Each circle selects one distinct, currently supported effect.
  // Beard options remain absent until Android validation.
  const choices=[
    ['Natural','✨','[data-eye-color="none"]'],
    ['Ojos azules','🔵','[data-eye-color="blue"]'],
    ['Ojos verdes','🟢','[data-eye-color="green"]'],
    ['Ojos miel','🟤','[data-eye-color="hazel"]'],
    ['Ojos violeta','🟣','[data-eye-color="violet"]'],
    ['Ojos grises','⚪','[data-eye-color="gray"]'],
    ['Piel suave','💫','[data-skin-preset="35"]'],
    ['Piel limpia','🌟','[data-skin-preset="65"]'],
    ['Luz suave','☁️','[data-skin-preset="85"]'],
    ['Cálido','☀️','[data-selfie-filter="warm"]'],
    ['Frío','❄️','[data-selfie-filter="cool"]'],
    ['Brillo','✨','[data-selfie-filter="glow"]'],
    ['Vintage','📷','[data-selfie-filter="vintage"]'],
    ['Blanco y negro','◐','[data-selfie-filter="mono"]'],
    ['Cine','🎬','[data-selfie-filter="cinematic"]'],
    ['Rosa','🌸','[data-selfie-filter="rose"]'],
    ['Sueño','🌙','[data-selfie-filter="dream"]'],
    ['Vibrante','🎨','[data-selfie-filter="vivid"]'],
    ['Pecas','🌼','[data-face-look="freckles"]'],
    ['Rubor','🌷','[data-face-look="blush"]'],
    ['Labios','💄','[data-face-look="lipstick"]'],
    ['Glam','💎','[data-face-look="glam"]'],
    ['Dorado','🌞','[data-face-look="golden"]']
  ];
  const beardPresets=globalThis.KLKBeardStyles?.all||[];
  beardPresets.forEach(style=>choices.push([style.name,'🧔','[data-beard-preset="'+style.id+'"]']));
  const beardControls=document.createElement('div');
  beardControls.hidden=true;
  beardPresets.forEach(style=>{const button=document.createElement('button');button.type='button';button.dataset.beardPreset=style.id;beardControls.appendChild(button)});
  panel.appendChild(beardControls);
  let selectedEffect=0;
  const buttons=choices.map(([label,emoji,selector],index)=>{
    const button=document.createElement('button');button.type='button';button.className='klkEffectThumb';
    button.innerHTML='<span class="klkEffectCircle">'+emoji+'</span><small>'+label+'</small>';
    button.setAttribute('aria-label','Aplicar efecto '+label);
    button.addEventListener('click',()=>selectEffect(index));
    carousel.appendChild(button);return button;
  });
  function selectEffect(index){
    selectedEffect=(index+choices.length)%choices.length;
    buttons.forEach((button,i)=>{button.classList.toggle('selected',i===selectedEffect);button.setAttribute('aria-pressed',String(i===selectedEffect))});
    buttons[selectedEffect].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    // Clear previous category so one circle means one effect, not stacked effects.
    const selector=choices[selectedEffect][2];
    if(!selector.startsWith('[data-beard-preset=')){manLook='none';window.KLKBeardMask?.setEnabled(false);}
    if(!selector.startsWith('[data-eye-color='))panel.querySelector('[data-eye-color="none"]')?.click();
    if(!selector.startsWith('[data-skin-preset='))panel.querySelector('[data-skin-preset="0"]')?.click();
    if(!selector.startsWith('[data-selfie-filter='))panel.querySelector('[data-selfie-filter="normal"]')?.click();
    if(!selector.startsWith('[data-face-look='))panel.querySelector('[data-face-look="none"]')?.click();
    const target=panel.querySelector(selector);if(target)target.click();
  }
  // Native horizontal scroll is used; no synthetic swipe selection or prevented touch events.
  panel.querySelector('.klkCameraEffects').prepend(carousel);
  buttons[0].classList.add('selected');buttons[0].setAttribute('aria-pressed','true');
  const carouselStyle=document.createElement('style');
  carouselStyle.textContent=`
#klkStatusCamera .klkCameraEffects{bottom:calc(env(safe-area-inset-bottom,0px) + 112px)!important;pointer-events:none}
#klkStatusCamera .klkEffectCarousel{pointer-events:auto;display:flex;align-items:center;gap:13px;width:100%;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding:14px calc(50vw - 44px) 8px;box-sizing:border-box}
#klkStatusCamera .klkEffectCarousel::-webkit-scrollbar{display:none}
#klkStatusCamera .klkEffectThumb{scroll-snap-align:center;flex:0 0 72px;min-width:72px;display:flex;flex-direction:column;align-items:center;gap:5px;background:transparent!important;color:white!important;padding:0!important;border:0!important}
#klkStatusCamera .klkEffectCircle{display:grid;place-items:center;width:66px;height:66px;border-radius:50%;background:linear-gradient(135deg,#4d375c,#13131b);border:2px solid #ffffff80;font-size:30px;box-shadow:0 2px 10px #0009}
#klkStatusCamera .klkEffectThumb.selected .klkEffectCircle{border:4px solid white;box-shadow:0 0 0 3px #a64ef5,0 2px 14px #000}
#klkStatusCamera .klkEffectThumb small{font-size:11px;color:#fff;text-shadow:0 1px 5px #000}
#klkStatusCamera [data-cam="effects"]{display:none!important}
#klkStatusCamera .klkCameraEffectsPanel{display:none!important}
#klkStatusCamera .klkCameraBar:first-child strong{font-size:15px!important}
#klkStatusCamera .klkCameraMessage{top:auto!important;bottom:calc(env(safe-area-inset-bottom,0px) + 204px)!important;font-size:11px!important}
#klkStatusCamera .klkShutter{width:76px!important;height:76px!important}
`;
  document.head.appendChild(carouselStyle);
  let stream=null,outputStream=null,recorder=null,chunks=[],front=true,recordTimer=null,holdTimer=null,pressed=false,recordingByHold=false,discardRecording=false,elapsedTimer=null,recordStartedAt=0,renderFrame=0,landmarker=null,landmarkerPromise=null,visionFiles=null,visionPromise=null,facePoints=null,smoothedFacePoints=null,lastFaceSeenAt=0,lastDetection=0,lastBeardNotice=0,lastFaceDiagnostic='',lastFaceErrorAt=0,faceDetectionAttempts=0,eyeColor='none',selfieFilter='normal',skinSmooth=0,faceLook='none',manLook='none',beardTexture=null,beardTexturePromise=null,closed=false;
  const eyePalettes={blue:['5,33,71','20,103,190','71,190,245','12,93,160','3,25,52'],green:['12,55,32','26,129,76','105,205,126','26,112,66','7,43,27'],hazel:['75,38,12','156,94,30','219,174,75','139,91,34','54,31,14'],violet:['48,21,76','112,62,168','190,145,239','99,55,151','35,18,58'],gray:['29,44,55','88,124,143','190,211,218','90,123,138','30,44,52']};
  const selfieFilters={normal:t=>'none',warm:t=>`sepia(${.22*t}) saturate(${1+.25*t}) brightness(${1+.035*t})`,cool:t=>`hue-rotate(${18*t}deg) saturate(${1+.12*t}) brightness(${1+.025*t})`,glow:t=>`brightness(${1+.12*t}) saturate(${1+.16*t}) contrast(${1-.05*t})`,vintage:t=>`sepia(${.42*t}) contrast(${1+.08*t}) saturate(${1-.18*t})`,mono:t=>`grayscale(${t}) contrast(${1+.12*t})`,rose:t=>`hue-rotate(-12deg) saturate(${1+.42*t}) brightness(${1+.035*t})`,cinematic:t=>`contrast(${1+.22*t}) saturate(${1-.12*t}) brightness(${1-.035*t}) sepia(${.08*t})`,dream:t=>`saturate(${1+.18*t}) brightness(${1+.12*t}) contrast(${1-.12*t})`,vivid:t=>`saturate(${1+.72*t}) contrast(${1+.12*t}) brightness(${1+.025*t})`};
  const eyeContours=[[33,160,158,133,153,144],[362,385,387,263,373,380]];
  function resetElapsed(){clearInterval(elapsedTimer);elapsedTimer=null;timerDisplay.classList.remove('visible');progress.parentElement.style.display='none';progress.style.width='0%';clock.textContent='00:00'}
  function updateElapsed(){const seconds=Math.min(30,Math.floor((performance.now()-recordStartedAt)/1000));clock.textContent='00:'+String(seconds).padStart(2,'0');progress.style.width=Math.min(100,(performance.now()-recordStartedAt)/30000*100)+'%'}
  function stopOutput(){if(outputStream)outputStream.getTracks().forEach(track=>track.stop());outputStream=null}
  function stopStream(){window.KLKBeardMask?.setEnabled(false);window.KLKStatusFaceBridge?.stop();cancelAnimationFrame(renderFrame);renderFrame=0;stopOutput();if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;facePoints=null}
  function close(){closed=true;clearTimeout(holdTimer);pressed=false;discardRecording=true;if(recorder&&recorder.state==='recording')recorder.stop();clearTimeout(recordTimer);resetElapsed();panel.classList.remove('open');stopStream()}
  async function loadVision(){if(visionFiles)return visionFiles;if(!visionPromise)visionPromise=(async()=>{const vision=await import('./klk-face-assets/vision_bundle.mjs');visionFiles=await vision.FilesetResolver.forVisionTasks('./klk-face-assets/wasm');return vision})().catch(error=>{visionPromise=null;throw error});return visionPromise}
  let lastFaceTransform=null,lastFaceBlendshapes=null;
  async function ensureLandmarker(){if(landmarker)return landmarker;if(!landmarkerPromise)landmarkerPromise=(async()=>{const vision=await loadVision();landmarker=await vision.FaceLandmarker.createFromOptions(visionFiles,{baseOptions:{modelAssetPath:'./klk-face-assets/face_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true});return landmarker})().catch(error=>{landmarkerPromise=null;throw error});return landmarkerPromise}
  async function start(){
   stopStream();resetFaceTracker();closed=false;shutter.disabled=false;
   const desired=front?'user':'environment';
   const devices=await navigator.mediaDevices.enumerateDevices().catch(()=>[]);
   const cameras=devices.filter(device=>device.kind==='videoinput');
   const matcher=desired==='user'?/front|frontal|selfie|user|face|facing front/i:/back|rear|trasera|environment|facing back/i;
   const match=cameras.find(device=>matcher.test(device.label));
   const attempts=[
    {facingMode:{exact:desired}},
    ...(match?.deviceId?[{deviceId:{exact:match.deviceId}}]:[]),
    {facingMode:{ideal:desired}}
   ];
   let lastError=null,selected=null;
   for(const constraint of attempts){
    try{
     const candidate=await navigator.mediaDevices.getUserMedia({audio:false,video:constraint});
     const track=candidate.getVideoTracks()[0];
     const settings=track?.getSettings?.()||{};
     const label=track?.label||'';
     const actual=settings.facingMode;
     const wrongFacing=actual&&actual!==desired;
     const wrongLabel=matcher.test(label)===false&&/(front|frontal|selfie|user|back|rear|trasera|environment)/i.test(label);
     if(wrongFacing||wrongLabel){candidate.getTracks().forEach(t=>t.stop());lastError=new Error('Android devolvió otra lente: '+(label||actual));continue}
     stream=candidate;selected={label:label||'Sin nombre',facing:actual||'no informado',deviceId:settings.deviceId||'no informado'};
     break;
    }catch(error){lastError=error}
   }
   if(!stream)throw lastError||new Error('No se pudo seleccionar la lente '+desired);
   video.srcObject=stream;
   video.style.transform=front?'scaleX(-1)':'none';
   canvas.style.transform=front?'scaleX(-1)':'none';
   await video.play();
   const status=front?'Frontal':'Trasera';
   message.textContent=status+' · '+selected.label+' · orientación: '+selected.facing;
   render();
  }
  function resetFaceTracker(){facePoints=null;smoothedFacePoints=null;lastFaceSeenAt=0}
  function reportFaceDiagnostic(text,now=performance.now()){
    lastFaceDiagnostic=text;
    if(manLook!=='none'&&now-lastBeardNotice>1600){message.textContent=text;lastBeardNotice=now}
  }
  function updateFaceTracker(detected,now){
   if(!detected||detected.length<468){if(lastFaceSeenAt&&now-lastFaceSeenAt>(manLook!=='none'?120:450))resetFaceTracker();if(manLook!=='none'&&(!lastFaceSeenAt||now-lastFaceSeenAt>1200)&&now-lastBeardNotice>3000){reportFaceDiagnostic('Detector activo · rostro no reconocido. Centra el rostro y mantén buena luz.',now)}return}
   const next=detected.map(point=>({x:point.x,y:point.y,z:point.z||0}));
   if(!smoothedFacePoints||smoothedFacePoints.length!==next.length||now-lastFaceSeenAt>450){smoothedFacePoints=next;facePoints=smoothedFacePoints;lastFaceSeenAt=now;return}
   const anchors=[1,33,133,152,263,362];let movement=0,count=0;
   for(const id of anchors){if(!next[id]||!smoothedFacePoints[id])continue;movement+=Math.hypot(next[id].x-smoothedFacePoints[id].x,next[id].y-smoothedFacePoints[id].y);count++}
   movement=count?movement/count:0;
   // Beard must follow current jaw/cheek landmarks with minimal temporal lag.
   // Strong smoothing at 14 FPS made the beard visibly slide behind head movement.
   const alpha=manLook!=='none'?(movement>.002?.98:.88):(movement>.12?.96:Math.max(.24,Math.min(.88,.24+movement*22)));
   for(let i=0;i<next.length;i++){const current=next[i],previous=smoothedFacePoints[i];if(!previous){smoothedFacePoints[i]=current;continue}previous.x+=(current.x-previous.x)*alpha;previous.y+=(current.y-previous.y)*alpha;previous.z+=(current.z-previous.z)*alpha}
   facePoints=smoothedFacePoints;lastFaceSeenAt=now;
  }
  function eyePoint(id){return[facePoints[id].x*canvas.width,facePoints[id].y*canvas.height]}
  function drawIris(centerId,ringId,contour,alpha,palette){
   if(!facePoints||facePoints.length<=477)return;const center=eyePoint(centerId),outer=eyePoint(ringId),inner=eyePoint(ringId+2),radius=Math.max(2,Math.hypot(outer[0]-center[0],outer[1]-center[1])),pupil=Math.max(radius*.31,Math.hypot(inner[0]-center[0],inner[1]-center[1])*.31);
   ctx.save();ctx.beginPath();contour.forEach((id,index)=>{const[x,y]=eyePoint(id);index?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.clip();ctx.translate(...center);ctx.rotate(Math.atan2(outer[1]-center[1],outer[0]-center[0]));ctx.scale(1,.92);ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.clip();
   const iris=ctx.createRadialGradient(0,0,pupil*.72,0,0,radius);iris.addColorStop(0,`rgba(${palette[0]},.88)`);iris.addColorStop(.3,`rgba(${palette[1]},.88)`);iris.addColorStop(.7,`rgba(${palette[2]},.9)`);iris.addColorStop(.92,`rgba(${palette[3]},.9)`);iris.addColorStop(1,`rgba(${palette[4]},.92)`);ctx.globalAlpha=alpha;ctx.fillStyle=iris;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
   for(let i=0;i<32;i++){const angle=i*Math.PI*2/32;ctx.strokeStyle=i%3?`rgba(${palette[0]},.48)`:`rgba(${palette[2]},.72)`;ctx.lineWidth=Math.max(.5,radius*.025);ctx.beginPath();ctx.moveTo(Math.cos(angle)*pupil,Math.sin(angle)*pupil);ctx.lineTo(Math.cos(angle)*radius*.9,Math.sin(angle)*radius*.9);ctx.stroke()}
   ctx.fillStyle='rgba(2,7,14,.97)';ctx.beginPath();ctx.arc(0,0,pupil,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(-radius*.24,-radius*.27,radius*.12,radius*.075,-.45,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  const skinBuffer=document.createElement('canvas'),skinBufferCtx=skinBuffer.getContext('2d');
  const faceOutline=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
  const mouthOutline=[61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
  const beardOutline=[234,93,132,58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,361,323,454];
  const beardUpperCut=[234,93,132,58,61,98,2,327,291,288,361,323,454];
  const upperLipAndMustache=[61,185,40,39,37,0,267,269,270,409,291,327,2,98];
  function traceLandmarkLoop(ids){ids.forEach((id,index)=>{const[x,y]=eyePoint(id);index?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath()}
  function drawSkinSmoothing(){if(!skinSmooth||!facePoints)return;if(skinBuffer.width!==canvas.width||skinBuffer.height!==canvas.height){skinBuffer.width=canvas.width;skinBuffer.height=canvas.height}skinBufferCtx.clearRect(0,0,canvas.width,canvas.height);skinBufferCtx.filter=`blur(${1.2+skinSmooth/15}px)`;skinBufferCtx.drawImage(canvas,0,0);skinBufferCtx.filter='none';ctx.save();ctx.beginPath();traceLandmarkLoop(faceOutline);eyeContours.forEach(traceLandmarkLoop);traceLandmarkLoop(mouthOutline);ctx.clip('evenodd');ctx.globalAlpha=.18+skinSmooth/145;ctx.drawImage(skinBuffer,0,0);ctx.restore()}
  function drawFaceLook(){
   const amount=Number(faceStrengthInput.value)/100;if(amount<=0)return;
   const cheek=(aId,bId,color)=>{const a=eyePoint(aId),b=eyePoint(bId),x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,r=Math.max(5,Math.hypot(a[0]-b[0],a[1]-b[1])*1.5),g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)};
   ctx.save();
   if(['blush','glam','golden'].includes(faceLook)){const color=faceLook==='golden'?'rgba(255,157,87,.48)':'rgba(239,74,122,.55)';cheek(50,205,color);cheek(280,425,color)}
   if(['lipstick','glam'].includes(faceLook)){
    ctx.beginPath();traceLandmarkLoop(mouthOutline);ctx.fillStyle=faceLook==='glam'?'rgba(190,24,75,.82)':'rgba(218,42,85,.82)';ctx.globalAlpha=amount;ctx.fill();
    ctx.globalAlpha=amount*.9;ctx.strokeStyle='rgba(30,12,25,.9)';ctx.lineWidth=Math.max(1.5,canvas.width/430);ctx.lineCap='round';
    for(const ids of [[33,160,158,133],[362,385,387,263]]){ctx.beginPath();ids.forEach((id,i)=>{const[x,y]=eyePoint(id);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
   }
   if(faceLook==='freckles'){
    ctx.fillStyle='rgba(100,48,28,.84)';const centers=[eyePoint(50),eyePoint(280)],ends=[eyePoint(205),eyePoint(425)];
    centers.forEach((c,side)=>{const end=ends[side];for(let i=0;i<17;i++){const t=(i+1)/18,offset=Math.sin(i*17+side)*Math.hypot(end[0]-c[0],end[1]-c[1])*.45,x=c[0]+(end[0]-c[0])*t+offset,y=c[1]+Math.sin(i*7+side)*Math.max(2,canvas.width/420);ctx.globalAlpha=amount*(.45+(i%4)*.12);ctx.beginPath();ctx.arc(x,y,Math.max(1,canvas.width/900*(1+(i%3)*.25)),0,Math.PI*2);ctx.fill()}})
   }
   if(faceLook==='golden'){
    const a=eyePoint(168),b=eyePoint(1),x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,r=Math.max(4,Math.hypot(a[0]-b[0],a[1]-b[1])*.58),g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,231,174,.62)');g.addColorStop(1,'rgba(255,231,174,0)');ctx.globalAlpha=amount;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)
   }
   ctx.restore();
  }
  async function ensureBeardTexture(){
   if(beardTexture)return beardTexture;
   if(!beardTexturePromise)beardTexturePromise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{try{const texture=document.createElement('canvas'),textureCtx=texture.getContext('2d',{willReadFrequently:true});texture.width=image.naturalWidth;texture.height=image.naturalHeight;textureCtx.drawImage(image,0,0);const pixels=textureCtx.getImageData(0,0,texture.width,texture.height);for(let i=0;i<pixels.data.length;i+=4){const red=pixels.data[i],green=pixels.data[i+1],blue=pixels.data[i+2],alpha=pixels.data[i+3];if(alpha<24||(red>150&&green<100&&blue<100&&red>green*1.8))pixels.data[i+3]=0}textureCtx.putImageData(pixels,0,0);beardTexture=texture;resolve(texture)}catch(error){reject(error)}};image.onerror=()=>reject(new Error('No se pudo cargar la textura de barba'));image.src='./klk-face-assets/beard-cutout-natural-v2.png'}).catch(error=>{beardTexturePromise=null;throw error});
   return beardTexturePromise;
  }
  function beardPlacement(){
   const mouthLeft=eyePoint(61),mouthRight=eyePoint(291),chin=eyePoint(152),upperLip=eyePoint(0),lowerLip=eyePoint(17),jawLeft=eyePoint(172),jawRight=eyePoint(397),centerX=(mouthLeft[0]+mouthRight[0])/2,centerY=(upperLip[1]+lowerLip[1])/2,angle=Math.atan2(mouthRight[1]-mouthLeft[1],mouthRight[0]-mouthLeft[0]),cos=Math.cos(angle),sin=Math.sin(angle);
   const localX=point=>(point[0]-centerX)*cos+(point[1]-centerY)*sin,localY=point=>(point[1]-centerY)*cos-(point[0]-centerX)*sin;
   const chinX=localX(chin),mouthSpan=Math.max(12,Math.hypot(mouthRight[0]-mouthLeft[0],mouthRight[1]-mouthLeft[1])),jawWidth=Math.max(12,Math.hypot(jawRight[0]-jawLeft[0],jawRight[1]-jawLeft[1])),chinDistance=Math.max(8,(chin[0]-centerX)*-sin+(chin[1]-centerY)*cos);
   const jawXs=[localX(jawLeft),localX(jawRight)],mouthXs=[localX(mouthLeft),localX(mouthRight)],cheekPoints=[93,132,323,361].map(id=>eyePoint(id)),cheekXs=cheekPoints.map(localX),leftCheekIndex=cheekXs.indexOf(Math.min(...cheekXs)),rightCheekIndex=cheekXs.indexOf(Math.max(...cheekXs)),leftCheek=Math.max(8,-cheekXs[leftCheekIndex]),rightCheek=Math.max(8,cheekXs[rightCheekIndex]),sideburnY=Math.max(-jawWidth*.34,Math.min(-jawWidth*.08,(localY(cheekPoints[leftCheekIndex])+localY(cheekPoints[rightCheekIndex]))/2));
   return{centerX,centerY,angle,chinDistance,jawWidth,mouthWidth:mouthSpan,chinX,leftJaw:Math.max(8,-Math.min(...jawXs)),rightJaw:Math.max(8,Math.max(...jawXs)),leftMouth:Math.max(6,-Math.min(...mouthXs)),rightMouth:Math.max(6,Math.max(...mouthXs)),leftCheek,rightCheek,sideburnY};
  }
  function drawManLook(){
   const amount=Number(manStrengthInput.value)/100;if(!amount||manLook==='none'||!facePoints)return;
   const place=beardPlacement(),{centerX,centerY,angle,chinDistance,chinX}=place;
   const jawPath=()=>{
    // Upper edge follows the natural cheek-to-mouth beard line on both sides.
    // The mouth is a hole, never part of the filled beard region.
    const outer=[234,93,132,58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,361,323,454];
    outer.forEach((id,i)=>{const[x,y]=eyePoint(id);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
    const cheekR=[454,323,361,288,291],cheekL=[61,58,132,93,234];
    cheekR.forEach(id=>{const[x,y]=eyePoint(id);ctx.lineTo(x,y)});
    const [rx,ry]=eyePoint(291),[lx,ly]=eyePoint(61),[cx,cy]=eyePoint(17);
    // Curved upper lip boundary instead of a straight cheek-to-cheek chord.
    ctx.quadraticCurveTo((rx+cx)*.5,ry+Math.abs(cy-ry)*.12,cx,cy-Math.abs(cy-ry)*.40);
    ctx.quadraticCurveTo((lx+cx)*.5,ly+Math.abs(cy-ly)*.12,lx,ly);
    cheekL.forEach(id=>{const[x,y]=eyePoint(id);ctx.lineTo(x,y)});
    ctx.closePath();
    traceLandmarkLoop(mouthOutline);
   };
   const seed=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value)};
   function beardPattern(key,density,lengthBase,lengthRange){
    const cache=drawManLook.patterns||(drawManLook.patterns=new Map());if(cache.has(key))return cache.get(key);
    const size=512,texture=document.createElement('canvas');texture.width=size;texture.height=size;
    const brush=texture.getContext('2d');brush.lineCap='round';
    // Transparent texture: never paint a rectangular gradient over the face.
    for(let i=0;i<density;i++){
     const across=seed(i+1+key.length*311),t=Math.pow(seed(i+1701+key.length*191),.78),x=12+across*488,y=12+t*488,edgeFade=Math.min(1,across/.08,(1-across)/.08),topFade=Math.min(1,t/.1),len=lengthBase+seed(i+918+key.length*71)*lengthRange,lean=(seed(i+722+key.length*41)*2-1)*2.2;
     brush.strokeStyle=i%17===0?'rgba(108,79,58,.62)':i%5===0?'rgba(46,33,28,.84)':'rgba(24,19,18,.96)';brush.globalAlpha=(.35+seed(i+553+key.length*17)*.6)*edgeFade*topFade;brush.lineWidth=.5+seed(i+342+key.length*23)*.75;brush.beginPath();brush.moveTo(x,y);brush.quadraticCurveTo(x+lean*.45,y+len*.48,x+lean,y+len);brush.stroke();
    }
    brush.globalAlpha=1;cache.set(key,texture);return texture;
   }
   function paintRegion(path,rule,top,bottom,leftStart,rightStart,density,opacity,key,lengthBase,lengthRange){
    ctx.save();ctx.beginPath();path();ctx.clip(rule);ctx.translate(centerX,centerY);ctx.rotate(angle);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=Math.min(1,amount*opacity*1.25);
    const width=Math.max(1,leftStart+rightStart),height=Math.max(1,bottom-top),texture=beardPattern(key,density,lengthBase,lengthRange);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // Feather hair texture toward its upper edge; preserve a clear lip cutout.
    const featherCache=drawManLook.featherCache||(drawManLook.featherCache=new Map());
    let feather=featherCache.get(key);
    if(!feather){
    feather=document.createElement('canvas');feather.width=512;feather.height=512;
    const fctx=feather.getContext('2d');fctx.drawImage(texture,0,0);
    fctx.globalCompositeOperation='destination-in';
    const fade=fctx.createLinearGradient(0,0,0,512);
    fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(.13,'rgba(0,0,0,.55)');
    fade.addColorStop(.30,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,1)');
    fctx.fillStyle=fade;fctx.fillRect(0,0,512,512);
    featherCache.set(key,feather);
    }
    ctx.drawImage(feather,-leftStart,top,width,height);
    ctx.restore();
   }
   // Hair roots are barycentric coordinates in landmark triangles. Unlike a
   // stretched rectangular texture, each root follows cheek/jaw deformation.
   function paintMeshHair(style){
    const triangles=style==='goatee'?
     [[61,17,152],[291,17,152],[61,152,172],[291,397,152]]:
     [[234,93,132],[234,132,172],[132,58,172],[172,136,150],[150,149,152],
      [454,323,361],[454,361,397],[361,288,397],[397,365,378],[378,379,152],
      [58,172,152],[288,397,152],[172,136,152],[397,365,152]];
    const count=style==='stubble'?95:style==='short'?210:style==='goatee'?210:300;
    const opacity=style==='stubble'?.35:style==='short'?.65:.82;
    const lip=eyePoint(0),lowerLip=eyePoint(17),lipWidth=Math.max(8,place.mouthWidth);
    ctx.save();ctx.lineCap='round';
    for(let t=0;t<triangles.length;t++){
     const ids=triangles[t],a=eyePoint(ids[0]),b=eyePoint(ids[1]),c=eyePoint(ids[2]);
     const dx=(a[0]+b[0]+c[0])/3-centerX,dy=(a[1]+b[1]+c[1])/3-centerY;
     const shade=Math.max(.35,Math.min(1,1-Math.abs(dx)/(place.jawWidth*1.1)));
     for(let i=0;i<count;i++){
      const seedIndex=i+t*1021+style.length*113;
      const u=Math.sqrt(seed(seedIndex+5)),v=seed(seedIndex+103);
      const wa=1-u,wb=u*(1-v),wc=u*v;
      const x=a[0]*wa+b[0]*wb+c[0]*wc,y=a[1]*wa+b[1]*wb+c[1]*wc;
      // Never draw whiskers over the lip opening.
      if(Math.abs(x-(lip[0]+lowerLip[0])*.5)<lipWidth*.54&&y>lip[1]-lipWidth*.13&&y<lowerLip[1]+lipWidth*.20)continue;
      const len=(style==='stubble'?1:style==='short'?2.5:4.4)*(0.55+seed(seedIndex+411)*.9)*Math.max(.6,place.jawWidth/140);
      const slant=(seed(seedIndex+221)-.5)*len*.65;
      ctx.globalAlpha=amount*opacity*shade*(.3+seed(seedIndex+701)*.7);
      ctx.strokeStyle=i%13===0?'#775b49':i%4===0?'#3b3029':'#1d1918';
      ctx.lineWidth=Math.max(.4,Math.min(1.5,place.jawWidth/190))*(.7+seed(seedIndex+313)*.6);
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+slant*.4,y+len*.5,x+slant,y+len);ctx.stroke();
     }
    }
    ctx.restore();
   }
   if(manLook==='short'||manLook==='stubble'||manLook==='full'){
    const density=manLook==='stubble'?3200:manLook==='short'?8500:16000,opacity=manLook==='stubble'?.44:manLook==='short'?.84:.96;
    paintMeshHair(manLook);
    if(manLook!=='stubble')paintRegion(()=>{traceLandmarkLoop(upperLipAndMustache);traceLandmarkLoop(mouthOutline)},'evenodd',-place.mouthWidth*.24,-place.mouthWidth*.015,place.leftMouth*.82,place.rightMouth*.82,manLook==='full'?420:300,opacity,manLook+'-mustache',1.5,3.3);
   }else if(manLook==='mustache'){
    paintRegion(()=>{traceLandmarkLoop(upperLipAndMustache);traceLandmarkLoop(mouthOutline)},'evenodd',-place.mouthWidth*.24,-place.mouthWidth*.015,place.leftMouth*.82,place.rightMouth*.82,340,.78,'mustache',1.5,3.3);
   }else if(manLook==='goatee'){
    const rx=Math.max(place.mouthWidth*.62,place.jawWidth*.25),cy=centerY+Math.cos(angle)*chinDistance*.52;
    paintMeshHair('goatee');
   }
  }
  const beardFaceGeometry=window.KLKFaceGeometry?.FaceGeometry ? new window.KLKFaceGeometry.FaceGeometry() : null;
  function render(){
   if(!stream||closed)return;if(video.readyState>=2&&video.videoWidth){const scale=Math.min(1,1600/Math.max(video.videoWidth,video.videoHeight)),width=Math.max(1,Math.round(video.videoWidth*scale)),height=Math.max(1,Math.round(video.videoHeight*scale));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}const filterAmount=Number(filterStrengthInput.value)/100;ctx.filter=(selfieFilters[selfieFilter]||selfieFilters.normal)(filterAmount);ctx.drawImage(video,0,0,width,height);ctx.filter='none';
    const now=performance.now();if((eyeColor!=='none'||skinSmooth>0||faceLook!=='none'||manLook!=='none')&&landmarker&&now-lastDetection>(manLook!=='none'?33:70)){lastDetection=now;try{(()=>{const result=landmarker.detectForVideo(video,now);faceDetectionAttempts++;if(result.faceLandmarks?.[0]?.length>=468){lastFaceDiagnostic='Rostro detectado · '+result.faceLandmarks[0].length+' puntos';if(manLook!=='none'&&faceDetectionAttempts%90===1)message.textContent=lastFaceDiagnostic}else if(faceDetectionAttempts%30===1)reportFaceDiagnostic('Detector funcionando · sin rostro ('+faceDetectionAttempts+' intentos)',now);lastFaceTransform=result.facialTransformationMatrixes?.[0]||null;lastFaceBlendshapes=result.faceBlendshapes?.[0]||null;updateFaceTracker(result.faceLandmarks?.[0]||null,now);if(manLook!=='none'&&beardFaceGeometry){const geometry=beardFaceGeometry.update(result.faceLandmarks?.[0]||null);panel.dispatchEvent(new CustomEvent('klk:facegeometry',{detail:{geometry,faceCount:result.faceLandmarks?.length||0}}))}})()}catch(error){lastFaceErrorAt=now;reportFaceDiagnostic('Error del detector facial: '+error.message,now);console.warn('KLK FaceLandmarker detectForVideo:',error)}}
    if(skinSmooth>0&&facePoints)drawSkinSmoothing();
    if(eyeColor!=='none'&&facePoints){const alpha=Number(eyeStrengthInput.value)/100,palette=eyePalettes[eyeColor]||eyePalettes.blue;drawIris(468,469,eyeContours[0],alpha,palette);drawIris(473,474,eyeContours[1],alpha,palette)}if(faceLook!=='none'&&facePoints)drawFaceLook();
    // Render beard directly into the same 2D canvas used for preview, photos and video.
    // This avoids a separate WebGL layer that can be blank on Android devices.
    if(manLook!=='none'&&facePoints&&now-lastFaceSeenAt<130)drawManLook();
   }renderFrame=requestAnimationFrame(render)
  }
  function attach(file){const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));const feedback=document.getElementById('statusFeedback');if(feedback)feedback.textContent=(file.type.startsWith('video/')?'Video':'Foto')+' listo para publicar.';close()}
  let flashMode='off';
  const flashButton=panel.querySelector('[data-cam="flash"]');
  const flashScreen=document.createElement('div');
  flashScreen.setAttribute('aria-hidden','true');
  flashScreen.style.cssText='position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:50;transition:opacity 70ms';
  panel.appendChild(flashScreen);
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function darkFrame(){
   try{
    const sample=document.createElement('canvas');sample.width=16;sample.height=16;
    const sampleCtx=sample.getContext('2d',{willReadFrequently:true});
    sampleCtx.drawImage(video,0,0,16,16);
    const data=sampleCtx.getImageData(0,0,16,16).data;let light=0;
    for(let i=0;i<data.length;i+=4)light+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
    return light/256<85;
   }catch(_){return false}
  }
  function shouldFlash(){return flashMode==='on'||flashMode==='auto'&&darkFrame()}
  function setFlashMode(mode){
   flashMode=mode;const names={off:'Apagado',on:'Encendido',auto:'Automático'};
   flashButton.textContent=mode==='off'?'⚡ Off':mode==='on'?'⚡ On':'⚡ Auto';
   flashButton.setAttribute('aria-label','Flash '+names[mode]);
   flashButton.title='Flash '+names[mode];
  }
  flashButton.addEventListener('click',()=>setFlashMode(flashMode==='off'?'auto':flashMode==='auto'?'on':'off'));
  async function withFlash(capture){
   if(!shouldFlash())return capture();
   const track=stream?.getVideoTracks()[0];
   const capabilities=track?.getCapabilities?.();
   let torch=false;
   if(!front&&capabilities?.torch){
    try{await track.applyConstraints({advanced:[{torch:true}]});torch=true;await sleep(160)}catch(_){}
   }
   if(!torch){flashScreen.style.opacity='0.9';await sleep(180)}
   // Screen flash brightens the subject before capture; it does not alter pixels artificially.
   try{return await capture()}finally{
    flashScreen.style.opacity='0';
    if(torch)try{await track.applyConstraints({advanced:[{torch:false}]})}catch(_){}
   }
  }
  function compositeBeardForCapture(){
    if(manLook==='none')return;
    const overlay=panel.querySelector('.klkBeardMaskOverlay');
    if(!overlay||!overlay.width||!overlay.height)return;
    const videoRect=video.getBoundingClientRect(),hostRect=panel.getBoundingClientRect();
    const sx=(videoRect.left-hostRect.left)*overlay.width/Math.max(1,hostRect.width);
    const sy=(videoRect.top-hostRect.top)*overlay.height/Math.max(1,hostRect.height);
    const sw=videoRect.width*overlay.width/Math.max(1,hostRect.width);
    const sh=videoRect.height*overlay.height/Math.max(1,hostRect.height);
    ctx.save();
    if(front){ctx.translate(canvas.width,0);ctx.scale(-1,1)}
    ctx.drawImage(overlay,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
    ctx.restore();
  }
  async function takePhoto(){if(!video.videoWidth){message.textContent='La cámara aún no está lista.';return}if((eyeColor!=='none'||skinSmooth>0||faceLook!=='none'||manLook!=='none')&&!landmarker){message.textContent='Activa el seguimiento facial antes de capturar.';return}const blob=await withFlash(()=>new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9)));if(blob)attach(new File([blob],'estado-foto.jpg',{type:'image/jpeg'}))}
  async function selectEyeColor(color){eyeColor=color;facePoints=null;panel.querySelectorAll('[data-eye-color]').forEach(button=>{const active=button.dataset.eyeColor===color;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});if(color==='none'){shutter.disabled=false;message.textContent='Color natural · Elige un filtro para tu selfie';return}shutter.disabled=true;message.textContent='Cargando seguimiento facial…';try{await ensureLandmarker();if(closed)return;shutter.disabled=false;message.textContent='Ojos '+({blue:'azules',green:'verdes',hazel:'color miel',violet:'violeta',gray:'grises'}[color]||'con color')+' activados · seguimiento facial en vivo'}catch(error){eyeColor='none';shutter.disabled=false;panel.querySelectorAll('[data-eye-color]').forEach(button=>{const active=button.dataset.eyeColor==='none';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});message.textContent='No se pudo cargar el seguimiento facial: '+error.message}}
  function selectSelfieFilter(filter){selfieFilter=filter;panel.querySelectorAll('[data-selfie-filter]').forEach(button=>{const active=button.dataset.selfieFilter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});message.textContent='Filtro '+({normal:'natural',warm:'cálido',cool:'frío',glow:'brillo',vintage:'vintage',mono:'blanco y negro',rose:'rosa',cinematic:'cine',dream:'sueño',vivid:'vibrante'}[filter]||'natural')+' activado'}
  function startRecording(){if(!pressed||!stream||typeof MediaRecorder==='undefined'){message.textContent='La grabación no está disponible en este navegador.';return}if((eyeColor!=='none'||manLook!=='none')&&!landmarker){message.textContent='Espera a que se active el seguimiento facial.';return}const preferred=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp8,opus','video/webm'],chosen=preferred.find(type=>MediaRecorder.isTypeSupported(type));try{stopOutput();const canvasStream=canvas.captureStream(24);outputStream=new MediaStream([...canvasStream.getVideoTracks(),...stream.getAudioTracks()]);chunks=[];discardRecording=false;recorder=new MediaRecorder(outputStream,{...(chosen?{mimeType:chosen}:{}),videoBitsPerSecond:1600000,audioBitsPerSecond:96000});recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)};recorder.onstop=()=>{clearTimeout(recordTimer);stopOutput();resetElapsed();shutter.classList.remove('recording');if(discardRecording)return;const blob=new Blob(chunks,{type:recorder.mimeType||'video/webm'});if(blob.size>52428800){message.textContent='Video demasiado grande. Graba uno más corto.';return}if(blob.size)attach(new File([blob],'estado-video.'+(blob.type.includes('mp4')?'mp4':'webm'),{type:blob.type}))};recorder.start(250);recordStartedAt=performance.now();timerDisplay.classList.add('visible');progress.parentElement.style.display='block';updateElapsed();clearInterval(elapsedTimer);elapsedTimer=setInterval(updateElapsed,100);recordingByHold=true;shutter.classList.add('recording');message.textContent=(eyeColor!=='none'?'Grabando con ojos '+({blue:'azules',green:'verdes',hazel:'miel',violet:'violetas',gray:'grises'}[eyeColor]||'con efecto')+' · ':'')+(selfieFilter!=='normal'?'filtro '+selfieFilter+' · ':'')+'Suelta para terminar (máximo 30 segundos)';recordTimer=setTimeout(()=>{if(recorder&&recorder.state==='recording'){updateElapsed();recorder.stop()}},30000)}catch(error){recordingByHold=false;stopOutput();message.textContent='No se pudo iniciar grabación: '+error.message}}
  trigger.addEventListener('click',async event=>{event.preventDefault();event.stopImmediatePropagation();panel.classList.add('open');message.textContent='Solicitando acceso a cámara y micrófono…';try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('Cámara no disponible');await start();message.textContent='Toca para foto · Mantén pulsado para grabar video';}catch(error){panel.classList.remove('open');stopStream();message.textContent='No se pudo abrir la cámara de KLK: '+error.message;panel.classList.add('open')}},true);
  panel.querySelector('[data-cam="close"]').onclick=close;panel.querySelector('[data-cam="flip"]').onclick=async event=>{const button=event.currentTarget;if(button.disabled)return;button.disabled=true;const previous=front;front=!front;try{await start();void 0}catch(error){front=previous;message.textContent='No se pudo cambiar la cámara: '+error.message;try{await start()}catch(_){}}finally{button.disabled=false}};
  panel.querySelectorAll('[data-beard-preset]').forEach(button=>button.onclick=async()=>{
    const id=button.dataset.beardPreset,style=globalThis.KLKBeardStyles?.get(id);
    if(!style)return;
    manLook=({stubble:'stubble','short-boxed':'short',full:'full',corporate:'short',goatee:'goatee',circle:'goatee','van-dyke':'goatee',balbo:'full',anchor:'goatee','chin-strap':'short',ducktail:'full',garibaldi:'full'})[id]||'full';
    facePoints=null;
    message.textContent='Activando '+style.name+' (vista experimental)…';
    try{const detector=await ensureLandmarker();if(closed)return;window.KLKStatusFaceBridge?.stop();window.KLKBeardMask?.setEnabled(false);faceDetectionAttempts=0;lastBeardNotice=0;message.textContent=style.name+' · detector cargado; buscando rostro…'}
    catch(error){manLook='none';window.KLKBeardMask?.setEnabled(false);message.textContent='No se pudo activar barba: '+error.message}
  });
  effectsButton.onclick=()=>{const show=effectsPanel.hidden;effectsPanel.hidden=!show;effectsButton.setAttribute('aria-expanded',String(show))};panel.querySelectorAll('[data-effect-tab]').forEach(tab=>tab.onclick=()=>{panel.querySelectorAll('[data-effect-tab]').forEach(item=>item.setAttribute('aria-selected',String(item===tab)));panel.querySelectorAll('[data-effect-category]').forEach(group=>group.hidden=group.dataset.effectCategory!==tab.dataset.effectTab)});panel.querySelectorAll('[data-skin-preset]').forEach(button=>button.onclick=()=>{const value=Number(button.dataset.skinPreset);skinStrengthInput.value=String(value);skinStrengthInput.dispatchEvent(new Event('input',{bubbles:true}));panel.querySelectorAll('[data-skin-preset]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))})});skinStrengthInput.addEventListener('input',async()=>{skinSmooth=Number(skinStrengthInput.value);panel.querySelectorAll('[data-skin-preset]').forEach(item=>{const active=Number(item.dataset.skinPreset)===skinSmooth;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});if(!skinSmooth){message.textContent='Piel natural · Elige un look creativo';return}message.textContent='Activando suavizado de piel…';try{await ensureLandmarker();if(!closed)message.textContent='Suavizado de piel activado · seguimiento facial en vivo'}catch(error){skinSmooth=0;skinStrengthInput.value='0';message.textContent='No se pudo activar el suavizado: '+error.message}});panel.querySelectorAll('[data-face-look]').forEach(button=>button.onclick=async()=>{const next=button.dataset.faceLook;panel.querySelectorAll('[data-face-look]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});faceLook=next;facePoints=null;if(next==='none'){message.textContent='Maquillaje desactivado · rostro natural';return}message.textContent='Activando seguimiento facial…';try{await ensureLandmarker();if(!closed)message.textContent='Efecto '+({blush:'rubor',freckles:'pecas',lipstick:'labios',glam:'glam',golden:'dorado'}[next]||'facial')+' activo · sigue tu rostro en vivo'}catch(error){faceLook='none';message.textContent='No se pudo activar el seguimiento facial: '+error.message}});panel.querySelectorAll('[data-man-look]').forEach(button=>button.onclick=async()=>{message.textContent='Efectos de barba temporalmente desactivados mientras se desarrolla el reemplazo';return;const next=button.dataset.manLook;panel.querySelectorAll('[data-man-look]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});manLook=next;facePoints=null;if(next==='none'){message.textContent='Efecto masculino desactivado';return}message.textContent='Activando seguimiento facial…';try{await ensureLandmarker();if(!closed)message.textContent='Buscando rostro para aplicar '+({stubble:'barba de 3 días',short:'barba corta',goatee:'candado',mustache:'bigote',full:'barba completa'}[next]||'de barba')+' · mira a la cámara frontal'}catch(error){manLook='none';panel.querySelectorAll('[data-man-look]').forEach(item=>{const active=item.dataset.manLook==='none';item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});message.textContent='No se pudo activar el seguimiento facial: '+error.message}});panel.querySelectorAll('[data-eye-color]').forEach(button=>button.onclick=()=>selectEyeColor(button.dataset.eyeColor));panel.querySelectorAll('[data-selfie-filter]').forEach(button=>button.onclick=()=>selectSelfieFilter(button.dataset.selfieFilter));
  shutter.addEventListener('pointerdown',event=>{if(event.button!==0||!stream)return;event.preventDefault();pressed=true;recordingByHold=false;try{shutter.setPointerCapture(event.pointerId)}catch(_){}holdTimer=setTimeout(startRecording,450)});
  function finishPress(event){if(!pressed)return;event.preventDefault();pressed=false;clearTimeout(holdTimer);if(recordingByHold){recordingByHold=false;if(recorder&&recorder.state==='recording')recorder.stop()}else takePhoto()}
  shutter.addEventListener('pointerup',finishPress);shutter.addEventListener('pointercancel',()=>{pressed=false;clearTimeout(holdTimer);if(recorder&&recorder.state==='recording'){discardRecording=true;recorder.stop()}});shutter.addEventListener('contextmenu',event=>event.preventDefault());
  window.addEventListener('pagehide',()=>{close();landmarker?.close?.();landmarker=null});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
