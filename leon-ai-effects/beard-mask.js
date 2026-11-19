/* Experimental beard mask for KLK Estados. Rendered locally over the preview.
 * A face-anchored 2D mask, NOT photorealistic 3D hair.
 */
(function(global){
'use strict';
let enabled=false,host=null,canvas=null,ctx=null,video=null;
const P=(a,i)=>a?.[i];
function path(indices,pts,w,h){
 if(indices.some(i=>!P(pts,i)))return false;
 ctx.beginPath();indices.forEach((i,n)=>{const p=P(pts,i);if(n)ctx.lineTo(p.x*w,p.y*h);else ctx.moveTo(p.x*w,p.y*h)});ctx.closePath();return true;
}
const perimeter=[234,93,132,58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,361,323,454,323,361,288,397,365];
const upper=[234,116,117,118,119,100,126,209,49,48,115,220,45,4,275,440,344,278,279,429,355,329,348,347,346,345,454];
function clear(){if(ctx&&canvas)ctx.clearRect(0,0,canvas.width,canvas.height)}
function draw(geometry){
 if(!enabled||!canvas||!ctx||!video)return;
 clear();if(!geometry?.landmarks)return;
 const pts=geometry.landmarks,w=canvas.width,h=canvas.height;
 if(!path([...upper,...perimeter.slice().reverse()],pts,w,h))return;
 ctx.save();ctx.fillStyle='rgba(23,17,16,0.65)';ctx.fill();
 // Keep the mouth and its surrounding skin free of the beard tint.
 const mouth=[61,40,37,0,267,270,291,321,314,17,84,91];
 if(path(mouth,pts,w,h)){ctx.globalCompositeOperation='destination-out';ctx.lineJoin='round';ctx.lineWidth=Math.max(8,w*.018);ctx.stroke();ctx.fill()}
 ctx.restore();
}
function onGeometry(event){draw(event.detail?.geometry)}
function sync(){
 if(!enabled)return;
 const next=document.getElementById('klkStatusCamera');
 const v=next?.querySelector('video[src],video');
 if(!next||!v||!next.isConnected)return;
 if(host===next&&video===v)return;
 detach();host=next;video=v;
 canvas=document.createElement('canvas');canvas.className='klkBeardMaskOverlay';
 canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';
 const style=getComputedStyle(host);if(style.position==='static')host.style.position='relative';
 host.appendChild(canvas);ctx=canvas.getContext('2d');
 host.addEventListener('klk:facegeometry',onGeometry);
 resize();
}
function resize(){if(!canvas||!host)return;const rect=host.getBoundingClientRect();canvas.width=Math.max(1,Math.round(rect.width));canvas.height=Math.max(1,Math.round(rect.height))}
function detach(){if(host)host.removeEventListener('klk:facegeometry',onGeometry);canvas?.remove();host=null;video=null;canvas=null;ctx=null}
function setEnabled(value){enabled=!!value;if(enabled)sync();else detach()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
window.addEventListener('resize',resize);
global.KLKBeardMask=Object.freeze({setEnabled,resize,clear});
})(window);
