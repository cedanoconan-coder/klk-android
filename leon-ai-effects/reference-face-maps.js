/* Reference-driven facial effect presets. Visual targets, not extracted 3D meshes.
 * Coordinates are resolved at runtime by MediaPipe; no camera frames uploaded.
 */
(function(global){
'use strict';
const beard=[
 {reference:1,style:'short-boxed',coverage:['cheeks','jaw','chin','mustache'],lipExclusion:true,edge:'tapered',density:.88},
 {reference:2,style:'circle',coverage:['chin','mustache','connectors'],lipExclusion:true,edge:'rounded',density:.91},
 {reference:3,style:'full',coverage:['cheeks','jaw','chin','mustache'],lipExclusion:true,edge:'natural',density:1},
 {reference:4,style:'van-dyke',coverage:['chin','mustache'],lipExclusion:true,edge:'pointed',density:.88},
 {reference:5,style:'chin-strap',coverage:['jaw','chin','mustache'],lipExclusion:true,edge:'fine',density:.65},
 {reference:6,style:'anchor',coverage:['jaw','chin','mustache'],lipExclusion:true,edge:'pointed',density:.83}
];
const eyes=[
 {id:'electric-blue',reference:2,iris:{base:'#0752a0',outer:'#061a48',inner:'#17b9f5',radialFibers:true},eyelidOcclusion:true,preservePupil:true},
 {id:'bright-blue',reference:3,iris:{base:'#057cc7',outer:'#153c78',inner:'#20c9f7',radialFibers:true},eyelidOcclusion:true,preservePupil:true},
 {id:'blue-gold',reference:4,iris:{base:'#386e88',outer:'#243a50',inner:'#b98b48',radialFibers:true},eyelidOcclusion:true,preservePupil:true}
];
const freeze=x=>Object.freeze(x);
for(const b of beard){freeze(b.coverage);freeze(b)}
for(const e of eyes){freeze(e.iris);freeze(e)}
global.KLKFaceReferenceMaps=freeze({
 beard:freeze(beard),eyes:freeze(eyes),
 beardForStyle(id){return beard.find(x=>x.style===id)||null},
 eye(id){return eyes.find(x=>x.id===id)||null}
});
})(window);
