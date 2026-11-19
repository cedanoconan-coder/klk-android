/* León AI Effects: puente para el seguimiento facial en vivo.
   No envía fotogramas a la red; requiere un detector MediaPipe ya inicializado.
   No altera el flujo de captura ni crea una segunda cámara. */
(function(global){
'use strict';
class LiveFaceTracker{
 constructor({detector,onFrame,onError,maxFPS=24}={}){
  if(!detector||typeof detector.detectForVideo!=='function')throw new TypeError('Se requiere FaceLandmarker con detectForVideo');
  this.detector=detector;this.onFrame=onFrame||(()=>{});this.onError=onError||(()=>{});
  this.interval=1000/Math.max(1,Math.min(60,maxFPS));this.geometry=new global.KLKFaceGeometry.FaceGeometry();
  this.video=null;this.running=false;this.raf=0;this.lastTime=-Infinity;this.lastVideoTime=-1;
  this.tick=this.tick.bind(this);
 }
 start(video){
  if(!(video instanceof HTMLVideoElement))throw new TypeError('Se requiere un elemento video');
  this.stop();this.video=video;this.running=true;this.raf=requestAnimationFrame(this.tick);
 }
 tick(now){
  if(!this.running)return;
  try{
   const v=this.video;
   if(v&&v.readyState>=HTMLMediaElement.HAVE_CURRENT_DATA&&now-this.lastTime>=this.interval&&v.currentTime!==this.lastVideoTime){
    this.lastTime=now;this.lastVideoTime=v.currentTime;
    const result=this.detector.detectForVideo(v,now);
    const landmarks=result?.faceLandmarks?.[0];
    this.onFrame(landmarks?this.geometry.update(landmarks):this.geometry.update(null),result);
   }
  }catch(error){this.onError(error);this.stop();return}
  this.raf=requestAnimationFrame(this.tick);
 }
 stop(){this.running=false;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.geometry.reset();this.video=null;this.lastVideoTime=-1}
 dispose(){this.stop();this.detector=null}
}
global.KLKLiveFaceTracker=LiveFaceTracker;
})(window);
