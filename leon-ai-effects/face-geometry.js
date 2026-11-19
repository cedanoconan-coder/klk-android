/* León AI Effects: geometría y estabilización facial local.
 * Módulo independiente; no captura ni transmite imágenes.
 * Espera landmarks normalizados (x,y,z) de MediaPipe Face Landmarker.
 */
(function(global){
 'use strict';
 const LIPS=[0,13,14,17,37,39,40,61,78,80,81,82,84,87,88,91,95,146,178,181,185,191,267,269,270,291,308,310,311,312,314,317,318,321,324,375,402,405,409,415];
 const JAW=[234,93,132,58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,361,323,454];
 const CHEEKS=[50,101,118,119,123,147,187,205,206,207,280,330,347,348,352,376,411,425,426,427];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function point(landmarks,index){const p=landmarks?.[index];return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:clamp(p.x,0,1),y:clamp(p.y,0,1),z:Number.isFinite(p.z)?p.z:0}:null}
 function polygon(landmarks,indices){return indices.map(i=>point(landmarks,i)).filter(Boolean)}
 function smoothPoint(a,b,alpha){return {x:a.x+(b.x-a.x)*alpha,y:a.y+(b.y-a.y)*alpha,z:a.z+(b.z-a.z)*alpha}}
 class FaceGeometry {
   constructor({smoothing=0.38}={}){this.smoothing=clamp(smoothing,0.01,1);this.previous=null}
   reset(){this.previous=null}
   update(landmarks){
     if(!Array.isArray(landmarks)||landmarks.length<455){this.reset();return null}
     const current=landmarks.map((p,i)=>point(landmarks,i));
     if(current.some(p=>!p)){this.reset();return null}
     // Follow large movements immediately; smooth only small landmark jitter.
     // A fixed low alpha made the beard visibly trail the face during turns.
     const stable=this.previous&&this.previous.length===current.length
       ?current.map((p,i)=>{
           const previous=this.previous[i];
           const movement=Math.hypot(p.x-previous.x,p.y-previous.y);
           const alpha=movement>0.025?1:movement>0.008?0.9:Math.max(0.65,this.smoothing);
           return smoothPoint(previous,p,alpha);
         }):current;
     this.previous=stable;
     return {
       landmarks:stable,
       jaw:polygon(stable,JAW),
       cheeks:polygon(stable,CHEEKS),
       lips:polygon(stable,LIPS),
       lipExclusionPadding:0.012,
       confidenceRequired:true
     };
   }
 }
 global.KLKFaceGeometry=Object.freeze({FaceGeometry,LIPS,JAW,CHEEKS});
})(typeof window!=='undefined'?window:globalThis);
