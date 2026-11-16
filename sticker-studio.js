/* KLK sticker studio — local packs; images sent via existing authenticated media uploader. */
(()=>{"use strict";
const panel=document.getElementById("stickersPanel");if(!panel)return;
const style=document.createElement("style");style.textContent=`
#klkStudio{position:fixed;inset:0;z-index:100000;background:#101820d9;display:none;align-items:center;justify-content:center;padding:12px}
#klkStudio.open{display:flex}#klkStudio .sheet{width:min(440px,100%);max-height:94dvh;overflow:auto;background:#fff;color:#20272b;border-radius:20px;padding:16px;box-sizing:border-box}
#klkStudio canvas{display:block;width:min(100%,320px);aspect-ratio:1;margin:12px auto;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0/20px 20px;border-radius:12px;touch-action:none}
#klkStudio .actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}#klkStudio button{border:0;border-radius:10px;padding:10px;background:#eee;color:#222}#klkStudio button.primary{background:#7844b4;color:white}
#klkStudio input[type=text],#klkStudio select{width:100%;padding:9px;border:1px solid #ccc;border-radius:8px;box-sizing:border-box}
#klkSaved{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}#klkSaved button{padding:3px;background:#f2f2f2}#klkSaved img{width:100%;aspect-ratio:1;object-fit:contain}

#klkStudio{padding:0;align-items:flex-end;background:#101820aa}
#klkStudio .sheet{width:100%;max-width:540px;max-height:92dvh;border-radius:22px 22px 0 0;padding:14px 16px calc(18px + env(safe-area-inset-bottom));overscroll-behavior:contain}
#klkStudio .actions{gap:8px;margin:8px 0}
#klkStudio button{font:inherit;font-size:13px;font-weight:600;padding:9px 12px;min-height:38px}
#klkStudio .sheet>label{display:block;font-size:13px;font-weight:600;margin:10px 0}
#klkStudio input[type=file]{display:block;width:100%;max-width:100%;box-sizing:border-box;font-size:12px;margin-top:5px}
#klkStudio input[type=file]::file-selector-button{border:0;border-radius:10px;padding:9px;background:#f0edf6;color:#513476;font-weight:600;margin-right:7px}
#klkStudio .actions>label{min-width:0;flex:1 1 150px;font-size:12px;font-weight:600}
#klkStudio canvas{width:min(100%,220px);margin:10px auto}
#klkStudio h4{font-size:14px;margin:14px 0 8px}
#klkStudio #klkStickerNotice{display:block;font-size:12px;line-height:1.4;margin:8px 0}
@media(min-width:600px){#klkStudio{align-items:center;padding:12px}#klkStudio .sheet{border-radius:20px}}
`;document.head.appendChild(style);
const launch=document.createElement("button");launch.type="button";launch.textContent="＋ Crear sticker";launch.className="stickerChoice";launch.style.cssText="width:auto;aspect-ratio:auto;padding:8px;font-size:13px";panel.querySelector(".stickerContentArea")?.prepend(launch);
const modal=document.createElement("div");modal.id="klkStudio";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-label","Creador de stickers KLK");
modal.innerHTML='<div class="sheet"><div class="actions"><strong style="flex:1">🎨 Crear sticker KLK</strong><button id="klkClose" type="button">✕</button></div><label>Foto o GIF<input id="klkStickerFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label><div class="actions"><label style="flex:1">Importar stickers de WhatsApp (WEBP, PNG, GIF)<input id="klkImportFiles" type="file" accept="image/webp,image/png,image/gif" multiple></label><label style="flex:1">Seleccionar carpeta<input id="klkImportFolder" type="file" webkitdirectory multiple></label></div><canvas id="klkStickerCanvas" width="512" height="512"></canvas><label>Texto<input id="klkStickerText" type="text" maxlength="35" placeholder="Escribe algo divertido"></label><div class="actions"><button type="button" id="klkEmoji">😂 Emoji</button><button type="button" id="klkErase">Quitar fondo uniforme</button><button type="button" id="klkReset">Restablecer</button></div><label>Paquete<select id="klkPack"></select></label><div class="actions"><button id="klkNewPack" type="button">＋ Paquete</button><button id="klkSave" class="primary" type="button">Guardar</button><button id="klkSend" class="primary" type="button">Enviar</button></div><small id="klkStickerNotice" aria-live="polite">El recorte elimina fondos de color uniforme. Los GIF animados se envían como archivo para conservar la animación.</small><h4>Mis stickers (en este dispositivo)</h4><div id="klkSaved"></div></div>';

// Organización móvil: pestañas separadas y acciones fijas, sin alterar los datos guardados.
const sheet=modal.querySelector(".sheet");
sheet.classList.add("klk-organized");
const header=sheet.firstElementChild;
header.classList.add("klk-studio-header");
const title=header.querySelector("strong");title.textContent="🎨 Stickers KLK";
const tabs=document.createElement("nav");tabs.className="klk-studio-tabs";tabs.setAttribute("aria-label","Secciones de stickers");
const sections={};
for(const [id,label] of [["create","Crear"],["import","Importar"],["saved","Mis stickers"]]){
 const button=document.createElement("button");button.type="button";button.textContent=label;button.dataset.tab=id;button.setAttribute("aria-selected",id==="create"?"true":"false");tabs.append(button);
 const section=document.createElement("section");section.className="klk-studio-section";section.dataset.section=id;section.hidden=id!=="create";sections[id]=section;
}
header.after(tabs);
const fileLabel=sheet.querySelector("#klkStickerFile").closest("label");
const importActions=sheet.querySelector("#klkImportFiles").closest(".actions");
const preview=sheet.querySelector("#klkStickerCanvas");
const textLabel=sheet.querySelector("#klkStickerText").closest("label");
const editActions=sheet.querySelector("#klkEmoji").closest(".actions");
const packLabel=sheet.querySelector("#klkPack").closest("label");
const actionRow=sheet.querySelector("#klkSave").closest(".actions");
const newPack=sheet.querySelector("#klkNewPack");
const notice=sheet.querySelector("#klkStickerNotice");
const savedTitle=sheet.querySelector("h4");
const savedGrid=sheet.querySelector("#klkSaved");
sections.create.append(fileLabel,preview,textLabel,editActions,packLabel,newPack);
sections.import.append(importActions);
const importHelp=document.createElement("p");importHelp.className="klk-studio-hint";importHelp.textContent="Selecciona archivos WEBP, PNG o GIF de WhatsApp, o una carpeta. Se importarán al paquete elegido.";sections.import.prepend(importHelp);
const importPack=document.createElement("p");importPack.className="klk-studio-hint";importPack.textContent="Elige el paquete en la pestaña Crear antes de importar.";sections.import.append(importPack);
sections.saved.append(savedTitle,savedGrid);
tabs.after(sections.create,sections.import,sections.saved);
const footer=document.createElement("footer");footer.className="klk-studio-footer";footer.append(notice,actionRow);sheet.append(footer);
const extraStyle=document.createElement("style");extraStyle.textContent=`
#klkStudio .klk-organized{display:flex;flex-direction:column;overflow:hidden;padding:0;max-height:92dvh;font-size:14px}
#klkStudio .klk-studio-header{display:flex;align-items:center;gap:12px;margin:0;padding:16px;background:#743bb0;color:white;flex-shrink:0}
#klkStudio .klk-studio-header strong{font-size:19px}
#klkStudio .klk-studio-header button{margin-left:auto;background:#ffffff25;color:white;min-width:42px;font-size:21px}
#klkStudio .klk-studio-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:10px 12px;background:white;flex-shrink:0}
#klkStudio .klk-studio-tabs button{background:#f3eff8;color:#533475;padding:10px 4px;font-size:13px}
#klkStudio .klk-studio-tabs button[aria-selected=true]{background:#743bb0;color:white}
#klkStudio .klk-studio-section{overflow:auto;min-height:0;flex:1;padding:8px 16px 16px;overscroll-behavior:contain}
#klkStudio .klk-studio-section[hidden]{display:none}
#klkStudio .klk-studio-section>label{display:block;margin:12px 0;font-weight:600}
#klkStudio .klk-studio-section>label input,#klkStudio .klk-studio-section>label select{margin-top:7px}
#klkStudio .klk-studio-section canvas{width:min(100%,260px);margin:12px auto}
#klkStudio .klk-studio-section .actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
#klkStudio .klk-studio-section .actions button{white-space:normal;padding:10px 4px;min-width:0}
#klkStudio .klk-studio-section[data-section=import] .actions{grid-template-columns:repeat(2,minmax(0,1fr))}
#klkStudio .klk-studio-section[data-section=import] .actions label{min-width:0;overflow-wrap:anywhere}
#klkStudio .klk-studio-hint{font-size:13px;color:#625b69;line-height:1.5}
#klkStudio .klk-studio-footer{padding:8px 16px calc(12px + env(safe-area-inset-bottom));background:white;border-top:1px solid #e6e0eb;flex-shrink:0}
#klkStudio .klk-studio-footer .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0 0}
#klkStudio .klk-studio-footer button{background:#743bb0;color:white;min-height:46px;font-size:15px}
#klkStudio #klkStickerNotice{max-height:42px;overflow:auto;margin:0;font-size:12px}
#klkStudio #klkSaved{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
#klkStudio #klkSaved button{aspect-ratio:1;padding:4px;overflow:hidden}
#klkStudio #klkSaved img{display:block;height:100%}
@media(max-width:360px){#klkStudio .klk-studio-tabs button{font-size:12px}#klkStudio .klk-studio-section{padding:8px 12px}}
`;document.head.append(extraStyle);
function switchStudioTab(tab){for(const [id,section] of Object.entries(sections))section.hidden=id!==tab;tabs.querySelectorAll("button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===tab)))}
tabs.addEventListener("click",e=>{const b=e.target.closest("button[data-tab]");if(b)switchStudioTab(b.dataset.tab)});

document.body.appendChild(modal);
const $=id=>modal.querySelector("#"+id),canvas=$("klkStickerCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
let source=null,sourceFile=null,erase=false,chosen=null;
const key="klk-sticker-packs-v1";let packs;
try{packs=JSON.parse(localStorage.getItem(key)||'{"Mis stickers":[]}');if(!packs||typeof packs!=="object"||Array.isArray(packs))throw Error()}catch{packs={"Mis stickers":[]}}
function notice(s){$("klkStickerNotice").textContent=s}
function persist(){try{localStorage.setItem(key,JSON.stringify(packs));return true}catch{notice("No hay espacio local para guardar más stickers.");return false}}
function draw(){ctx.clearRect(0,0,512,512);if(source){const scale=Math.min(512/source.width,512/source.height),w=source.width*scale,h=source.height*scale;ctx.drawImage(source,(512-w)/2,(512-h)/2,w,h);if(erase){const data=ctx.getImageData(0,0,512,512),p=data.data;const corners=[0,(511)*4,(511*512)*4,(512*512-1)*4];let rgb=[0,1,2].map(c=>corners.reduce((sum,i)=>sum+p[i+c],0)/4);for(let i=0;i<p.length;i+=4){const d=Math.hypot(p[i]-rgb[0],p[i+1]-rgb[1],p[i+2]-rgb[2]);if(d<65)p[i+3]=0;else if(d<100)p[i+3]=Math.round(p[i+3]*(d-65)/35)}ctx.putImageData(data,0,0)}}const text=$("klkStickerText").value.trim();if(text){ctx.font="bold 42px sans-serif";ctx.textAlign="center";ctx.lineWidth=7;ctx.strokeStyle="#222";ctx.fillStyle="#fff";ctx.strokeText(text,256,465,475);ctx.fillText(text,256,465,475)}}
function refresh(){const select=$("klkPack"),previous=select.value;select.replaceChildren();Object.keys(packs).forEach(name=>{const o=document.createElement("option");o.value=o.textContent=name;select.append(o)});if(packs[previous])select.value=previous;const grid=$("klkSaved");grid.replaceChildren();(packs[select.value]||[]).forEach((item,i)=>{const b=document.createElement("button");b.type="button";const img=document.createElement("img");img.src=item.data;img.alt="Sticker guardado "+(i+1);b.append(img);b.onclick=()=>{chosen=item;notice("Sticker seleccionado. Pulsa Enviar para compartirlo.")};grid.append(b)})}
function open(){switchStudioTab("create");modal.classList.add("open");refresh();draw()}function close(){modal.classList.remove("open")}
launch.onclick=open;$("klkClose").onclick=close;modal.addEventListener("click",e=>{if(e.target===modal)close()});$("klkPack").onchange=refresh;
async function importStickers(files){const name=$("klkPack").value;let count=0,duplicates=0,invalid=0;const selected=Array.from(files||[]);const existing=new Set((packs[name]||[]).map(x=>x.data));for(const file of selected){if(!/\.(webp|png|gif)$/i.test(file.name)||file.size>10*1024*1024){invalid++;continue}let url;try{url=URL.createObjectURL(file);const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});const c=document.createElement("canvas");c.width=c.height=256;const x=c.getContext("2d");const scale=Math.min(256/img.width,256/img.height);x.drawImage(img,(256-img.width*scale)/2,(256-img.height*scale)/2,img.width*scale,img.height*scale);const data=c.toDataURL("image/png");if(data.length>900000){invalid++;continue}if(existing.has(data)){duplicates++;continue}packs[name].push({data,created:Date.now()});existing.add(data);if(!persist()){packs[name].pop();existing.delete(data);break}count++;if(count%10===0){notice("Importados "+count+" de "+selected.length+"...");await new Promise(resolve=>setTimeout(resolve,0))}}catch{invalid++}finally{if(url)URL.revokeObjectURL(url)}}refresh();notice(count+" importados; "+duplicates+" duplicados; "+invalid+" no compatibles. Los GIF se guardan como imagen fija. El almacenamiento local limita la cantidad.")}
$("klkImportFiles").onchange=async e=>{await importStickers(e.target.files);e.target.value=""};
$("klkImportFolder").onchange=async e=>{await importStickers(e.target.files);e.target.value=""};
$("klkStickerFile").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>10*1024*1024){notice("Usa una imagen PNG, JPG, WEBP o GIF de hasta 10 MB.");return}sourceFile=file;chosen=null;erase=false;try{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{source=img;draw();URL.revokeObjectURL(url);notice(file.type==="image/gif"?"GIF cargado: se puede enviar animado sin editar o guardar un fotograma estático.":"Imagen lista para editar.")};img.onerror=()=>{URL.revokeObjectURL(url);notice("No se pudo abrir la imagen.")};img.src=url}catch{notice("No se pudo cargar el archivo.")}};
$("klkStickerText").oninput=()=>{chosen=null;draw()};$("klkEmoji").onclick=()=>{$("klkStickerText").value+= "😂";chosen=null;draw()};$("klkErase").onclick=()=>{erase=!erase;chosen=null;draw()};$("klkReset").onclick=()=>{erase=false;$("klkStickerText").value="";chosen=null;draw()};
$("klkNewPack").onclick=()=>{const name=prompt("Nombre del paquete (máximo 30 caracteres):");if(!name)return;const clean=name.trim().slice(0,30);if(!clean)return;if(!packs[clean])packs[clean]=[];persist();refresh();$("klkPack").value=clean;refresh()};
$("klkSave").onclick=()=>{if(!source){notice("Selecciona una fotografía primero.");return}const name=$("klkPack").value;const data=canvas.toDataURL("image/png");if(data.length>900000){notice("Imagen demasiado grande para guardar localmente.");return}const item={data,created:Date.now()};packs[name].push(item);if(packs[name].length>24)packs[name].shift();if(persist()){chosen=item;refresh();notice("Guardado en "+name)}};
$("klkSend").onclick=async()=>{if(typeof window.klkSendCustomSticker!=="function"){notice("Abre una conversación antes de enviar.");return}try{if(sourceFile?.type==="image/gif"&&!chosen&&!erase&&!$("klkStickerText").value.trim()){await window.klkSendCustomSticker(sourceFile,"file");}else{if(!source&&!chosen){notice("Crea o selecciona un sticker.");return}const blob=await new Promise((resolve,reject)=>{if(chosen)fetch(chosen.data).then(r=>r.blob()).then(resolve).catch(reject);else canvas.toBlob(resolve,"image/png")});if(!blob)throw Error("No se pudo exportar");await window.klkSendCustomSticker(new File([blob],"sticker-klk.png",{type:"image/png"}),"image")}close()}catch(e){notice("No se pudo enviar: "+e.message)}};
})();