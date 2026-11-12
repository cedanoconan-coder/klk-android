(()=>{
"use strict";
const $=id=>document.getElementById(id);
const serverTime=()=>firebase.firestore.FieldValue.serverTimestamp();
const current=()=>typeof auth!=="undefined"&&auth?.currentUser;
const store=()=>typeof db!=="undefined"&&db;
let unsubs=[];
function notify(message){$("qrContactNotice").textContent=message;}
function close(){ $("qrContactOverlay").hidden=true;unsubs.forEach(fn=>fn());unsubs=[];}
function qrLink(uid){return new URL("./?contact="+encodeURIComponent(uid),location.href).href;}
async function open(){
 if(!current()||!store())return;
 $("qrContactOverlay").hidden=false;
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
   accept.onclick=async()=>{try{await d.ref.update({status:"approved",updatedAt:serverTime()});await db.collection("qrContacts").doc(uid).collection("members").doc(d.data().from).set({uid:d.data().from,addedAt:serverTime()});notify("Contacto aceptado");}catch(e){notify(e.message);}};
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
  }else{
   const id=current().uid+"_"+uid;
   const ref=db.collection("qrContactRequests").doc(id);
   const old=await ref.get();
   if(old.exists){
    if(old.data().status==="approved"){
     await db.collection("qrContacts").doc(current().uid).collection("members").doc(uid).set({uid,addedAt:serverTime()});
     return notify("Contacto agregado");
    }
    return notify("Esta solicitud ya existe: "+old.data().status);
   }
   await ref.set({from:current().uid,to:uid,status:"pending",createdAt:serverTime(),updatedAt:serverTime()});
   notify("Solicitud enviada. Espera su aprobación.");
  }
 }catch(e){notify("No se pudo agregar: "+e.message);}
}
function init(){
 const style=document.createElement("style");style.textContent="#qrContactOverlay[hidden]{display:none!important}#qrContactOverlay{position:fixed;inset:0;z-index:10000;background:#fff;color:#17211e;overflow:auto;padding:22px;max-width:760px;margin:auto}#qrContactOverlay button{max-width:100%}#qrContactCode{width:200px;min-height:200px;margin:12px auto;padding:10px;background:white}";document.head.append(style);
 const panel=document.createElement("section");panel.id="qrContactOverlay";panel.hidden=true;
 panel.innerHTML='<button type="button" id="qrContactClose" class="secondary">← Volver</button><h2>Contactos KLK por QR</h2><p>Comparte tu QR personal con quien quieras agregar.</p><div id="qrContactCode"></div><input id="qrContactLink" readonly aria-label="Enlace de contacto"><button type="button" id="qrContactShare">Compartir enlace</button><h3>Privacidad</h3><label for="qrContactMode">Cuando escanean mi QR</label><select id="qrContactMode" style="width:100%;padding:12px"><option value="approval">Solicitar mi aprobación (predeterminado)</option><option value="direct">Agregar directamente</option></select><button type="button" id="qrContactSave">Guardar privacidad</button><h3>Agregar contacto</h3><p>Pega el enlace o identificador recibido. También puedes escanear el QR con la cámara del teléfono para abrir el enlace.</p><input id="qrContactTarget" placeholder="Enlace o identificador KLK"><button type="button" id="qrContactAdd">Agregar contacto</button><h3>Solicitudes recibidas</h3><div id="qrContactPending"></div><p id="qrContactNotice" role="status"></p>';
 document.body.append(panel);
 const entry=document.createElement("button");entry.type="button";entry.textContent="▦ Contactos por QR";entry.className="secondary";entry.id="qrContactEntry";entry.onclick=open;
 const target=$("homeProfilePanel")||$("homeView");if(target)target.prepend(entry);
 $("qrContactClose").onclick=close;
 $("qrContactSave").onclick=async()=>{try{await db.collection("contactPrivacy").doc(current().uid).set({mode:$("qrContactMode").value,updatedAt:serverTime()});notify("Privacidad guardada");}catch(e){notify(e.message);}};
 $("qrContactShare").onclick=async()=>{const url=$("qrContactLink").value;try{if(navigator.share)await navigator.share({title:"Mi contacto KLK",url});else{await navigator.clipboard.writeText(url);notify("Enlace copiado");}}catch(e){notify("Comparte este enlace manualmente");}};
 $("qrContactAdd").onclick=()=>{let val=$("qrContactTarget").value.trim();try{const url=new URL(val);val=url.searchParams.get("contact")||"";}catch(e){}void add(val);};
 const incoming=new URLSearchParams(location.search).get("contact");if(incoming){$("qrContactTarget").value=incoming;const timer=setInterval(()=>{if(current()){clearInterval(timer);void open();}},800);setTimeout(()=>clearInterval(timer),30000);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();