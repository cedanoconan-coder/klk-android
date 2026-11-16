(()=>{
"use strict";
const $=id=>document.getElementById(id);
const serverTime=()=>firebase.firestore.FieldValue.serverTimestamp();
const current=()=>typeof auth!=="undefined"&&auth?.currentUser;
const store=()=>typeof db!=="undefined"&&db;
let unsubs=[];
let opening=false;
let scannerStream=null,scannerTimer=null,scannerBusy=false;
function notify(message){$("qrContactNotice").textContent=message;}
function stopScanner(){if(scannerTimer){clearInterval(scannerTimer);scannerTimer=null;}if(scannerStream){scannerStream.getTracks().forEach(t=>t.stop());scannerStream=null;}const video=$("qrScannerVideo");if(video){video.pause();video.srcObject=null;}const area=$("qrScannerArea");if(area)area.hidden=true;scannerBusy=false;}
function close(){stopScanner(); $("qrContactOverlay").hidden=true;unsubs.forEach(fn=>fn());unsubs=[];opening=false;}
function qrLink(uid){return new URL("./?contact="+encodeURIComponent(uid),location.href).href;}
async function open(){
 if(!current()||!store()||opening)return;
 opening=true;
 $("qrContactOverlay").hidden=false;
 unsubs.forEach(fn=>fn());unsubs=[];
 notify("");
 const uid=current().uid;
 const url=qrLink(uid);
 $("qrContactLink").value=url;
 const box=$("qrContactCode");box.replaceChildren();
 if(window.QRCode)new QRCode(box,{text:url,width:180,height:180,colorDark:"#33265d",colorLight:"#ffffff"});
 else box.textContent="Comparte el enlace de tu perfil";
 try{
  const doc=await db.collection("contactPrivacy").doc(uid).get();
  $("qrContactMode").value=doc.exists&&doc.data().mode==="direct"?"direct":"approval";
 }catch(e){notify("No se pudo consultar la privacidad: "+e.message);}
 unsubs.push(db.collection("qrContactRequests").where("to","==",uid).onSnapshot(snapshot=>{
  const list=$("qrContactPending");list.replaceChildren();
  snapshot.docs.filter(d=>d.data().status==="pending").forEach(d=>{
   const row=document.createElement("div");row.style.cssText="padding:10px;border-bottom:1px solid #ddd";
   const label=document.createElement("span");label.textContent="Solicitud de contacto: "+d.data().from.slice(0,12)+"… ";
   const accept=document.createElement("button");accept.textContent="Aceptar";accept.style.width="auto";
   accept.onclick=async()=>{try{await d.ref.update({status:"approved",updatedAt:serverTime()});await db.collection("qrContacts").doc(uid).collection("members").doc(d.data().from).set({uid:d.data().from,addedAt:serverTime()});notify("Solicitud aceptada. El contacto queda autorizado.");}catch(e){notify(e.message);}};
   const reject=document.createElement("button");reject.textContent="Rechazar";reject.style.width="auto";reject.className="secondary";
   reject.onclick=async()=>{try{await d.ref.update({status:"rejected",updatedAt:serverTime()});}catch(e){notify(e.message);}};
   row.append(label,accept,reject);list.append(row);
  });
 },e=>notify("Solicitudes: "+e.message)));
}
async function add(uid){
 if(!current())return notify("Inicia sesión para agregar contactos");
 if(!/^[a-zA-Z0-9_-]{6,128}$/.test(uid)||uid===current().uid)return notify("Código de contacto no válido");
 try{
  const privacy=await db.collection("contactPrivacy").doc(uid).get();
  const direct=privacy.exists&&privacy.data().mode==="direct";
  if(direct){
   await db.collection("qrContacts").doc(current().uid).collection("members").doc(uid).set({uid,addedAt:serverTime()});
   notify("Contacto agregado correctamente");
   return "added";
  }else{
   const id=current().uid+"_"+uid;
   const ref=db.collection("qrContactRequests").doc(id);
   // Do not read a nonexistent request: the get rule depends on resource.data
   // and Firebase rejects that lookup before the first request exists.
   try{
    await ref.set({from:current().uid,to:uid,status:"pending",createdAt:serverTime(),updatedAt:serverTime()});
    notify("Solicitud enviada. Espera su aprobación.");
    return "pending";
   }catch(writeError){
    // An existing request is intentionally immutable to the sender.
    // Fetch its status only after the create attempt has failed.
    let existing=null;
    try{existing=await ref.get();}catch(readError){}
    if(existing?.exists){
     if(existing.data().status==="approved"){
      const member=db.collection("qrContacts").doc(current().uid).collection("members").doc(uid);
      const linked=await member.get();
      if(!linked.exists)await member.set({uid,addedAt:serverTime()});
      notify("Contacto agregado");
      return "added";
     }
     notify("Esta solicitud ya existe: "+existing.data().status);
     return existing.data().status==="pending"?"pending":null;
    }
    throw writeError;
   }
  }
 }catch(e){notify("No se pudo agregar: "+e.message);}
}
function parseContact(raw){
 try{
  const u=new URL(raw);
  const normalize=path=>path.endsWith("/")?path.slice(0,-1):path;
  if(u.origin!==location.origin||normalize(u.pathname)!==normalize(location.pathname))return null;
  return u.searchParams.get("contact");
 }catch(e){return /^[a-zA-Z0-9_-]{6,128}$/.test(raw)?raw:null;}
}
async function scanContact(raw){
 const uid=parseContact(raw);if(!uid){notify("Este QR no pertenece a un contacto KLK válido");return;}
 stopScanner();$("qrContactTarget").value=uid;const result=await add(uid);
 if(result==="added"||result==="pending"){close();document.querySelector('.homeBottom button[data-tab="chats"]')?.click();const message=document.createElement("div");message.textContent=result==="added"?"Contacto agregado":"Solicitud de contacto enviada";message.setAttribute("role","status");message.style.cssText="position:fixed;bottom:90px;left:16px;right:16px;z-index:10002;padding:14px;border-radius:12px;background:#075e54;color:white;text-align:center";document.body.append(message);setTimeout(()=>message.remove(),4000);}
}
async function startScanner(){
 if(!current())return notify("Inicia sesión para escanear contactos");
 if(!navigator.mediaDevices?.getUserMedia)return notify("La cámara no está disponible en este dispositivo");
 if(!("BarcodeDetector" in window))return notify("Este dispositivo no admite lectura QR integrada. Puedes abrir el QR con la cámara del teléfono o pegar el enlace.");
 stopScanner();const area=$("qrScannerArea");area.hidden=false;notify("Apunta la cámara al código QR de KLK");
 try{
  scannerStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
  const video=$("qrScannerVideo");video.srcObject=scannerStream;await video.play();
  const detector=new BarcodeDetector({formats:["qr_code"]});
  scannerTimer=setInterval(async()=>{
   if(scannerBusy||video.readyState<2)return;scannerBusy=true;
   try{const codes=await detector.detect(video);if(codes.length){await scanContact(codes[0].rawValue);}}catch(e){notify("No se pudo leer el QR: "+e.message);stopScanner();}
   finally{scannerBusy=false;}
  },300);
 }catch(e){stopScanner();notify("No se pudo abrir la cámara: "+e.message);}
}
function addChatsEntry(){
 const chats=document.querySelector('.homeBottom button[data-tab="chats"]');
 if(!chats||$("qrChatsScanEntry"))return;
 const entry=document.createElement("button");entry.id="qrChatsScanEntry";entry.type="button";entry.textContent="▦ Escanear QR";entry.className="secondary";entry.style.cssText="width:auto;padding:9px 14px;margin:8px;border-radius:20px;font-size:13px";
 entry.onclick=async()=>{await open();await startScanner();};
 const home=$("homeView");if(home)home.prepend(entry);
}
function init(){
 const style=document.createElement("style");style.textContent="#qrContactOverlay[hidden]{display:none!important}#qrContactOverlay{position:fixed;inset:0;z-index:10000;background:#fff;color:#17211e;overflow:auto;padding:22px;max-width:760px;margin:auto}#qrContactOverlay button{max-width:100%}#qrContactCode{width:200px;min-height:200px;margin:12px auto;padding:10px;background:white}";document.head.append(style);
 const panel=document.createElement("section");panel.id="qrContactOverlay";panel.hidden=true;
 panel.innerHTML='<button type="button" id="qrContactClose" class="secondary">← Volver</button><h2>Contactos KLK por QR</h2><p>Comparte tu QR personal con quien quieras agregar.</p><div id="qrContactCode"></div><input id="qrContactLink" readonly aria-label="Enlace de contacto"><button type="button" id="qrContactShare">Compartir enlace</button><h3>Privacidad</h3><label for="qrContactMode">Cuando escanean mi QR</label><select id="qrContactMode" style="width:100%;padding:12px"><option value="approval">Solicitar mi aprobación (predeterminado)</option><option value="direct">Agregar directamente</option></select><button type="button" id="qrContactSave">Guardar privacidad</button><h3>Agregar contacto</h3><button type="button" id="qrScanStart">▦ Escanear código QR</button><div id="qrScannerArea" hidden><video id="qrScannerVideo" autoplay muted playsinline style="width:100%;max-height:55vh;background:#111;border-radius:14px"></video><button type="button" id="qrScanStop" class="secondary">Cerrar cámara</button></div><p>Pega el enlace o identificador recibido. También puedes escanear el QR con la cámara del teléfono para abrir el enlace.</p><input id="qrContactTarget" placeholder="Enlace o identificador KLK"><button type="button" id="qrContactAdd">Agregar contacto</button><h3>Solicitudes recibidas</h3><div id="qrContactPending"></div><p id="qrContactNotice" role="status"></p>';
 document.body.append(panel);
 const entry=document.createElement("button");entry.type="button";entry.textContent="▦ Contactos por QR";entry.className="secondary";entry.id="qrContactEntry";entry.onclick=open;
 const target=$("homeProfilePanel")||$("homeView");if(target)target.prepend(entry);
 $("qrContactClose").onclick=close;
 $("qrScanStart").onclick=startScanner;$("qrScanStop").onclick=stopScanner;
 addChatsEntry();
 $("qrContactSave").onclick=async()=>{try{await db.collection("contactPrivacy").doc(current().uid).set({mode:$("qrContactMode").value,updatedAt:serverTime()});notify("Privacidad guardada");}catch(e){notify(e.message);}};
 $("qrContactShare").onclick=async()=>{const url=$("qrContactLink").value;try{if(navigator.share)await navigator.share({title:"Mi contacto KLK",url});else{await navigator.clipboard.writeText(url);notify("Enlace copiado");}}catch(e){notify("Comparte este enlace manualmente");}};
 $("qrContactAdd").onclick=()=>{let val=$("qrContactTarget").value.trim();try{val=parseContact(val)||"";}catch(e){}void add(val);};
 // QR deep links should complete contact creation, not strand users in QR settings.
 const incoming=new URLSearchParams(location.search).get("contact");
 if(incoming){
  $("qrContactTarget").value=incoming;
  let timer=null;
  let processing=false;
  const finish=async()=>{
   if(processing||!current()||!store())return;
   processing=true;
   if(timer!==null)clearInterval(timer);
   await open();
   const result=await add(incoming);
   if(result==="added"||result==="pending"){
    const url=new URL(location.href);
    url.searchParams.delete("contact");
    history.replaceState(history.state,"",url.pathname+url.search+url.hash);
    close();
    const chats=document.querySelector('.homeBottom button[data-tab="chats"]');
    if(chats)chats.click();
    const notice=document.createElement("div");
    notice.setAttribute("role","status");
    notice.textContent=result==="added"?"Contacto agregado a KLK":"Solicitud de contacto enviada; pendiente de aprobación";
    notice.style.cssText="position:fixed;bottom:95px;left:16px;right:16px;z-index:10001;padding:14px;border-radius:12px;background:#075e54;color:#fff;text-align:center;box-shadow:0 4px 18px #0003";
    document.body.append(notice);
    setTimeout(()=>notice.remove(),4500);
   }else{
    processing=false; // Leave the QR panel visible with the actionable error.
   }
  };
  timer=setInterval(()=>{if(current()&&store())void finish();},500);
  setTimeout(()=>{if(timer!==null)clearInterval(timer);},30000);
  void finish();
 }
 window.addEventListener("popstate",()=>{if(!$("qrContactOverlay").hidden)close();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();