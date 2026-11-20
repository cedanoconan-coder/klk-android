/* KLK Estados: selector local de música, previsualización y recorte.
 * La mezcla/exportación con el estado se implementará por separado.
 */
(()=>{'use strict';
const MAX_BYTES=30*1024*1024;
let url='',audio=null,selected=null;
function mount(){
 const camera=document.getElementById('klkStatusCamera');
 if(!camera||camera.querySelector('[data-status-music]'))return;
 const host=document.createElement('div');host.dataset.statusMusic='';
 host.innerHTML='<button type="button" data-music-open>♫ Añadir música</button><input type="file" accept="audio/*" hidden aria-label="Seleccionar audio"><section data-music-editor hidden><strong data-music-name></strong><label>Inicio <input type="range" data-music-start min="0" max="0" step="0.1" value="0"></label><span data-music-range></span><button type="button" data-music-play>▶ Escuchar</button><button type="button" data-music-remove>Quitar</button><small>Vista previa solamente. La música aún no se incorpora al archivo publicado.</small></section>';
 const css=document.createElement('style');
 css.textContent='#klkStatusCamera [data-status-music]{position:absolute;top:calc(env(safe-area-inset-top,0px) + 76px);right:12px;z-index:12;max-width:min(80vw,290px);color:#fff;font:14px system-ui}#klkStatusCamera [data-status-music] button{border:0;border-radius:18px;background:#25202bcc;color:#fff;padding:9px 12px}#klkStatusCamera [data-music-editor]{background:#16131de8;border-radius:15px;padding:12px;margin-top:8px;display:grid;gap:8px}#klkStatusCamera [data-music-editor][hidden]{display:none}#klkStatusCamera [data-music-editor] input{width:100%}#klkStatusCamera [data-music-editor] small{color:#ffdfac}';
 camera.append(css,host);
 const input=host.querySelector('input'),editor=host.querySelector('[data-music-editor]'),start=host.querySelector('[data-music-start]'),range=host.querySelector('[data-music-range]');
 const stop=()=>{if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}if(url){URL.revokeObjectURL(url);url=''}selected=null;editor.hidden=true};
 const fmt=n=>Number.isFinite(n)?Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0'):'0:00';
 const sync=()=>{if(!audio)return;const a=Number(start.value);range.textContent=fmt(a)+' – '+fmt(Math.min(audio.duration,a+30));};
 host.querySelector('[data-music-open]').onclick=()=>input.click();
 host.querySelector('[data-music-remove]').onclick=()=>{stop();input.value=''};
 host.querySelector('[data-music-play]').onclick=()=>{if(!audio)return;if(!audio.paused){audio.pause();return}audio.currentTime=Number(start.value);audio.play().catch(()=>{});};
 start.oninput=sync;
 input.onchange=()=>{
  stop();const file=input.files&&input.files[0];if(!file)return;
  if(!file.type.startsWith('audio/')||file.size>MAX_BYTES){alert('Selecciona un audio compatible de hasta 30 MB.');input.value='';return}
  selected=file;url=URL.createObjectURL(file);audio=new Audio();audio.preload='metadata';
  audio.onloadedmetadata=()=>{if(!Number.isFinite(audio.duration)||audio.duration<=0){stop();alert('No se pudo leer la duración.');return}start.max=String(Math.max(0,audio.duration-1));start.value='0';host.querySelector('[data-music-name]').textContent=file.name;editor.hidden=false;sync()};
  audio.ontimeupdate=()=>{if(audio&&audio.currentTime>=Number(start.value)+30)audio.pause()};
  audio.onerror=()=>{stop();alert('No se pudo abrir el audio.')};audio.src=url;
 };
 const observer=new MutationObserver(()=>{if(!camera.isConnected){stop();observer.disconnect()}else if(!camera.classList.contains('open')&&audio&&!audio.paused)audio.pause()});
 observer.observe(camera,{attributes:true,attributeFilter:['class']});observer.observe(document.body,{childList:true});
 window.klkStatusMusicPreview=()=>selected?{name:selected.name,start:Number(start.value),duration:Math.min(30,Math.max(0,(audio&&audio.duration||0)-Number(start.value)))}:null;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
const observer=new MutationObserver(()=>{if(document.getElementById('klkStatusCamera')){mount();observer.disconnect()}});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();