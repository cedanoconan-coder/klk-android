/* KLK Puente: transporte experimental para chats privados. Emparejar solo con contactos de confianza. */
(function(){
"use strict";
const storeKey="klk-puente-messages-v1";
let pc=null,channel=null;
const listeners=new Set();
const read=()=>{try{return JSON.parse(localStorage.getItem(storeKey)||"[]")}catch{return []}};
const save=m=>{const a=read();if(a.some(x=>x.id===m.id))return false;a.push(m);localStorage.setItem(storeKey,JSON.stringify(a.slice(-500)));listeners.forEach(fn=>fn(m));return true};
function attach(c){
 channel=c;
 c.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.kind==="ack"){const a=read();const v=a.find(x=>x.id===m.id);if(v){v.status="delivered";localStorage.setItem(storeKey,JSON.stringify(a));listeners.forEach(fn=>fn(v))}return}
 if(m.kind!=="message"||typeof m.id!=="string"||typeof m.text!=="string"||typeof m.conversationId!=="string"||m.text.length>2000)return;
 // The conversation identifier is checked by the chat integration before display.
 save({...m,status:"received"});c.send(JSON.stringify({kind:"ack",id:m.id}));
 }catch(err){console.warn("KLK Puente: mensaje inválido",err)}};
}
function init(){
 if(pc)pc.close();
 pc=new RTCPeerConnection({iceServers:[]});
 pc.ondatachannel=e=>attach(e.channel);
}
async function localDescription(){
 if(pc.iceGatheringState!=="complete")await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error("No se encontró una ruta local")),20000);pc.addEventListener("icegatheringstatechange",()=>{if(pc.iceGatheringState==="complete"){clearTimeout(t);resolve()}},{once:false})});
 return JSON.stringify(pc.localDescription);
}
window.KLKPuente={
 get connected(){return channel?.readyState==="open"},
 async offer(){init();attach(pc.createDataChannel("klk-chat"));await pc.setLocalDescription(await pc.createOffer());return localDescription()},
 async answer(remote){init();await pc.setRemoteDescription(JSON.parse(remote));await pc.setLocalDescription(await pc.createAnswer());return localDescription()},
 async finish(remote){if(!pc)throw Error("Primero crea una invitación");await pc.setRemoteDescription(JSON.parse(remote))},
 send(conversationId,text,uid){if(!this.connected)return false;const m={kind:"message",id:crypto.randomUUID(),conversationId,text,uid,createdAt:Date.now(),status:"pending"};save(m);channel.send(JSON.stringify(m));return true},
 history:conversationId=>read().filter(m=>m.conversationId===conversationId),
 subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
};
})();