/* KLK Clips: safe UI preview. Publishing requires a separately secured backend. */
(function(){
'use strict';
function init(){
 const panel=document.getElementById('clipsPanel');if(!panel||panel.dataset.ready)return;panel.dataset.ready='1';
 panel.innerHTML='<div class="clipsHead"><strong>▶ KLK Clips</strong><button type="button" id="clipsCreate">＋ Crear</button></div><div class="clipsTabs" role="tablist" aria-label="Descubrir clips"><button type="button" role="tab" aria-selected="true" data-feed="foryou">Para ti</button><button type="button" role="tab" aria-selected="false" data-feed="following">Siguiendo</button></div><div class="clipsNotice">Vista previa: los videos públicos y las publicaciones se habilitarán cuando estén listas las reglas de seguridad.</div><div class="clipsStage"><div class="clipsEmpty"><span class="symbol">🎬</span><h2>Bienvenido a KLK Clips</h2><p>Descubre videos cortos de la comunidad KLK. Próximamente podrás publicar, seguir creadores y compartir.</p></div><div class="clipsActions"><button type="button" title="Me gusta" aria-label="Me gusta" data-soon="Me gusta">♡</button><button type="button" title="Comentarios" aria-label="Comentarios" data-soon="Comentarios">☏</button><button type="button" title="Compartir" aria-label="Compartir" data-soon="Compartir">➤</button></div><div class="clipsCaption"><strong>@KLKManin</strong><div>Tu espacio para crear y descubrir.</div></div></div><div class="clipsFooter" id="clipsFeedback" role="status" aria-live="polite">Tus chats, contactos y estados siguen siendo privados.</div><div class="clipsModal" id="clipsModal" hidden><div class="clipsDialog" role="dialog" aria-modal="true" aria-labelledby="clipsDialogTitle"><h3 id="clipsDialogTitle">Crear clip</h3><label>Selecciona un video (máximo 60 segundos)<input id="clipsFile" type="file" accept="video/*"></label><label>Descripción<textarea id="clipsDescription" maxlength="200" rows="3" placeholder="Describe tu clip..."></textarea></label><button type="button" id="clipsPreview">Vista previa local</button><button type="button" id="clipsClose" class="secondary">Cerrar</button><div id="clipsPreviewBox"></div></div></div>';
 const feedback=panel.querySelector('#clipsFeedback'),modal=panel.querySelector('#clipsModal');let objectUrl=null;
 panel.querySelectorAll('[data-feed]').forEach(b=>b.addEventListener('click',()=>{panel.querySelectorAll('[data-feed]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));feedback.textContent=b.dataset.feed==='following'?'Aquí aparecerán los clips de los creadores que sigas.':'Aquí aparecerán los clips públicos recomendados.';}));
 panel.querySelectorAll('[data-soon]').forEach(b=>b.addEventListener('click',()=>feedback.textContent=b.dataset.soon+' estará disponible al activar KLK Clips.'));
 panel.querySelector('#clipsCreate').addEventListener('click',()=>{modal.hidden=false;panel.querySelector('#clipsFile').focus();});
 function close(){modal.hidden=true;if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}panel.querySelector('#clipsPreviewBox').replaceChildren();}
 panel.querySelector('#clipsClose').addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close();});
 panel.querySelector('#clipsPreview').addEventListener('click',()=>{
  const file=panel.querySelector('#clipsFile').files[0],box=panel.querySelector('#clipsPreviewBox');box.replaceChildren();
  if(!file||!file.type.startsWith('video/')){box.textContent='Selecciona un archivo de video válido.';return;}
  if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(file);
  const video=document.createElement('video');video.src=objectUrl;video.controls=true;video.preload='metadata';video.style.cssText='width:100%;max-height:45dvh';
  video.addEventListener('loadedmetadata',()=>{if(!Number.isFinite(video.duration)||video.duration>60){box.textContent='El video debe durar 60 segundos o menos.';video.remove();}});
  box.append(video);const note=document.createElement('p');note.textContent='Vista previa en tu teléfono: todavía no se publica ni se comparte este archivo.';box.append(note);
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();