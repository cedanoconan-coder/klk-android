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
 #klkStatusCamera .klkCameraEffectsPanel:not([hidden]){position:fixed;z-index:6;left:8px;right:8px;bottom:calc(104px + env(safe-area-inset-bottom));width:auto!important;max-width:none!important;max-height:min(32vh,260px);overflow:auto;overscroll-behavior:contain;box-sizing:border-box;display:block!important;padding:12px!important;border-radius:18px;background:#202127ed;box-shadow:0 4px 22px #0006}
 #klkStatusCamera .klkCameraEffectsPanel *{max-width:100%;box-sizing:border-box}
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