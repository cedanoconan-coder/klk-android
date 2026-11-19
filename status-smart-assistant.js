/* KLK Estados: asistente local de efectos. No sube imágenes ni analiza biometría. */
(()=>{'use strict';
function init(){
 const camera=document.getElementById('klkStatusCamera');
 if(!camera||camera.querySelector('.klkEffectCarousel'))return;
 const area=camera.querySelector('.klkCameraEffects');
 if(!area)return;
 const root=document.createElement('section');root.dataset.klkSmart='';root.className='klkSmartTools';
 root.innerHTML='<button type="button" class="klkSmartToggle" aria-expanded="false" aria-controls="klkSmartOptions">🦁 León · Ayuda creativa</button><div id="klkSmartOptions" hidden><p>Elige un estilo. León organiza los efectos disponibles en tu cámara, sin enviar tu imagen a servidores.</p><div class="klkSmartChoices"><button type="button" data-klk-style="natural">Natural</button><button type="button" data-klk-style="portrait">Retrato</button><button type="button" data-klk-style="creative">Creativo</button><button type="button" data-klk-style="beard">Barba</button><button type="button" data-klk-style="eyes">Ojos</button></div><p class="klkSmartFeedback" role="status" aria-live="polite"></p></div>';
 area.prepend(root);
 const toggle=root.querySelector('.klkSmartToggle'),options=root.querySelector('#klkSmartOptions'),feedback=root.querySelector('.klkSmartFeedback');
 toggle.addEventListener('click',()=>{options.hidden=!options.hidden;toggle.setAttribute('aria-expanded',String(!options.hidden))});
 const categories={natural:'filters',portrait:'beauty',creative:'creative',beard:'men',eyes:'eyes'};
 root.querySelectorAll('[data-klk-style]').forEach(button=>button.addEventListener('click',()=>{
   const style=button.dataset.klkStyle;
   const effectsButton=camera.querySelector('[data-cam="effects"]');
   const panel=camera.querySelector('.klkCameraEffectsPanel');
   if(panel?.hidden)effectsButton?.click();
   const tab=camera.querySelector('[data-effect-tab="'+categories[style]+'"]');
   if(!tab){feedback.textContent='Este efecto no está disponible en esta versión.';return}
   tab.click();
   if(style==='natural'){
     camera.querySelector('[data-eye-color="none"]')?.click();
     camera.querySelector('[data-selfie-filter="normal"]')?.click();
     camera.querySelector('[data-skin-preset="0"]')?.click();
     camera.querySelector('[data-man-look="none"]')?.click();
   }
   root.querySelectorAll('[data-klk-style]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   feedback.textContent=style==='natural'?'Efectos naturales seleccionados.':'Categoría abierta. Elige el efecto que prefieras.';
 }));
 // Mantener la vista previa libre: controles en una bandeja inferior compacta.
 const compactStyle=document.createElement('style');
 compactStyle.id='klk-status-compact-layout';
 compactStyle.textContent=`
 #klkStatusCamera{overflow:hidden}
 #klkStatusCamera .klkCameraEffects{position:static;flex:0 0 auto;min-width:0}
 #klkStatusCamera .klkSmartTools{position:fixed;left:12px;bottom:calc(112px + env(safe-area-inset-bottom));z-index:5;width:auto;max-width:calc(100vw - 24px);margin:0;padding:0;background:transparent}
 #klkStatusCamera .klkSmartToggle{font-size:13px!important;padding:9px 12px!important;border-radius:24px!important;background:#24252bcc!important;color:#fff!important}
 #klkStatusCamera #klkSmartOptions{position:absolute;left:0;bottom:45px;width:min(290px,calc(100vw - 24px));max-height:28vh;overflow-y:auto;padding:12px;border-radius:16px;background:#202127ee;box-sizing:border-box}
 #klkStatusCamera #klkSmartOptions[hidden]{display:none!important}
 #klkStatusCamera .klkCameraEffectsPanel:not([hidden]){position:fixed;z-index:6;left:8px;right:8px;bottom:calc(92px + env(safe-area-inset-bottom));width:auto!important;max-width:none!important;max-height:min(23vh,190px);overflow:auto;overscroll-behavior:contain;box-sizing:border-box;display:block!important;padding:12px!important;border-radius:18px;background:#202127ed;box-shadow:0 4px 22px #0006}
 #klkStatusCamera .klkCameraEffectsPanel *{max-width:100%;box-sizing:border-box}
 #klkStatusCamera .klkCameraEffectsPanel .klkEffectCategories{display:flex;flex-wrap:nowrap;gap:6px;overflow-x:auto;scrollbar-width:none}
 #klkStatusCamera .klkCameraEffectsPanel .klkEffectCategories button{flex:0 0 auto;white-space:nowrap}
 #klkStatusCamera .klkCameraEffectsPanel .klkEffectChoices{display:flex;gap:8px;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}
 #klkStatusCamera .klkCameraEffectsPanel .klkEffectChoices button{flex:0 0 auto;white-space:nowrap}
 #klkStatusCamera .klkCameraEffectsPanel [class*="tabs"],#klkStatusCamera .klkCameraEffectsPanel [class*="Tabs"]{max-width:100%;overflow-x:auto;scrollbar-width:thin}
 #klkStatusCamera .klkCameraEffectsPanel button{font-size:13px!important;padding:8px 10px!important}
 #klkStatusCamera .klkCameraEffectsPanel[hidden]{display:none!important}
 #klkStatusCamera .klkCompactClose{position:sticky;top:0;float:right;z-index:10;padding:6px 10px!important;background:#fff!important;color:#171717!important;font-size:12px!important}
 @media(max-height:650px){#klkStatusCamera .klkCameraEffectsPanel:not([hidden]){max-height:26vh}#klkStatusCamera .klkSmartTools{bottom:calc(96px + env(safe-area-inset-bottom))}}
 `;
 document.head.appendChild(compactStyle);
 const panel=camera.querySelector('.klkCameraEffectsPanel');
 if(panel){
   panel.hidden=true;
   const close=document.createElement('button');close.type='button';close.className='klkCompactClose';close.textContent='✕ Ocultar';close.setAttribute('aria-label','Ocultar efectos y ver rostro');
   close.addEventListener('click',()=>{panel.hidden=true;options.hidden=true;toggle.setAttribute('aria-expanded','false')});
   panel.prepend(close);
   // Al elegir un efecto se conserva la vista previa de la cara.
   panel.addEventListener('click',event=>{
     if(event.target.closest('.klkCompactClose'))return;
     if(event.target.closest('[data-effect-tab]'))return;
     if(event.target.closest('button[data-man-look],button[data-eye-color],button[data-selfie-filter],button[data-skin-preset]')){
       setTimeout(()=>{panel.hidden=true},250);
     }
   });
 }

 // Carrusel central inspirado en la referencia: arrastrar para cambiar de efecto.
 const carousel=document.createElement('div');carousel.className='klkEffectCarousel';
 carousel.setAttribute('role','group');carousel.setAttribute('aria-label','Desliza los efectos al círculo central');
 const track=document.createElement('div');track.className='klkEffectTrack';
 carousel.innerHTML='<div class="klkEffectCenter" aria-hidden="true"></div>';
 carousel.appendChild(track);camera.appendChild(carousel);
 carousel.hidden=false;
 const effectsTrigger=camera.querySelector('[data-cam="effects"]');
 effectsTrigger?.setAttribute('aria-expanded','true');
 effectsTrigger?.addEventListener('click',event=>{event.stopImmediatePropagation();carousel.hidden=false;effectsTrigger.setAttribute('aria-expanded','true');if(selected>=0)requestAnimationFrame(()=>centerTile(selected,false));},true);
 const carouselCSS=document.createElement('style');carouselCSS.id='klk-status-effect-carousel';
 carouselCSS.textContent=`
 #klkStatusCamera .klkSmartTools,#klkStatusCamera .klkCameraEffectsPanel,#klkStatusCamera .klkCameraEffects .klkEffectTabs{display:none!important}
 #klkStatusCamera .klkEffectCarousel[hidden]{display:none!important}
 #klkStatusCamera [data-cam="effects"]{display:none!important}
 #klkStatusCamera .klkEffectCarousel{position:fixed!important;z-index:20!important;left:0!important;right:0!important;bottom:calc(90px + env(safe-area-inset-bottom))!important;height:92px!important;pointer-events:auto!important}
 #klkStatusCamera .klkEffectTrack{width:100%!important;height:92px!important;display:flex!important;align-items:center!important;gap:16px!important;overflow-x:auto!important;overscroll-behavior-x:contain!important;scroll-snap-type:x mandatory!important;scrollbar-width:none!important;padding-inline:max(0px,calc(50% - 36px))!important;box-sizing:border-box!important}
 #klkStatusCamera .klkEffectTrack::-webkit-scrollbar{display:none!important}
 #klkStatusCamera .klkEffectTile{flex:0 0 72px!important;width:72px!important;height:72px!important;min-width:72px!important;max-width:72px!important;min-height:72px!important;max-height:72px!important;overflow:hidden!important;scroll-snap-align:center!important;border:2px solid #ffffff70!important;border-radius:50%!important;background:#292c36e8!important;color:white!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;padding:5px!important;font-size:11px!important;line-height:1.1!important;text-align:center!important;box-sizing:border-box!important}
 #klkStatusCamera .klkEffectTile[aria-selected="true"]{border:3px solid white!important;box-shadow:0 0 0 3px #ffffff88!important;background:#1769db!important}
 #klkStatusCamera .klkEffectTile span:last-child{display:block!important;width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:10px!important}
 #klkStatusCamera .klkEffectTile .klkEffectSymbol{font-size:24px!important;line-height:1!important}
 #klkStatusCamera .klkEffectCenter{position:absolute!important;left:50%!important;top:10px!important;transform:translateX(-50%)!important;width:72px!important;height:72px!important;border-radius:50%!important;border:2px solid #fff8!important;pointer-events:none!important;z-index:2!important}
 @media(max-height:650px){#klkStatusCamera .klkEffectCarousel{bottom:calc(74px + env(safe-area-inset-bottom))!important}}
 `;
 document.head.appendChild(carouselCSS);
 // El indicador central permanece fijo y no debe interceptar gestos.
 const symbols={eyes:'👁️',beauty:'✨',filters:'🎨',face:'😊',men:'🧔',creative:'🌈'};
 const entries=[];
 camera.querySelectorAll('[data-effect-category]').forEach(group=>{
   const category=group.dataset.effectCategory;
   group.querySelectorAll('.klkEffectChoices button').forEach(original=>{
     const tile=document.createElement('button');tile.type='button';tile.className='klkEffectTile';
     tile.setAttribute('aria-label',category+' · '+original.textContent.trim());
     tile.setAttribute('aria-selected','false');
     const symbol=document.createElement('span');symbol.className='klkEffectSymbol';symbol.textContent=symbols[category]||'✨';
     const label=document.createElement('span');label.textContent=original.matches('[data-man-look="full"]')?'Barba completa':original.textContent.trim();
     tile.append(symbol,label);track.appendChild(tile);
     entries.push({tile,original,category});
   });
 });
 let selected=-1,scrollDebounce=0;
 function centerTile(index,smooth=true){const tile=entries[index]?.tile;if(!tile)return;const target=tile.offsetLeft+(tile.offsetWidth/2)-(track.clientWidth/2);track.scrollTo({left:Math.max(0,target),behavior:smooth?'smooth':'auto'});}
 function selectEffect(index,scroll=true){
   if(index<0||index>=entries.length||index===selected)return;
   selected=index;
   window.KLKBeardMask?.setEnabled(false);
   const item=entries[index];
   const tab=camera.querySelector('[data-effect-tab="'+item.category+'"]');
   if(tab && tab.getAttribute('aria-selected')!=='true')tab.click();
   item.original.click();
   entries.forEach((entry,i)=>entry.tile.setAttribute('aria-selected',String(i===index)));
   if(scroll)centerTile(index);
 }
 entries.forEach((item,index)=>item.tile.addEventListener('click',()=>{selectEffect(index);centerTile(index)}));
 // Acceso directo: el catálogo horizontal puede ocultar la barba completa en móviles.
 const fullBeardIndex=entries.findIndex(entry=>entry.original.matches('[data-man-look="full"]'));
 if(fullBeardIndex>=0){
   const fullBeardButton=document.createElement('button');
   fullBeardButton.type='button';
   fullBeardButton.className='klkFullBeardShortcut';
   fullBeardButton.textContent='🧔 Barba completa';
   fullBeardButton.setAttribute('aria-label','Activar barba completa');
   fullBeardButton.style.cssText='position:fixed;z-index:22;right:12px;bottom:calc(200px + env(safe-area-inset-bottom));padding:10px 14px;border:1px solid #fff8;border-radius:24px;background:#302044ed;color:#fff;font-size:13px;font-weight:700';
   camera.appendChild(fullBeardButton);
   fullBeardButton.addEventListener('click',()=>{
     selectEffect(fullBeardIndex);
     centerTile(fullBeardIndex,false);
     fullBeardButton.setAttribute('aria-pressed','true');
   });
 }

 // Recentrar al rotar el dispositivo o cambiar el tamaño de la cámara.
 window.addEventListener('resize',()=>{if(selected>=0)centerTile(selected,false)},{passive:true});
 track.addEventListener('scroll',()=>{
   clearTimeout(scrollDebounce);
   scrollDebounce=setTimeout(()=>{
     const center=track.getBoundingClientRect().left+track.clientWidth/2;
     let best=0,distance=Infinity;
     entries.forEach((entry,i)=>{
       const rect=entry.tile.getBoundingClientRect();const mid=rect.left+rect.width/2;
       const diff=Math.abs(mid-center);
       if(diff<distance){distance=diff;best=i}
     });
     selectEffect(best,false);
     centerTile(best,false);
   },110);
 },{passive:true});
 // León AI Effects: preset local editable. Reutiliza los efectos existentes; no afirma generar geometría nueva.
 const beardEntry=entries.findIndex(e=>e.category==='men' && /barba|beard/i.test(e.original.textContent));
 if(beardEntry>=0){
   const preset=document.createElement('button');
   preset.type='button';preset.className='klkBeardPreset';
   preset.textContent='🦁 Barba negra natural';
   preset.setAttribute('aria-label','Aplicar efecto de barba existente');
   preset.style.cssText='position:fixed;z-index:21;right:12px;bottom:calc(190px + env(safe-area-inset-bottom));width:auto;max-width:50vw;margin:0;padding:9px 12px;border-radius:22px;background:#24252bdc;color:white;font-size:12px';
   camera.appendChild(preset);
   preset.addEventListener('click',async()=>{
     selectEffect(beardEntry);preset.setAttribute('aria-pressed','true');
     window.KLKBeardMask?.setEnabled(true);
     if(!window.KLKMediaPipeFace)return;
     preset.disabled=true;
     try{await window.KLKMediaPipeFace.initialize()}catch(error){console.warn('León: seguimiento facial no disponible',error);preset.title='No se pudo iniciar seguimiento facial'}
     finally{preset.disabled=false}
   });
 }
 // Mantener el carrusel accesible incluso cuando no haya efectos disponibles.
 if(!entries.length){const msg=document.createElement('span');msg.textContent='No hay efectos disponibles';msg.style.cssText='color:white;margin:auto';track.appendChild(msg)}
 // Empezar sin efecto y mantener el círculo centrado.
 const natural=entries.findIndex(e=>e.category==='eyes'&&e.original.dataset.eyeColor==='none');
 requestAnimationFrame(()=>{if(natural>=0){selected=-1;selectEffect(natural,false);centerTile(natural,false)}});

}
function addEntry(){
 const updates=document.getElementById('updatesPanel');
 if(!updates||updates.querySelector('[data-klk-smart-entry]'))return;
 const row=updates.querySelector('.myStatusRow')||document.getElementById('addStatusButton');
 if(!row)return;
 const button=document.createElement('button');
 button.type='button';button.dataset.klkSmartEntry='';
 button.textContent='🦁 Estados inteligentes · Abrir cámara y efectos';
 button.setAttribute('aria-label','Abrir cámara de Estados inteligentes');
 button.style.cssText='display:block;width:calc(100% - 32px);margin:10px 16px;padding:14px;border-radius:14px;background:#efe9ff;color:#3d2474;border:1px solid #d7c8ff;font-size:15px;font-weight:700;text-align:left';
 row.insertAdjacentElement('afterend',button);
 button.addEventListener('click',()=>{
   const trigger=document.getElementById('statusCameraButton');
   if(!trigger){button.textContent='Cámara no disponible en esta versión';return}
   trigger.click();
   init();
 });
}
function start(){init();addEntry()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();