/* Regression checks for the locally bundled MediaPipe canonical mesh.
 * Run: node --test tests/beard-canonical.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const obj=readFileSync(new URL('../leon-ai-effects/assets/canonical_face_model.obj',import.meta.url),'utf8');
const vertices=obj.split(/\r?\n/).filter(x=>x.startsWith('v ')).map(x=>x.trim().split(/\s+/).slice(1).map(Number));
const faces=obj.split(/\r?\n/).filter(x=>x.startsWith('f ')).map(x=>x.trim().split(/\s+/).slice(1).map(x=>parseInt(x,10)-1));
const mask=([x,y])=>{
 const cheek=Math.abs(x)>1.35&&Math.abs(x)<7.2&&y<-.85&&y>-7.9;
 const chin=Math.abs(x)<=3.5&&y< -5.15&&y> -9.2;
 const mustache=Math.abs(x)>.32&&Math.abs(x)<2.65&&y< -2.65&&y> -3.88;
 const connector=Math.abs(x)>1.9&&Math.abs(x)<3.5&&y< -3.25&&y> -5.45;
 return {cheek,chin,mustache,connector};
};
test('canonical mesh uses exactly 468 indexed landmarks',()=>{
 assert.equal(vertices.length,468);
 assert.ok(faces.length>=800);
 assert.ok(faces.every(f=>f.length===3&&f.every(i=>i>=0&&i<468)));
});
test('follicle masks cover both cheeks, chin and upper lip without forehead',()=>{
 const hits={left:0,right:0,chin:0,mustache:0,forehead:0};
 for(const face of faces){
  const centroid=[0,1].map(j=>face.reduce((sum,i)=>sum+vertices[i][j],0)/3);
  const [x,y]=centroid,m=mask(centroid);
  if(m.cheek){if(x<0)hits.left++;else hits.right++}
  if(m.chin)hits.chin++;
  if(m.mustache)hits.mustache++;
  if(y>3&&Object.values(m).some(Boolean))hits.forehead++;
 }
 for(const key of ['left','right','chin','mustache'])assert.ok(hits[key]>0,key+' missing: '+JSON.stringify(hits));
 assert.equal(hits.forehead,0);
});
