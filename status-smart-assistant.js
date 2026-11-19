/* KLK Estados: asistente local de efectos. No sube imágenes ni analiza biometría. */
(()=>{'use strict';
function init(){
 const camera=document.getElementById('klkStatusCamera');
 if(!camera||camera.querySelector('[data-klk-smart]'))return;
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
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();