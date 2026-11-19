/* Inicializador bajo demanda de MediaPipe Face Landmarker para Estados.
 * El modelo se descarga únicamente al activar el efecto facial.
 * Los fotogramas se procesan en el dispositivo y nunca se envían al servidor.
 */
(function(global){
'use strict';
const VERSION='0.10.22';
const CDN='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@'+VERSION;
const MODEL='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
let pending=null,detector=null;
async function initialize(){
 if(detector)return detector;
 if(pending)return pending;
 pending=(async()=>{
  if(!global.KLKStatusFaceBridge)throw new Error('KLKStatusFaceBridge no disponible');
  const {FaceLandmarker,FilesetResolver}=await import(CDN+'/+esm');
  const fileset=await FilesetResolver.forVisionTasks(CDN+'/wasm');
  const options={baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false};
  try{detector=await FaceLandmarker.createFromOptions(fileset,options)}
  catch(error){console.warn('GPU no disponible; usando CPU para seguimiento facial',error);options.baseOptions.delegate='CPU';detector=await FaceLandmarker.createFromOptions(fileset,options)}
  global.KLKStatusFaceBridge.setDetector(detector);
  return detector;
 })().catch(error=>{pending=null;throw error});
 return pending;
}
function stop(){global.KLKStatusFaceBridge?.stop()}
function dispose(){
 stop();global.KLKStatusFaceBridge?.setDetector(null);
 detector?.close?.();detector=null;pending=null;
}
global.KLKMediaPipeFace=Object.freeze({initialize,stop,dispose});
})(window);
