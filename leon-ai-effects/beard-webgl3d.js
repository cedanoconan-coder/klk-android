/* León AI Effects: experimental WebGL2 beard renderer.
 * Local MediaPipe face landmarks (x,y,z), GPU depth testing, stable seeded hair.
 * No claim of photorealism until tested on actual Android hardware.
 */
(function(global){
'use strict';
let enabled=false,host=null,video=null,canvas=null,gl=null,program=null,buffer=null,observer=null;
const L0=[234,93,132,58,172,136,150,149,176,148,152];
const L1=[116,117,118,119,100,126,209,43,57,171,152];
const R0=[454,323,361,288,397,365,379,378,400,377,152];
const R1=[345,346,347,348,329,355,429,273,287,396,152];
const C0=[58,172,136,150,149,176,148,152,377,400,378,379,365,397,288];
const C1=[57,43,204,194,140,171,199,175,396,369,262,418,406,273,287];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function shader(type,source){
 const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
 return s;
}
function initialize(){
 gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false,depth:true});
 if(!gl)throw Error('WebGL2 unavailable');
 const vs=shader(gl.VERTEX_SHADER,`#version 300 es
 in vec3 aPosition; in float aOpacity;
 uniform vec4 uProjection; uniform float uMirror;
 out float vOpacity;
 void main(){
  float x=(uProjection.x+aPosition.x*uProjection.z)/uProjection.z;
  float y=(uProjection.y+aPosition.y*uProjection.w)/uProjection.w;
  // Coordinates are normalized to the canvas, with cropping accounted for on CPU.
  gl_Position=vec4(uMirror*x*2.0-1.0,1.0-y*2.0,clamp(aPosition.z*0.45,-0.95,0.95),1.0);
  vOpacity=aOpacity;
 }`);
 const fs=shader(gl.FRAGMENT_SHADER,`#version 300 es
 precision mediump float;
 in float vOpacity; out vec4 outColor;
 void main(){outColor=vec4(0.065,0.045,0.036,vOpacity);}`);
 program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 buffer=gl.createBuffer();gl.useProgram(program);
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 const stride=16;
 const p=gl.getAttribLocation(program,'aPosition'),a=gl.getAttribLocation(program,'aOpacity');
 gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,3,gl.FLOAT,false,stride,0);
 gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,1,gl.FLOAT,false,stride,12);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
}
function hash(i,s){let x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)}
function projected(){
 const vr=video.getBoundingClientRect(),hr=host.getBoundingClientRect();
 const vw=video.videoWidth,vh=video.videoHeight;if(!vw||!vh||!vr.width||!vr.height)return null;
 const style=getComputedStyle(video),fit=style.objectFit;
 const scale=fit==='cover'?Math.max(vr.width/vw,vr.height/vh):fit==='contain'?Math.min(vr.width/vw,vr.height/vh):null;
 const w=scale?vw*scale:vr.width,h=scale?vh*scale:vr.height;
 const pos=(style.objectPosition||'50% 50%').split(/\\s+/);
 const pct=v=>v?.endsWith('%')?clamp(parseFloat(v)/100,0,1):.5;
 const x=vr.left-hr.left+(vr.width-w)*pct(pos[0]);
 const y=vr.top-hr.top+(vr.height-h)*pct(pos[1]||pos[0]);
 const mirror=/matrix\\(-|scaleX\\(-1\\)/.test(style.transform)||video.classList.contains('mirrored');
 return {x,y,w,h,mirror};
}
function draw(geometry){
 if(!gl||!canvas)return;
 gl.viewport(0,0,canvas.width,canvas.height);
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const pts=geometry?.landmarks;if(!pts||pts.length<455)return;
 const p=projected();if(!p)return;
 const l=pts[234],r=pts[454],nose=pts[1];
 const yaw=Math.abs(r.x-l.x)>.035?clamp((nose.x-(l.x+r.x)/2)/(r.x-l.x)*2,-1,1):0;
 const segments=[];
 function triangle(a,b,c,seed,opacity){
  if(!a||!b||!c||opacity<.05)return;
  const area=Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
  if(area<.000008||Math.max(a.z,b.z,c.z)-Math.min(a.z,b.z,c.z)>.14)return;
  const count=Math.min(90,Math.floor(area*9500));
  for(let i=0;i<count;i++){
   const q=Math.sqrt(hash(i,seed)),v=hash(i,seed+1);
   const aa=1-q,bb=q*(1-v),cc=q*v;
   const x=a.x*aa+b.x*bb+c.x*cc,y=a.y*aa+b.y*bb+c.y*cc,z=a.z*aa+b.z*bb+c.z*cc;
   const length=.003+hash(i,seed+2)*.004;
   const dx=(hash(i,seed+3)-.5)*length*.6;
   const alpha=(.32+hash(i,seed+4)*.45)*opacity;
   segments.push(x,y,z,alpha,x+dx,y+length,z,alpha);
  }
 }
 function strip(out,inside,seed,opacity){
  for(let i=0;i<out.length-1;i++){
   const a=pts[out[i]],b=pts[inside[i]],c=pts[out[i+1]],d=pts[inside[i+1]];
   triangle(a,b,c,seed+i*4,opacity);triangle(b,d,c,seed+i*4+2,opacity);
  }
 }
 strip(L0,L1,101,clamp((.52-yaw)/.40,0,1));
 strip(R0,R1,201,clamp((.52+yaw)/.40,0,1));
 strip(C0,C1,301,1);
 if(!segments.length)return;
 const data=new Float32Array(segments);
 gl.useProgram(program);
 // Canvas coordinate conversion and mirror transform.
 gl.uniform4f(gl.getUniformLocation(program,'uProjection'),p.x,p.y,p.w,p.h);
 gl.uniform1f(gl.getUniformLocation(program,'uMirror'),p.mirror?-1:1);
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
 gl.drawArrays(gl.LINES,0,data.length/4);
}
function resize(){if(!canvas||!host)return;const r=host.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width));canvas.height=Math.max(1,Math.round(r.height))}
function detach(){
 observer?.disconnect();observer=null;
 if(host)host.removeEventListener('klk:facegeometry',onFrame);
 if(gl){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program)}
 canvas?.remove();host=video=canvas=gl=program=buffer=null;
}
function onFrame(event){draw(event.detail?.geometry)}
function sync(){
 if(!enabled)return;
 const next=document.getElementById('klkStatusCamera'),v=next?.querySelector('video');
 if(!next||!v||!next.isConnected)return;
 if(next===host&&v===video)return;
 detach();host=next;video=v;canvas=document.createElement('canvas');
 canvas.className='klkBeardMaskOverlay';
 canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';
 if(getComputedStyle(host).position==='static')host.style.position='relative';
 host.appendChild(canvas);
 try{initialize()}catch(error){console.warn('KLK WebGL beard unavailable:',error);detach();return}
 resize();host.addEventListener('klk:facegeometry',onFrame);
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(resize);observer.observe(host);observer.observe(video)}
}
function setEnabled(v){enabled=!!v;if(enabled)sync();else detach()}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&gl){gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)}});
window.addEventListener('resize',resize);
global.KLKBeardMask=Object.freeze({setEnabled,resize,clear:()=>{if(gl)gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)}});
})(window);
