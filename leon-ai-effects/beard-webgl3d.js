/* León AI Effects: experimental WebGL2 beard renderer.
 * Local MediaPipe face landmarks (x,y,z), GPU depth testing, stable seeded hair.
 * No claim of photorealism until tested on actual Android hardware.
 */
(function(global){
'use strict';
let enabled=false,host=null,video=null,canvas=null,gl=null,program=null,buffer=null,observer=null;
let lastRender=0,frameBudget=33.3,quality=1,slowFrames=0,fastFrames=0,contextLost=false;
let follicles=null,meshLoading=null,selectedStyle='full';
const scriptBase=document.currentScript?.src||new URL('./leon-ai-effects/beard-webgl3d.js',location.href).href;
const L0=[234,93,132,58,172,136,150,149,176,148,152];
const L1=[116,117,118,119,100,126,209,43,57,171,152];
const L_MID=[123,147,187,205,206,207,216,212,202,204,152];
const R0=[454,323,361,288,397,365,379,378,400,377,152];
const R1=[345,346,347,348,329,355,429,273,287,396,152];
const R_MID=[352,376,411,425,426,427,436,432,422,418,152];
const C0=[58,172,136,150,149,176,148,152,377,400,378,379,365,397,288];
const C1=[57,43,204,194,140,171,199,175,396,369,262,418,406,273,287];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function shader(type,source){
 const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
 return s;
}
function initialize(){
 gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false,depth:true,preserveDrawingBuffer:true});
 if(!gl)throw Error('WebGL2 unavailable');
 const vs=shader(gl.VERTEX_SHADER,`#version 300 es
 in vec3 aPosition; in float aOpacity; in float aShade;
 uniform vec4 uProjection; uniform vec2 uCanvas; uniform float uMirror;
 out float vOpacity; out float vShade;
 void main(){
  float x=(uProjection.x+aPosition.x*uProjection.z)/uCanvas.x;
  float y=(uProjection.y+aPosition.y*uProjection.w)/uCanvas.y;
  // Coordinates are normalized to the canvas, with cropping accounted for on CPU.
  gl_Position=vec4((uMirror<0.0?1.0-x:x)*2.0-1.0,1.0-y*2.0,clamp(aPosition.z*0.45,-0.95,0.95),1.0);
  vOpacity=aOpacity;vShade=aShade;
 }`);
 const fs=shader(gl.FRAGMENT_SHADER,`#version 300 es
 precision mediump float;
 in float vOpacity; in float vShade; out vec4 outColor;
 void main(){vec3 base=mix(vec3(.022,.015,.012),vec3(.14,.105,.083),clamp(vShade,0.,1.));outColor=vec4(base,vOpacity);}`);
 program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 buffer=gl.createBuffer();gl.useProgram(program);
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 const stride=20;
 const p=gl.getAttribLocation(program,'aPosition'),a=gl.getAttribLocation(program,'aOpacity'),s=gl.getAttribLocation(program,'aShade');
 gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,3,gl.FLOAT,false,stride,0);
 gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,1,gl.FLOAT,false,stride,12);
 gl.enableVertexAttribArray(s);gl.vertexAttribPointer(s,1,gl.FLOAT,false,stride,16);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
}
function hash(i,s){const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)}
// Deterministic but independent samples: hair roots stay anchored when the
// head moves instead of being regenerated at unrelated screen coordinates.
function sample(i,seed,channel){return hash(i*37+channel*101,seed*19+channel*53)}
function setQuality(level){quality=clamp(Number(level)||1,.35,1)}
function qualityStatus(){return {quality,frameBudgetMs:frameBudget}}
function projected(){
 const vr=video.getBoundingClientRect(),hr=host.getBoundingClientRect();
 const vw=video.videoWidth,vh=video.videoHeight;if(!vw||!vh||!vr.width||!vr.height)return null;
 const style=getComputedStyle(video),fit=style.objectFit;
 const scale=fit==='cover'?Math.max(vr.width/vw,vr.height/vh):fit==='contain'?Math.min(vr.width/vw,vr.height/vh):null;
 const w=scale?vw*scale:vr.width,h=scale?vh*scale:vr.height;
 const pos=(style.objectPosition||'50% 50%').split(/\s+/);
 const pct=v=>v?.endsWith('%')?clamp(parseFloat(v)/100,0,1):.5;
 const x=vr.left-hr.left+(vr.width-w)*pct(pos[0]);
 const y=vr.top-hr.top+(vr.height-h)*pct(pos[1]||pos[0]);
 const mirror=style.transform.includes('matrix(-')||style.transform.includes('scaleX(-1)')||video.classList.contains('mirrored');
 return {x,y,w,h,mirror:false};
}
// Canonical mesh is bundled locally; no remote service is needed at runtime.
async function loadFollicles(){
 if(follicles)return follicles;
 if(meshLoading)return meshLoading;
 meshLoading=(async()=>{
  const response=await fetch(new URL('./assets/canonical_face_model.obj',scriptBase));
  if(!response.ok)throw Error('Canonical face mesh unavailable: '+response.status);
  const vertices=[],faces=[];
  for(const line of (await response.text()).split(/\r?\n/)){
   if(line.startsWith('v ')){const p=line.trim().split(/\s+/);vertices.push([+p[1],+p[2],+p[3]])}
   else if(line.startsWith('f ')){const ids=line.trim().split(/\s+/).slice(1).map(v=>parseInt(v,10)-1);for(let i=1;i<ids.length-1;i++)faces.push([ids[0],ids[i],ids[i+1]])}
  }
  if(vertices.length!==468||faces.length<800)throw Error('Unexpected canonical topology');
  const roots=[];
  for(let t=0;t<faces.length;t++){
   const ids=faces[t],a=vertices[ids[0]],b=vertices[ids[1]],d=vertices[ids[2]];
   const x=(a[0]+b[0]+d[0])/3,y=(a[1]+b[1]+d[1])/3;
   // Anatomical follicle mask: cheeks, jaw, chin; exclude upper face/nose.
   const cheek=Math.abs(x)>1.35&&Math.abs(x)<7.2&&y<-.85&&y>-7.9;
   const chin=Math.abs(x)<=3.5&&y< -5.15&&y> -9.2;
   // Upper lip: leave a clear central philtrum and never enter the lip line.
   const mustache=Math.abs(x)>.32&&Math.abs(x)<2.65&&y< -2.65&&y> -3.88;
   const connector=Math.abs(x)>1.9&&Math.abs(x)<3.5&&y< -3.25&&y> -5.45;
   if(!cheek&&!chin&&!mustache&&!connector)continue;
   const cross=Math.hypot((b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0]),(b[1]-a[1])*(d[2]-a[2])-(b[2]-a[2])*(d[1]-a[1]),(b[2]-a[2])*(d[0]-a[0])-(b[0]-a[0])*(d[2]-a[2]));
   const n=Math.min(72,Math.max(3,Math.floor(cross*(mustache?12:cheek?10:8))));
   for(let i=0;i<n;i++){
    const q=Math.sqrt(sample(i,t,0)),v=sample(i,t,1);
    roots.push({canonicalX:x,canonicalY:y,ids,weights:[1-q,q*(1-v),q*v],length:(mustache?.0012:.0018)+sample(i,t,2)*(mustache?.002:.0035),tilt:(sample(i,t,3)-.5)*.002,shade:sample(i,t,4),alpha:.34+sample(i,t,5)*.48,region:mustache?'mustache':'beard'});
   }
  }
  follicles=roots;return roots;
 })().catch(error=>{meshLoading=null;console.warn('KLK canonical mesh unavailable:',error);return null});
 return meshLoading;
}
function draw(geometry){
 if(!gl||!canvas||contextLost)return;
 const started=performance.now();
 if(started-lastRender<frameBudget*.75)return;
 lastRender=started;
 gl.viewport(0,0,canvas.width,canvas.height);
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const pts=geometry?.landmarks;if(!pts||pts.length<468||!follicles)return;
 const p=projected();if(!p)return;
 const lipL=pts[61],lipR=pts[291],lipTop=pts[0],lipBottom=pts[17];
 const mouthMinX=Math.min(lipL.x,lipR.x)-.018,mouthMaxX=Math.max(lipL.x,lipR.x)+.018;
 const mouthMinY=lipTop.y-.025,mouthMaxY=lipBottom.y+.023;
 const segments=[],step=Math.max(1,Math.round(1/quality));
 const style=global.KLKBeardStyles?.get(selectedStyle);
 if(!style)return;
 const visible=root=>{
  const x=Math.abs(root.canonicalX),y=root.canonicalY;
  const region=root.region==='mustache'?'mustache':y< -5.5?(x<2.7?'chin':'jaw'):x>3.2?'cheeks':x>1.9&&y< -3.25?'connectors':'chin';
  if(!style.regions.includes(region))return false;
  if(style.silhouette==='strap'&&region==='jaw'&&y> -4.8)return false;
  if(style.silhouette==='pointed'&&region==='chin'&&x>2.3)return false;
  if(style.silhouette==='anchor'&&region==='jaw'&&x>4.5)return false;
  if(style.silhouette==='balbo'&&region==='jaw'&&x>4.8)return false;
  return true;
 };
 for(let k=0;k<follicles.length;k+=step){
  const root=follicles[k];if(!visible(root)||sample(k,17,0)>style.density)continue;
  const [a,b,d]=root.ids.map(i=>pts[i]);if(!a||!b||!d)continue;
  const [u,v,w]=root.weights;
  const x=a.x*u+b.x*v+d.x*w,y=a.y*u+b.y*v+d.y*w,z=a.z*u+b.z*v+d.z*w;
  if(x>=mouthMinX&&x<=mouthMaxX&&y>=mouthMinY&&y<=mouthMaxY)continue;
  if(Math.max(a.z,b.z,d.z)-Math.min(a.z,b.z,d.z)>.12)continue;
  // Use local jaw direction so hairs rotate with the face, not the viewport.
  const dirX=(pts[152].x-pts[1].x),dirY=(pts[152].y-pts[1].y);
  const mag=Math.max(.02,Math.hypot(dirX,dirY));
  const hairLength=root.length*clamp(style.lengthMm/28,.15,3.5);
  const dx=root.region==='mustache'?(x<pts[1].x?-1:1)*hairLength*.6+root.tilt:dirX/mag*hairLength+root.tilt;
  const dy=root.region==='mustache'?hairLength*.3:dirY/mag*hairLength;
  segments.push(x,y,z,root.alpha,root.shade,x+dx,y+dy,z,root.alpha*.12,Math.min(1,root.shade+.18));
 }
 if(!segments.length)return;
 const data=new Float32Array(segments);
 gl.useProgram(program);
 gl.uniform4f(gl.getUniformLocation(program,'uProjection'),p.x,p.y,p.w,p.h);
 gl.uniform2f(gl.getUniformLocation(program,'uCanvas'),canvas.width,canvas.height);
 gl.uniform1f(gl.getUniformLocation(program,'uMirror'),p.mirror?-1:1);
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
 gl.drawArrays(gl.LINES,0,data.length/5);
 const elapsed=performance.now()-started;
 if(elapsed>20){slowFrames++;fastFrames=0}else if(elapsed<9){fastFrames++;slowFrames=0}else{slowFrames=0;fastFrames=0}
 if(slowFrames>=8){quality=Math.max(.35,quality*.8);slowFrames=0}
 if(fastFrames>=90){quality=Math.min(1,quality+.08);fastFrames=0}
}
function resize(){if(!canvas||!host)return;const r=host.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width));canvas.height=Math.max(1,Math.round(r.height))}
function detach(){
 observer?.disconnect();observer=null;
 if(host)host.removeEventListener('klk:facegeometry',onFrame);
 if(gl){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program)}
 if(canvas){canvas.removeEventListener('webglcontextlost',onContextLost);canvas.removeEventListener('webglcontextrestored',onContextRestored)}
 canvas?.remove();host=video=canvas=gl=program=buffer=null;contextLost=false;
}
function onFrame(event){draw(event.detail?.geometry)}
function onContextLost(event){event.preventDefault();contextLost=true;console.warn('KLK beard GPU context lost; preview effect suspended')}
function onContextRestored(){contextLost=false;try{initialize();resize()}catch(error){console.warn('KLK beard GPU restore failed',error);contextLost=true}}
function sync(){
 if(!enabled)return;
 const next=document.getElementById('klkStatusCamera'),v=next?.querySelector('video');
 if(!next||!v||!next.isConnected)return;
 if(next===host&&v===video)return;
 detach();host=next;video=v;canvas=document.createElement('canvas');
 canvas.className='klkBeardMaskOverlay';
 canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;visibility:hidden';
 if(getComputedStyle(host).position==='static')host.style.position='relative';
 host.appendChild(canvas);
 canvas.addEventListener('webglcontextlost',onContextLost,false);
 canvas.addEventListener('webglcontextrestored',onContextRestored,false);
 try{initialize()}catch(error){console.warn('KLK WebGL beard unavailable:',error);detach();return}
 resize();host.addEventListener('klk:facegeometry',onFrame);
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(resize);observer.observe(host);observer.observe(video)}
}
function setStyle(id){if(!global.KLKBeardStyles?.get(id))return false;selectedStyle=id;return true}
function setEnabled(v){enabled=!!v;if(enabled){lastRender=0;loadFollicles();sync()}else detach()}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&gl){gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)}});
window.addEventListener('resize',resize);
global.KLKBeardMask=Object.freeze({setEnabled,setStyle,getStyle:()=>selectedStyle,setQuality,qualityStatus,resize,clear:()=>{if(gl)gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)}});
})(window);
