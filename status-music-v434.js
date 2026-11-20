/* Music for photo States: user-provided audio is embedded into a short video. */
(function(){
 const init=()=>{
 const composer=document.getElementById('statusComposer'),picker=document.querySelector('.klkStatusMediaPicker'),publish=document.getElementById('publishStatus');
 if(!composer||!picker||!publish)return;
 const label=document.createElement('label');label.className='klkStatusMediaAction';label.htmlFor='klkStatusMusicFile';label.textContent='🎵 Música';
 const input=document.createElement('input');input.type='file';input.id='klkStatusMusicFile';input.accept='audio/*';input.hidden=true;
 const controls=document.createElement('div');controls.className='klkStatusMusicControls';controls.hidden=true;
 const name=document.createElement('span');name.className='klkStatusMusicName';
 const player=document.createElement('audio');player.controls=true;player.preload='metadata';
 const remove=document.createElement('button');remove.type='button';remove.className='klkStatusMusicRemove';remove.textContent='Quitar música';
 controls.append(name,player,remove);
 picker.append(label,input);picker.after(controls);
 let music=null,url=null,busy=false;
 function clear(){music=null;if(url)URL.revokeObjectURL(url);url=null;input.value='';controls.hidden=true;controls.querySelector('audio').removeAttribute('src');controls.querySelector('audio').load()}
 input.addEventListener('change',()=>{const file=input.files?.[0];if(!file)return;if(!file.type.startsWith('audio/')||file.size>25*1048576){alert('Elige un audio de hasta 25 MB.');clear();return}clear();music=file;url=URL.createObjectURL(file);controls.hidden=false;controls.querySelector('audio').src=url;controls.querySelector('.klkStatusMusicName').textContent=file.name});
 controls.querySelector('.klkStatusMusicRemove').onclick=clear;
 document.addEventListener('klk-status-published',clear);
 async function composePhoto(photo,audioFile){
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw Error('Tu navegador no permite crear un video con música.');
  const image=new Image(),imageUrl=URL.createObjectURL(photo);
  try{await new Promise((ok,fail)=>{image.onload=ok;image.onerror=fail;image.src=imageUrl})}finally{URL.revokeObjectURL(imageUrl)}
  const audio=new Audio(),audioUrl=URL.createObjectURL(audioFile);audio.src=audioUrl;audio.preload='auto';
  const canvas=document.createElement('canvas'),max=960,ratio=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));
  canvas.width=Math.max(2,Math.round(image.naturalWidth*ratio/2)*2);canvas.height=Math.max(2,Math.round(image.naturalHeight*ratio/2)*2);
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const context=new (window.AudioContext||window.webkitAudioContext)(),destination=context.createMediaStreamDestination();
  const source=context.createMediaElementSource(audio);source.connect(destination);source.connect(context.destination);
  const stream=canvas.captureStream(15);destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
  const mime=['video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  if(!mime){await context.close();URL.revokeObjectURL(audioUrl);throw Error('Este dispositivo no admite video con audio WebM.')}
  const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1200000});
  const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  try{
   await context.resume();const ready=new Promise((ok,fail)=>{audio.oncanplay=ok;audio.onerror=()=>fail(Error('No se pudo leer la música.'))});audio.load();await ready;
   const duration=Math.min(15,Number.isFinite(audio.duration)?audio.duration:15);
   const done=new Promise((ok,fail)=>{recorder.onstop=ok;recorder.onerror=()=>fail(Error('Falló la grabación del estado.'))});
   recorder.start();await audio.play();await new Promise(resolve=>setTimeout(resolve,Math.max(1000,duration*1000)));
   recorder.stop();await done;
   return new File(chunks,'estado-con-musica.webm',{type:'video/webm'});
  }finally{audio.pause();stream.getTracks().forEach(track=>track.stop());await context.close();URL.revokeObjectURL(audioUrl)}
 }
 publish.addEventListener('click',async e=>{
  if(!music||busy)return;
  e.stopImmediatePropagation();e.preventDefault();
  const photo=document.getElementById('statusPhoto'),selected=window.klkStatusEditedFiles?.length?window.klkStatusEditedFiles:Array.from(photo.files||[]);
  if(selected.length!==1||!selected[0].type.startsWith('image/')){document.getElementById('statusFeedback').textContent='Para añadir música, selecciona una sola foto y pulsa Listo en el editor.';return}
  busy=true;publish.disabled=true;const feedback=document.getElementById('statusFeedback');feedback.textContent='Creando estado con música (hasta 15 segundos)...';
  try{const video=await composePhoto(selected[0],music);window.klkStatusEditedFiles=[video];clear();publish.disabled=false;busy=false;publish.click()}
  catch(error){feedback.textContent='No se pudo añadir música: '+error.message;publish.disabled=false;busy=false}
 },true);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();