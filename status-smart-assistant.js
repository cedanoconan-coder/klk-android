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

 // Control exclusivo de paneles: la cámara siempre se abre despejada.
 const effectsButton=camera.querySelector('[data-cam="effects"]');
 const effectsPanel=camera.querySelector('.klkCameraEffectsPanel');
 const style=document.createElement('style');
 style.id='klk-status-exclusive-panels';
 style.textContent=`
 #klkStatusCamera .klkCameraEffects{position:static!important;padding:0!important;min-height:0!important}
 #klkStatusCamera .klkSmartTools{position:fixed!important;z-index:12!important;top:calc(env(safe-area-inset-top) + 90px)!important;left:10px!important;bottom:auto!important;width:auto!important;max-width:calc(100vw - 20px)!important;padding:0!important;margin:0!important;background:transparent!important}
 #klkStatusCamera .klkSmartToggle{font-size:12px!important;padding:7px 10px!important;min-height:36px!important;background:#24252bdb!important;color:#fff!important;border-radius:20px!important}
 #klkStatusCamera #klkSmartOptions:not([hidden]){position:fixed!important;z-index:13!important;top:auto!important;left:8px!important;right:8px!important;bottom:calc(110px + env(safe-area-inset-bottom))!important;width:auto!important;max-height:25dvh!important;overflow-y:auto!important;box-sizing:border-box!important;padding:10px!important;margin:0!important;background:#202127f2!important}
 #klkStatusCamera #klkSmartOptions[hidden],#klkStatusCamera .klkCameraEffectsPanel[hidden]{display:none!important}
 #klkStatusCamera [data-cam="effects"]{position:fixed!important;z-index:11!important;right:10px!important;top:calc(env(safe-area-inset-top) + 90px)!important;bottom:auto!important;padding:7px 10px!important;min-height:36px!important;font-size:12px!important;background:#24252bdb!important;color:#fff!important}
 #klkStatusCamera .klkCameraEffectsPanel:not([hidden]){position:fixed!important;z-index:14!important;left:8px!important;right:8px!important;top:auto!important;bottom:calc(105px + env(safe-area-inset-bottom))!important;width:auto!important;max-width:none!important;max-height:30dvh!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;box-sizing:border-box!important;display:block!important;padding:10px!important;margin:0!important;border-radius:16px!important;background:#202127f2!important}
 #klkStatusCamera .klkEffectCategories{display:flex!important;flex-wrap:nowrap!important;max-width:100%!important;overflow-x:auto!important;justify-content:flex-start!important;gap:6px!important}
 #klkStatusCamera .klkEffectCategories button{flex:0 0 auto!important}
 #klkStatusCamera .klkCameraEffectsPanel [data-effect-category]{max-width:100%!important;overflow-x:auto!important}
 #klkStatusCamera .klkCameraEffectsPanel button{font-size:12px!important;padding:7px 9px!important}
 #klkStatusCamera .klkCompactClose{position:sticky!important;top:0!important;float:right!important;z-index:16!important;background:#eee!important;color:#111!important}
 `;
 document.head.appendChild(style);
 const hideSmart=()=>{options.hidden=true;toggle.setAttribute('aria-expanded','false')};
 const hideEffects=()=>{if(effectsPanel)effectsPanel.hidden=true;effectsButton?.setAttribute('aria-expanded','false')};
 hideSmart();hideEffects();
 // Capture listeners run before the original camera onclick handler.
 effectsButton?.addEventListener('click',()=>hideSmart(),true);
 toggle.addEventListener('click',()=>hideEffects(),true);
 if(effectsPanel){
   const close=document.createElement('button');close.type='button';close.className='klkCompactClose';close.textContent='✕ Ocultar';
   close.setAttribute('aria-label','Ocultar controles para ver el rostro');
   close.addEventListener('click',()=>hideEffects());
   effectsPanel.prepend(close);
   effectsPanel.addEventListener('click',event=>{
     if(event.target.closest('[data-effect-tab]'))return;
     if(event.target.closest('[data-man-look],[data-eye-color],[data-selfie-filter],[data-skin-preset]')){
       setTimeout(hideEffects,200);
     }
   });
 }
 // Al salir y volver a abrir la cámara, cerrar los controles anteriores.
 const observer=new MutationObserver(()=>{
   if(!camera.classList.contains('open')){hideSmart();hideEffects()}
 });
 observer.observe(camera,{attributes:true,attributeFilter:['class']});

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