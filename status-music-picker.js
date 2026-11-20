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
 host.innerHTML='<button type="button" data-music-open aria-label="Añadir música" aria-expanded="false">♫ Añadir música</button><input type="file" accept="audio/*" hidden aria-label="Seleccionar audio"><section data-music-editor hidden><div data-music-row><button type="button" data-music-play aria-label="Reproducir fragmento">▶</button><strong data-music-name></strong><span data-music-range></span><button type="button" data-music-expand aria-label="Ajustar fragmento" aria-expanded="false">⌄</button><button type="button" data-music-change aria-label="Cambiar canción">♫</button><button type="button" data-music-remove aria-label="Quitar música">×</button></div><div data-music-details hidden><label>Inicio <input type="range" data-music-start min="0" max="0" step="0.1" value="0"></label><small>Vista previa solamente. La música aún no se incorpora al archivo publicado.</small></div></section>';
 const css=document.createElement('style');
 css.textContent='#klkStatusCamera [data-status-music]{position:absolute;top:calc(env(safe-area-inset-top,0px) + 76px);left:12px;right:12px;z-index:12;color:#fff;font:14px system-ui;pointer-events:none}#klkStatusCamera [data-status-music]>*{pointer-events:auto}#klkStatusCamera [data-status-music]>[data-music-open]{display:block;margin:0 auto;border:0;border-radius:22px;background:#25202bcc;color:#fff;padding:9px 14px}#klkStatusCamera [data-music-editor]{background:#16131ddc;border-radius:22px;padding:6px 8px;margin:8px auto 0;max-width:420px;box-shadow:0 3px 12px #0005}#klkStatusCamera [data-music-editor][hidden],#klkStatusCamera [data-music-details][hidden]{display:none}#klkStatusCamera [data-music-row]{display:flex;align-items:center;gap:8px;min-height:38px}#klkStatusCamera [data-music-row] strong{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}#klkStatusCamera [data-music-row] span{font-size:12px;white-space:nowrap}#klkStatusCamera [data-music-row] button{flex-shrink:0;border:0;border-radius:50%;background:#39343ecc;color:#fff;width:32px;height:32px;padding:0;font-size:19px}#klkStatusCamera [data-music-details]{padding:6px 10px 10px;display:grid;gap:8px}#klkStatusCamera [data-music-details] label{display:grid;gap:5px}#klkStatusCamera [data-music-details] input{width:100%}#klkStatusCamera [data-music-details] small{color:#ffdfac;font-size:11px}';
 css.textContent+='#klkStatusCamera [data-status-music]>[data-music-open][hidden]{display:none}#klkStatusCamera [data-music-editor] button{margin:0}#klkStatusCamera [data-music-row] strong{font-weight:600}#klkStatusCamera [data-music-details] input{margin:0;padding:0}';camera.append(css,host);
 const input=host.querySelector('input'),editor=host.querySelector('[data-music-editor]'),start=host.querySelector('[data-music-start]'),range=host.querySelector('[data-music-range]');
 const details=host.querySelector('[data-music-details]'),expand=host.querySelector('[data-music-expand]'),play=host.querySelector('[data-music-play]');
 expand.onclick=()=>{details.hidden=!details.hidden;expand.setAttribute('aria-expanded',String(!details.hidden));expand.textContent=details.hidden?'⌄':'⌃'};
 const stop=()=>{details.hidden=true;expand.setAttribute('aria-expanded','false');expand.textContent='⌄';play.textContent='▶';if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}if(url){URL.revokeObjectURL(url);url=''}selected=null;editor.hidden=true;host.querySelector('[data-music-open]').hidden=false;host.querySelector('[data-music-open]').textContent='♫ Añadir música';host.querySelector('[data-music-open]').setAttribute('aria-expanded','false')};
 const fmt=n=>Number.isFinite(n)?Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0'):'0:00';
 const sync=()=>{if(!audio)return;const a=Number(start.value);range.textContent=fmt(a)+' – '+fmt(Math.min(audio.duration,a+40));};
 host.querySelector('[data-music-open]').onclick=()=>{if(!selected){input.click();return}editor.hidden=!editor.hidden;host.querySelector('[data-music-open]').setAttribute('aria-expanded',String(!editor.hidden));if(editor.hidden&&audio)audio.pause()};
 host.querySelector('[data-music-change]').onclick=()=>input.click();
 host.querySelector('[data-music-remove]').onclick=()=>{stop();input.value=''};
 play.onclick=()=>{if(!audio)return;if(!audio.paused){audio.pause();return}audio.currentTime=Number(start.value);audio.play().catch(()=>{});};
 start.oninput=()=>{sync();if(audio&&!audio.paused){audio.currentTime=Number(start.value)}};
 input.onchange=()=>{
  const file=input.files&&input.files[0];if(!file)return;stop();
  if(!file.type.startsWith('audio/')||file.size>MAX_BYTES){alert('Selecciona un audio compatible de hasta 30 MB.');input.value='';return}
  selected=file;url=URL.createObjectURL(file);audio=new Audio();audio.preload='metadata';
  audio.onloadedmetadata=()=>{if(!Number.isFinite(audio.duration)||audio.duration<=0){stop();alert('No se pudo leer la duración.');return}start.max=String(Math.max(0,audio.duration-1));start.value='0';host.querySelector('[data-music-name]').textContent=file.name;editor.hidden=true;details.hidden=true;expand.setAttribute('aria-expanded','false');expand.textContent='⌄';host.querySelector('[data-music-open]').hidden=false;host.querySelector('[data-music-open]').textContent='♫';host.querySelector('[data-music-open]').setAttribute('aria-label','Abrir ajustes de música');host.querySelector('[data-music-open]').setAttribute('aria-expanded','false');sync()};
  audio.onplay=()=>{play.textContent='Ⅱ';play.setAttribute('aria-label','Pausar fragmento')};audio.onpause=()=>{play.textContent='▶';play.setAttribute('aria-label','Reproducir fragmento')};
  audio.ontimeupdate=()=>{if(audio&&audio.currentTime>=Math.min(audio.duration,Number(start.value)+40))audio.pause()};
  audio.onerror=()=>{stop();alert('No se pudo abrir el audio.')};audio.src=url;
 };
 const observer=new MutationObserver(()=>{if(!camera.isConnected){stop();observer.disconnect()}else if(!camera.classList.contains('open')&&audio&&!audio.paused)audio.pause()});
 observer.observe(camera,{attributes:true,attributeFilter:['class']});observer.observe(document.body,{childList:true});
 window.klkStatusMusicPreview=()=>selected?{name:selected.name,start:Number(start.value),duration:Math.min(40,Math.max(0,(audio&&audio.duration||0)-Number(start.value)))}:null;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
const observer=new MutationObserver(()=>{if(document.getElementById('klkStatusCamera')){mount();observer.disconnect()}});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();