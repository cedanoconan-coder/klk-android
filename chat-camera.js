/* KLK Chat Camera: foto, video, nota de video, galería, flash y cámara frontal/trasera */
(function(){
 "use strict";
 let overlay=null,video=null,stream=null,facing="environment",mode="photo",recorder=null,chunks=[],recordStarted=0,timer=null,filterIndex=0,torchOn=false,cameraRequest=0,cameraBusy=false;
 const filters=["none","grayscale(1)","sepia(.7)","contrast(1.2) saturate(1.4)","brightness(1.12) saturate(.8)"];
 const filterNames=["Original","B/N","Cálido","Vivo","Suave"];
 const $=id=>overlay&&overlay.querySelector("#"+id);
 function status(message){const el=$("klkCameraStatus");if(el)el.textContent=message||"";}
 function stopStream(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}if(video)video.srcObject=null;torchOn=false;}
 function close(){if(recorder&&recorder.state!=="inactive"){try{recorder.stop();}catch(e){}}if(timer){clearInterval(timer);timer=null;}stopStream();if(overlay){overlay.remove();overlay=null;}document.body.style.overflow="";}
 function build(){
  if(overlay)return;
  overlay=document.createElement("section");overlay.id="klkChatCamera";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Cámara del chat");
  overlay.innerHTML='<style>\n#klkChatCamera{position:fixed;inset:0;z-index:30000;background:#000;color:#fff;display:flex;flex-direction:column;font:15px system-ui,-apple-system,sans-serif;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);overflow:hidden}\n#klkChatCamera *{box-sizing:border-box}\n#klkCameraTop{position:absolute;z-index:5;left:0;right:0;top:42px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;pointer-events:none}\n#klkCameraTop strong{display:none}\n#klkCameraTop button,#klkCameraBottom button{pointer-events:auto;border:0;color:#fff;background:#1119;border-radius:50%;width:54px;height:54px;font-size:29px;display:grid;place-items:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}\n#klkCameraTop button:disabled{opacity:.35}\n#klkCameraStage{position:relative;flex:1;min-height:0;display:grid;place-items:center;background:#111;overflow:hidden;margin-top:48px;margin-bottom:0}\n#klkCameraPreview{width:100%;height:100%;object-fit:cover;filter:none}\n#klkCameraBottom{position:absolute;z-index:6;left:0;right:0;bottom:126px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;gap:10px;pointer-events:none}\n#klkCameraBottom button{width:62px;height:62px;font-size:28px}\n#klkCameraGallery{order:0}\n#klkCameraEffect{order:1}\n#klkCameraShutter{order:2;width:88px!important;height:88px!important;background:#fff!important;border:6px solid #aaa!important;border-radius:50%!important;box-shadow:0 0 0 4px #fff!important;color:#111!important;margin:0 auto}\n#klkCameraShutter.recording{background:#e53935!important;border-radius:22px!important}\n#klkCameraSwitch{order:3}\n#klkCameraThumb{display:none}\n#klkCameraEffect{border:0;color:#fff;background:#1119;border-radius:50%;width:62px;height:62px;font-size:25px;display:grid;place-items:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}\n#klkCameraStatus{position:absolute;z-index:4;left:0;right:0;bottom:232px;min-height:18px;text-align:center;font-size:11px;color:#fff;padding:0 10px;text-shadow:0 1px 4px #000;pointer-events:none}\n#klkCameraTimer{position:absolute;z-index:4;top:20px;left:50%;transform:translateX(-50%);background:#d22;border-radius:16px;padding:6px 12px;font-size:13px;display:none}\n#klkCameraTimer.on{display:block}\n#klkCameraModes{flex:0 0 112px;display:flex;justify-content:center;align-items:center;gap:18px;padding:8px 8px 18px;background:#000;z-index:5}\n#klkCameraModes button{border:0;background:transparent;color:#fff;font-size:16px;font-weight:500;padding:10px 14px;border-radius:28px;line-height:1.2;white-space:nowrap}\n#klkCameraModes button.active{background:#292929;font-weight:600;padding:12px 18px}\n#klkCameraFiles{display:none}\n@media(max-width:380px){#klkCameraTop{padding:0 18px}#klkCameraBottom{padding:0 16px;bottom:122px}#klkCameraBottom button{width:56px;height:56px}#klkCameraShutter{width:82px!important;height:82px!important}#klkCameraModes{gap:8px;flex-basis:106px}#klkCameraModes button{font-size:14px;padding:9px 10px}#klkCameraModes button.active{padding:10px 14px}}\n@media(max-height:650px){#klkCameraTop{top:12px}#klkCameraBottom{bottom:104px}#klkCameraModes{flex-basis:90px}}\n</style>\n<div id="klkCameraTop"><button type="button" id="klkCameraClose" aria-label="Cerrar cámara">×</button><strong>KLK · Cámara</strong><button type="button" id="klkCameraFlash" aria-label="Activar flash">ϟ̸</button></div>\n<div id="klkCameraStage"><video id="klkCameraPreview" autoplay muted playsinline></video><span id="klkCameraTimer"></span></div>\n<div id="klkCameraStatus" role="status">Iniciando cámara…</div>\n<div id="klkCameraBottom"><button type="button" id="klkCameraGallery" aria-label="Abrir galería">▧</button><button type="button" id="klkCameraEffect" aria-label="Cambiar efecto">✣</button><img id="klkCameraThumb" alt="Última captura" hidden><button type="button" id="klkCameraShutter" aria-label="Capturar"></button><button type="button" id="klkCameraSwitch" aria-label="Cambiar cámara">⟳</button><input id="klkCameraFiles" type="file" accept="image/*,video/*" hidden></div>\n<nav id="klkCameraModes" aria-label="Modo de cámara"><button type="button" data-mode="video">Vídeo</button><button type="button" data-mode="photo" class="active">Foto</button><button type="button" data-mode="note">Nota de video</button></nav>';
  document.body.appendChild(overlay);document.body.style.overflow="hidden";video=$("klkCameraPreview");
  $("klkCameraClose").onclick=close;$("klkCameraSwitch").onclick=switchCamera;$("klkCameraFlash").onclick=toggleFlash;$("klkCameraShutter").onclick=shutter;$("klkCameraEffect").onclick=nextFilter;$("klkCameraGallery").onclick=()=> $("klkCameraFiles").click();
  $("klkCameraFiles").onchange=async e=>{const f=e.target.files&&e.target.files[0];if(f)await sendFile(f);e.target.value="";};
  overlay.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
 }
 async function startStream(){
  const request=++cameraRequest;
  if(cameraBusy){stopStream();}
  stopStream();
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){status("Tu navegador no permite abrir la cámara. Usa Chrome actualizado.");return;}
  cameraBusy=true;
  try{
   const wantsAudio=mode!=="photo";
   const constraints={audio:wantsAudio?{echoCancellation:true,noiseSuppression:true,autoGainControl:true}:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30,max:30}}};
   const next=await navigator.mediaDevices.getUserMedia(constraints);
   if(request!==cameraRequest){next.getTracks().forEach(t=>t.stop());return;}
   stream=next;video.srcObject=stream;await video.play().catch(()=>{});
   const track=stream.getVideoTracks()[0],caps=track&&track.getCapabilities?track.getCapabilities():{};
   if(track&&track.applyConstraints){
    const advanced={};
    if(caps.focusMode&&caps.focusMode.includes("continuous"))advanced.focusMode="continuous";
    if(caps.exposureMode&&caps.exposureMode.includes("continuous"))advanced.exposureMode="continuous";
    if(caps.whiteBalanceMode&&caps.whiteBalanceMode.includes("continuous"))advanced.whiteBalanceMode="continuous";
    if(caps.imageStabilization)advanced.imageStabilization=true;
    if(Object.keys(advanced).length)try{await track.applyConstraints({advanced:[advanced]});}catch(e){}
   }
   $("klkCameraFlash").disabled=!caps.torch;status("Cámara lista");
  }catch(e){
   if(request===cameraRequest)status(e.name==="NotAllowedError"?"Permite el acceso a la cámara y al micrófono.":e.name==="NotFoundError"?"No se encontró una cámara disponible.":"No se pudo iniciar la cámara: "+(e.message||"comprueba los permisos."));
  }finally{if(request===cameraRequest)cameraBusy=false;}
 }
 async function switchCamera(){facing=facing==="environment"?"user":"environment";await startStream();}
 async function toggleFlash(){const track=stream&&stream.getVideoTracks()[0];if(!track||!track.getCapabilities||!track.getCapabilities().torch){status("El flash no está disponible en este dispositivo.");return;}try{torchOn=!torchOn;await track.applyConstraints({advanced:[{torch:torchOn}]});$("klkCameraFlash").textContent=torchOn?"ϟ":"ϟ̸";}catch(e){torchOn=false;status("No se pudo cambiar el flash.");}}
 function nextFilter(){filterIndex=(filterIndex+1)%filters.length;video.style.filter=filters[filterIndex];$("klkCameraEffect").textContent=["✣","◐","☼","✦","◌"][filterIndex];$("klkCameraEffect").setAttribute("aria-label","Efecto: "+filterNames[filterIndex]);}
 async function setMode(next){if(recorder&&recorder.state!=="inactive")return;mode=next;overlay.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));$("klkCameraShutter").classList.remove("recording");$("klkCameraShutter").setAttribute("aria-label",mode==="photo"?"Capturar foto":"Iniciar grabación");await startStream();status(mode==="photo"?"Modo Foto":mode==="video"?"Modo Vídeo":"Nota de video · máximo 60 segundos");}
 async function shutter(){
  if(!stream){await startStream();if(!stream)return;}
  if(mode==="photo"){capturePhoto();return;}
  if(recorder&&recorder.state==="recording"){recorder.stop();return;}
  const mime=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"].find(x=>window.MediaRecorder&&MediaRecorder.isTypeSupported(x));
  if(!window.MediaRecorder){status("Este navegador no permite grabar video.");return;}
  try{chunks=[];recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};recorder.onerror=()=>status("La grabación se interrumpió.");recorder.onstop=async()=>{if(timer){clearInterval(timer);timer=null;}const seconds=Math.max(1,Math.round((Date.now()-recordStarted)/1000));const blob=new Blob(chunks,{type:recorder.mimeType||"video/webm"});const file=new File([blob],(mode==="note"?"nota-video-":"video-")+Date.now()+".webm",{type:blob.type,lastModified:Date.now()});$("klkCameraShutter").classList.remove("recording");$("klkCameraTimer").classList.remove("on");status("Preparando envío…");await sendFile(file,seconds);};recorder.start(250);recordStarted=Date.now();$("klkCameraShutter").classList.add("recording");$("klkCameraTimer").classList.add("on");status(mode==="note"?"Grabando nota de video…":"Grabando video…");timer=setInterval(()=>{const sec=Math.floor((Date.now()-recordStarted)/1000);$("klkCameraTimer").textContent="● "+String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");if(mode==="note"&&sec>=60&&recorder&&recorder.state==="recording")recorder.stop();},250);}
  catch(e){status("No se pudo iniciar la grabación: "+(e.message||"error"));}
 }
 function capturePhoto(){const w=video.videoWidth,h=video.videoHeight;if(!w||!h){status("La cámara todavía está enfocando. Inténtalo de nuevo.");return;}const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");ctx.filter=filters[filterIndex];if(facing==="user"){ctx.translate(w,0);ctx.scale(-1,1);}ctx.drawImage(video,0,0,w,h);canvas.toBlob(async blob=>{if(!blob){status("No se pudo capturar la foto.");return;}const file=new File([blob],"klk-foto-"+Date.now()+".jpg",{type:"image/jpeg",lastModified:Date.now()});const thumb=$("klkCameraThumb");thumb.src=URL.createObjectURL(blob);thumb.hidden=false;status("Enviando foto al chat…");await sendFile(file);}, "image/jpeg",.92);}
 async function sendFile(file,seconds=null){try{if(typeof window.uploadMedia!=="function")throw new Error("El envío multimedia no está disponible. Recarga KLK.");await window.uploadMedia(file,file.type.startsWith("image/")?"image":"file",seconds);if(!document.body.contains(overlay))return;status("Archivo enviado al chat");if(file.type.startsWith("image/")){close();return;}if(mode==="note"||mode==="video")close();}catch(e){status(e.message||"No se pudo enviar el archivo.");}}
 document.addEventListener("click",function(event){const button=event.target.closest&&event.target.closest("#takePhoto,#shareCamera");if(!button)return;event.preventDefault();event.stopImmediatePropagation();close();build();startStream();},{capture:true});
 window.klkOpenChatCamera=function(){close();build();startStream();};
 window.addEventListener("pagehide",()=>{if(stream)stopStream();});
})();