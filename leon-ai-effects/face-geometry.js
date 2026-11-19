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
   constructor({smoothing=0.38}={}){this.smoothing=clamp(smoothing,0.01,1);this.previous=null;this.previousAt=0;this.missed=0}
   reset(){this.previous=null;this.previousAt=0;this.missed=0}
   update(landmarks){
     if(!Array.isArray(landmarks)||landmarks.length<455){this.reset();return null}
     const current=landmarks.map((p,i)=>point(landmarks,i));
     if(current.some(p=>!p)){this.reset();return null}
     // Track translation and rotation together, rather than smoothing each point
     // independently (which distorts the beard when the face turns).
     const now=typeof performance!=='undefined'?performance.now():Date.now();
     const previous=this.previous;
     const anchorIds=[1,4,152,234,454];
     let stable=current;
     if(previous&&previous.length===current.length){
       const center=arr=>anchorIds.reduce((v,i)=>({x:v.x+arr[i].x/anchorIds.length,y:v.y+arr[i].y/anchorIds.length}),{x:0,y:0});
       const oldCenter=center(previous),newCenter=center(current);
       const translation=Math.hypot(newCenter.x-oldCenter.x,newCenter.y-oldCenter.y);
       const oldSpan=Math.hypot(previous[454].x-previous[234].x,previous[454].y-previous[234].y);
       const newSpan=Math.hypot(current[454].x-current[234].x,current[454].y-current[234].y);
       const scaleChange=Math.abs(newSpan-oldSpan);
       const dt=this.previousAt?Math.max(1,now-this.previousAt):33;
       // Large coordinated movements must follow immediately to avoid trailing.
       // Smooth only tiny jitter while stationary.
       const motion=translation+scaleChange;
       const alpha=motion>0.008||dt>90?1:motion>0.003?0.9:0.78;
       stable=alpha===1?current:current.map((p,i)=>smoothPoint(previous[i],p,alpha));
     }
     this.previous=stable;
     this.previousAt=now;
     this.missed=0;
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
