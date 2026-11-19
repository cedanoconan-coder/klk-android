/* León AI Effects: beard style definitions, no rendering or remote assets.
 * Each style has independent coverage regions, density, length and moustache connection.
 * Rendering remains gated until an Android-validated engine is available.
 */
(function(global){
'use strict';
const styles=[
 {id:'stubble',name:'Barba de 3 días',family:'corta',regions:['cheeks','jaw','chin','mustache'],lengthMm:2,density:.32,mustache:'connected',silhouette:'skin'},
 {id:'short-boxed',name:'Barba cuadrada corta',family:'corta',regions:['cheeks','jaw','chin','mustache'],lengthMm:8,density:.76,mustache:'connected',silhouette:'boxed'},
 {id:'full',name:'Barba completa',family:'media',regions:['cheeks','jaw','chin','mustache'],lengthMm:28,density:1,mustache:'connected',silhouette:'full'},
 {id:'corporate',name:'Barba ejecutiva',family:'corta',regions:['cheeks','jaw','chin','mustache'],lengthMm:12,density:.86,mustache:'connected',silhouette:'tidy'},
 {id:'goatee',name:'Chiva clásica',family:'media',regions:['chin'],lengthMm:16,density:.85,mustache:'none',silhouette:'chin'},
 {id:'circle',name:'Candado',family:'corta',regions:['chin','mustache','connectors'],lengthMm:10,density:.8,mustache:'connected',silhouette:'circle'},
 {id:'van-dyke',name:'Van Dyke',family:'media',regions:['chin','mustache'],lengthMm:23,density:.85,mustache:'detached',silhouette:'pointed'},
 {id:'balbo',name:'Balbo',family:'media',regions:['jaw','chin','mustache'],lengthMm:19,density:.8,mustache:'detached',silhouette:'balbo'},
 {id:'anchor',name:'Ancla',family:'media',regions:['jaw','chin','mustache'],lengthMm:16,density:.82,mustache:'detached',silhouette:'anchor'},
 {id:'chin-strap',name:'Barba de mandíbula',family:'corta',regions:['jaw','chin'],lengthMm:7,density:.7,mustache:'none',silhouette:'strap'},
 {id:'ducktail',name:'Cola de pato',family:'larga',regions:['cheeks','jaw','chin','mustache'],lengthMm:65,density:1,mustache:'connected',silhouette:'pointed-long'},
 {id:'garibaldi',name:'Garibaldi',family:'larga',regions:['cheeks','jaw','chin','mustache'],lengthMm:95,density:1,mustache:'connected',silhouette:'rounded-long'}
];
const valid=new Set(['cheeks','jaw','chin','mustache','connectors']);
for(const s of styles){if(!s.regions.every(r=>valid.has(r)))throw Error('Invalid beard region: '+s.id);Object.freeze(s.regions);Object.freeze(s)}
global.KLKBeardStyles=Object.freeze({
 all:Object.freeze(styles),
 get(id){return styles.find(s=>s.id===id)||null},
 families:Object.freeze(['corta','media','larga']),
 // Explicitly disabled until real-world Android visual checks pass.
 availableForCamera:false
});
})(window);
