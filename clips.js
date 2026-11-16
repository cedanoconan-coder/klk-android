/* KLK Clips v2 — standalone, local-only interactive prototype. No backend, no public uploads. */
(()=>{'use strict';
const $=(root,sel)=>root.querySelector(sel);
function init(){
 const root=document.getElementById('clipsPanel');if(!root||root.dataset.ready)return;root.dataset.ready='1';
 root.innerHTML=`<header class="clipsHead"><strong>▶ KLK Clips <small>DEMO</small></strong><button id="clipsCreate" type="button">＋ Crear</button></header>
 <nav class="clipsTabs" aria-label="Explorar videos"><button data-feed="foryou" aria-pressed="true">Para ti</button><button data-feed="following" aria-pressed="false">Siguiendo</button><button data-feed="mine" aria-pressed="false">Mis clips</button></nav>
 <div class="clipsNotice" role="note">DEMO PRIVADA · Sin publicaciones públicas</div>
 <div class="clipsStage" tabindex="0" aria-label="Visor de clips. Usa flechas arriba y abajo para cambiar">
 <div class="clipsMedia"></div><div class="clipsEmpty"><span class="symbol">🎬</span><h2>KLK Clips</h2><p>Selecciona «Crear» para probar un video de tu teléfono. Desliza hacia arriba para cambiar entre tus clips.</p></div>
 <div class="clipsActions"><button type="button" data-action="sound" aria-label="Activar sonido">🔇</button><button data-action="like" aria-label="Me gusta">♡</button><button data-action="comment" aria-label="Comentarios">💬</button><button data-action="follow" aria-label="Seguir creador">＋</button><button data-action="share" aria-label="Compartir">↗</button><button data-action="report" aria-label="Denunciar">⚑</button></div>
 <div class="clipsCaption"><strong class="clipsAuthor">@KLKManin</strong><p class="clipsDescription">Tu espacio para crear y descubrir.</p><span class="clipsCounter"></span></div>
 <button class="clipsNext" type="button" aria-label="Siguiente video">↓ Siguiente</button></div>
 <div class="clipsFooter" id="clipsFeedback" role="status" aria-live="polite">Tus chats y contactos no se utilizan en esta demostración.</div>
 <div class="clipsModal" id="clipsModal" hidden><div class="clipsDialog" role="dialog" aria-modal="true" aria-labelledby="clipsDialogTitle"><h3 id="clipsDialogTitle">Crear clip de prueba</h3><label>Video de tu teléfono (hasta 60 segundos)<input id="clipsFile" type="file" accept="video/*"></label><label>Descripción<textarea id="clipsDescriptionInput" maxlength="200" rows="3" placeholder="¿Qué quieres contar?"></textarea></label><p id="clipsFormError" role="alert"></p><button type="button" id="clipsAdd">Añadir a mi demo</button><button type="button" id="clipsClose" class="secondary">Cancelar</button></div></div>
 <div class="clipsModal" id="clipsCommentsModal" hidden><div class="clipsDialog" role="dialog" aria-modal="true" aria-label="Comentarios de prueba"><h3>Comentarios</h3><div id="clipsCommentsList"></div><label>Escribe un comentario<input id="clipsCommentInput" maxlength="180" placeholder="Comentario de prueba"></label><button id="clipsCommentSend" type="button">Comentar</button><button id="clipsCommentsClose" type="button" class="secondary">Cerrar</button></div></div>`;
 const stage=$(root,'.clipsStage'),media=$(root,'.clipsMedia'),empty=$(root,'.clipsEmpty'),feedback=$(root,'#clipsFeedback'),modal=$(root,'#clipsModal'),commentsModal=$(root,'#clipsCommentsModal');
 const clips=[];let index=0,feed='foryou',startY=null;const following=new Set(['KLKManin']);
 const current=()=>{const items=clips.filter(c=>feed!=='following'||following.has(c.author));return {items,clip:items[index]||null};};
 function notify(s){feedback.textContent=s;}
 function render(){
  const {items,clip}=current();media.replaceChildren();empty.hidden=!!clip;
  $(root,'.clipsActions').hidden=!clip;$(root,'.clipsCaption').hidden=!clip;$(root,'.clipsNext').hidden=items.length<2;
  if(!clip){empty.querySelector('p').textContent=feed==='following'?'Aún no tienes clips de creadores seguidos.':'Añade un video con «Crear» para probar el reproductor.';return;}
  const video=document.createElement('video');video.src=clip.url;video.controls=false;video.muted=true;video.playsInline=true;video.loop=true;video.preload='auto';video.autoplay=true;video.addEventListener('click',()=>{if(video.paused)video.play().catch(()=>{});else video.pause();});video.addEventListener('loadeddata',()=>video.play().catch(()=>notify('Toca el video para reproducirlo.')));video.setAttribute('aria-label','Video de '+clip.author);media.append(video);video.play().catch(()=>{});
  $(root,'.clipsAuthor').textContent='@'+clip.author;$(root,'.clipsDescription').textContent=clip.description||'Mi nuevo clip';$(root,'.clipsCounter').textContent=(index+1)+' de '+items.length;
  $(root,'[data-action="sound"]').textContent='🔇';$(root,'[data-action="like"]').textContent=clip.liked?'♥':'♡';$(root,'[data-action="follow"]').textContent=following.has(clip.author)?'✓':'＋';
 }
 function next(delta){const {items}=current();if(items.length<2)return;index=(index+delta+items.length)%items.length;render();}
 $(root,'#clipsCreate').addEventListener('click',()=>{modal.hidden=false;$(root,'#clipsFormError').textContent='';$(root,'#clipsFile').focus();});
 function close(m){m.hidden=true;}
 $(root,'#clipsClose').addEventListener('click',()=>close(modal));
 $(root,'#clipsCommentsClose').addEventListener('click',()=>close(commentsModal));
 [modal,commentsModal].forEach(m=>m.addEventListener('click',e=>{if(e.target===m)close(m);}));
 $(root,'#clipsAdd').addEventListener('click',()=>{
  const file=$(root,'#clipsFile').files[0],err=$(root,'#clipsFormError');err.textContent='';
  if(!file||!file.type.startsWith('video/')){err.textContent='Selecciona un archivo de video válido.';return;}
  if(file.size>150*1024*1024){err.textContent='Para esta demo selecciona un video de menos de 150 MB.';return;}
  const url=URL.createObjectURL(file),probe=document.createElement('video');probe.preload='metadata';probe.src=url;
  probe.onloadedmetadata=()=>{if(!Number.isFinite(probe.duration)||probe.duration>60){URL.revokeObjectURL(url);err.textContent='El video debe durar como máximo 60 segundos.';return;}
   clips.push({url,author:'KLKManin',description:$(root,'#clipsDescriptionInput').value.trim(),liked:false,comments:[]});feed='foryou';index=clips.length-1;$(root,'#clipsFile').value='';$(root,'#clipsDescriptionInput').value='';close(modal);setFeed('foryou');index=clips.length-1;render();notify('Video añadido solo a esta demo. No se ha publicado.');};
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
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close(modal);close(commentsModal);}});
 window.addEventListener('pagehide',()=>clips.forEach(c=>URL.revokeObjectURL(c.url)),{once:true});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();