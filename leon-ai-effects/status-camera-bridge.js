/* KLK Estados: puente no invasivo entre la vista previa y León AI Effects.
   Un detector compatible se suministra mediante KLKStatusFaceBridge.setDetector().
   No descarga modelos ni modifica los efectos existentes. */
(function(global){
'use strict';
let detector=null,tracker=null,video=null;
const camera=()=>document.getElementById('klkStatusCamera');
const visible=el=>!!el&&el.isConnected&&!el.hidden&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&el.getClientRects().length>0;
function stop(){if(tracker){tracker.stop();tracker=null}video=null}
function sync(){
 const host=camera();
 const next=host&&visible(host)?Array.from(host.querySelectorAll('video')).find(v=>visible(v)&&v.srcObject&&v.readyState>=2):null;
 if(!detector||!global.KLKLiveFaceTracker||!global.KLKFaceGeometry||!next){stop();return}
 if(next===video&&tracker?.running)return;
 stop();video=next;
 try{
  tracker=new global.KLKLiveFaceTracker({
   detector,maxFPS:30,
   onFrame:(geometry,result)=>host.dispatchEvent(new CustomEvent('klk:facegeometry',{detail:{geometry,faceCount:result?.faceLandmarks?.length||0,faceTransform:result?.facialTransformationMatrixes?.[0]||null}})),
   onError:error=>{console.warn('KLK face tracking paused:',error);stop()}
  });
  tracker.start(video);
 }catch(error){console.warn('KLK face tracking unavailable:',error);stop()}
}
function setDetector(value){
 if(value!==null&&typeof value?.detectForVideo!=='function')throw new TypeError('FaceLandmarker detector required');
 stop();detector=value;sync();
}
function start(){
 const observer=new MutationObserver(sync);
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style','class','src']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else sync()});
 document.addEventListener('play',sync,true);
 document.addEventListener('loadeddata',sync,true);
 document.addEventListener('pause',sync,true);
 sync();
}
global.KLKStatusFaceBridge=Object.freeze({setDetector,stop,sync});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})(window);
