/* KLK Estados: depth-aware face mesh beard. Local camera preview only.
 * Uses MediaPipe x/y/z landmark geometry; no server image transfer.
 * The procedural hair is a preview, not a photorealistic hair model.
 */
(function(global){
'use strict';
let enabled=false,host=null,video=null,canvas=null,ctx=null,observer=null;
const LEFT_OUT=[234,93,132,58,172,136,150,149,176,148,152];
const LEFT_IN =[116,117,118,119,100,126,209,43,57,171,152];
const RIGHT_OUT=[454,323,361,288,397,365,379,378,400,377,152];
const RIGHT_IN =[345,346,347,348,329,355,429,273,287,396,152];
const CHIN_OUT=[58,172,136,150,149,176,148,152,377,400,378,379,365,397,288];
const CHIN_IN =[57,43,204,194,140,171,199,175,396,369,262,418,406,273,287];
const MOUTH=[61,40,37,0,267,270,291,321,314,17,84,91];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function projection(){
 if(!video||!host)return null;
 const vr=video.getBoundingClientRect(),hr=host.getBoundingClientRect();
 const vw=video.videoWidth,vh=video.videoHeight;
 if(!vw||!vh||!vr.width||!vr.height)return null;
 const css=getComputedStyle(video),fit=css.objectFit||'fill';
 const scale=fit==='cover'?Math.max(vr.width/vw,vr.height/vh):fit==='contain'?Math.min(vr.width/vw,vr.height/vh):null;
 const w=scale?vw*scale:vr.width,h=scale?vh*scale:vr.height;
 const pos=(css.objectPosition||'50% 50%').split(/\\s+/);
 const frac=s=>s?.endsWith('%')?clamp(parseFloat(s)/100,0,1):.5;
 const x=vr.left-hr.left+(vr.width-w)*frac(pos[0]);
 const y=vr.top-hr.top+(vr.height-h)*frac(pos[1]||pos[0]);
 const mirror=/matrix\\(-|scaleX\\(-1\\)/.test(css.transform)||video.classList.contains('mirrored');
 return {x,y,w,h,mirror};
}
function clear(){if(ctx&&canvas)ctx.clearRect(0,0,canvas.width,canvas.height)}
function facePoint(pts,i){return pts[i]}
function yawOf(pts){
 const l=pts[234],r=pts[454],n=pts[1];
 const width=r.x-l.x;
 return Math.abs(width)<.035?0:clamp((n.x-(l.x+r.x)/2)/width*2,-1,1);
}
function polygon(ids,pts,w,h){
 ctx.beginPath();
 ids.forEach((id,i)=>{const p=facePoint(pts,id);if(i)ctx.lineTo(p.x*w,p.y*h);else ctx.moveTo(p.x*w,p.y*h)});
 ctx.closePath();
}
function hash(x,y,seed){const n=Math.sin(x*127.1+y*311.7+seed*74.7)*43758.5453;return n-Math.floor(n)}
function hairTriangle(a,b,c,w,h,seed,visibility){
 const ax=a.x*w,ay=a.y*h,bx=b.x*w,by=b.y*h,cx=c.x*w,cy=c.y*h;
 const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
 if(Math.abs(area)<w*h*.000007)return;
 // Depth variation prevents hairs from crossing sharp face folds.
 const zrange=Math.max(a.z,b.z,c.z)-Math.min(a.z,b.z,c.z);
 if(zrange>.14)return;
 const count=Math.min(130,Math.ceil(Math.abs(area)/(w*h)*6500));
 if(count<2)return;
 ctx.save();ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx,cy);ctx.closePath();ctx.clip();
 ctx.fillStyle='rgba(30,23,21,'+(0.10*visibility).toFixed(3)+')';ctx.fill();
 for(let k=0;k<count;k++){
  const u=hash(k,seed,1),v=hash(k,seed,2),su=1-Math.sqrt(u),sv=Math.sqrt(u)*(1-v),sw=Math.sqrt(u)*v;
  const x=su*ax+sv*bx+sw*cx,y=su*ay+sv*by+sw*cy;
  const density=hash(k,seed,3);if(density>.8*visibility)continue;
  const len=w*(.003+hash(k,seed,4)*.005);
  ctx.strokeStyle=density<.3?'rgba(19,15,14,.72)':'rgba(42,30,25,.52)';
  ctx.lineWidth=Math.max(.55,w*.0009);
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+(hash(k,seed,5)-.5)*len,y+len*.5,x+(hash(k,seed,6)-.5)*len,y+len);ctx.stroke();
 }
 ctx.restore();
}
function strip(outer,inner,pts,w,h,seed,visibility){
 if(visibility<=0)return;
 for(let i=0;i<outer.length-1;i++){
  const a=pts[outer[i]],b=pts[inner[i]],c=pts[outer[i+1]],d=pts[inner[i+1]];
  if(!a||!b||!c||!d)continue;
  hairTriangle(a,b,c,w,h,seed+i*2,visibility);
  hairTriangle(b,d,c,w,h,seed+i*2+1,visibility);
 }
}
function draw(geometry){
 if(!enabled||!ctx||!canvas)return;
 clear();const pts=geometry?.landmarks;if(!pts||pts.length<455)return;
 const p=projection();if(!p)return;
 const yaw=yawOf(pts);
 // Suppress far-side triangles, rather than drawing a thin black edge.
 const left=clamp((.52-yaw)/.40,0,1),right=clamp((.52+yaw)/.40,0,1);
 ctx.save();ctx.translate(p.x+(p.mirror?p.w:0),p.y);if(p.mirror)ctx.scale(-1,1);
 strip(LEFT_OUT,LEFT_IN,pts,p.w,p.h,101,left);
 strip(RIGHT_OUT,RIGHT_IN,pts,p.w,p.h,201,right);
 strip(CHIN_OUT,CHIN_IN,pts,p.w,p.h,301,1);
 // Clear lip and mouth region after all beard layers.
 if(MOUTH.every(i=>pts[i])){
  polygon(MOUTH,pts,p.w,p.h);
  ctx.globalCompositeOperation='destination-out';ctx.lineJoin='round';
  ctx.lineWidth=Math.max(14,p.w*.034);ctx.stroke();ctx.fill();
 }
 ctx.restore();
}
function onGeometry(event){draw(event.detail?.geometry)}
function resize(){if(!canvas||!host)return;const r=host.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width));canvas.height=Math.max(1,Math.round(r.height))}
function detach(){observer?.disconnect();observer=null;if(host)host.removeEventListener('klk:facegeometry',onGeometry);canvas?.remove();host=video=canvas=ctx=null}
function sync(){
 if(!enabled)return;
 const next=document.getElementById('klkStatusCamera'),v=next?.querySelector('video');
 if(!next||!v||!next.isConnected)return;if(next===host&&v===video)return;
 detach();host=next;video=v;canvas=document.createElement('canvas');canvas.className='klkBeardMaskOverlay';
 canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';
 if(getComputedStyle(host).position==='static')host.style.position='relative';
 host.appendChild(canvas);ctx=canvas.getContext('2d');host.addEventListener('klk:facegeometry',onGeometry);
 resize();if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(resize);observer.observe(host);observer.observe(video)}
}
function setEnabled(value){enabled=!!value;if(enabled)sync();else detach()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});window.addEventListener('resize',resize);
global.KLKBeardMask=Object.freeze({setEnabled,resize,clear});
})(window);
