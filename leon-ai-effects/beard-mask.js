/* KLK Estados: face-anchored procedural beard preview.
 * 2D preview, not photorealistic hair. No camera frames leave the device.
 */
(function(global){
'use strict';
let enabled=false,host=null,canvas=null,ctx=null,video=null;
const cheekL=[234,93,132,58,172,136,150,149,176,148,152,175,199,57,43,106,203,123,116,117,118,119,100,126,209];
const cheekR=[454,323,361,288,397,365,379,378,400,377,152,175,199,287,273,335,423,352,345,346,347,348,329,355,429];
const chin=[58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,287,273,335,406,418,262,369,396,175,199,171,140,32,194,204,43,57];
const mouth=[61,40,37,0,267,270,291,321,314,17,84,91];
function clear(){if(ctx&&canvas)ctx.clearRect(0,0,canvas.width,canvas.height)}
function polygon(ids,pts,w,h){
 if(ids.some(i=>!pts[i]))return false;
 ctx.beginPath();ids.forEach((i,n)=>{const p=pts[i];if(n)ctx.lineTo(p.x*w,p.y*h);else ctx.moveTo(p.x*w,p.y*h)});ctx.closePath();return true;
}
function region(ids,pts,w,h,seed){
 if(!polygon(ids,pts,w,h))return;
 ctx.save();ctx.clip();
 const bounds=ids.map(i=>pts[i]),minX=Math.max(0,Math.min(...bounds.map(p=>p.x*w))),maxX=Math.min(w,Math.max(...bounds.map(p=>p.x*w)));
 const minY=Math.max(0,Math.min(...bounds.map(p=>p.y*h))),maxY=Math.min(h,Math.max(...bounds.map(p=>p.y*h)));
 ctx.fillStyle='rgba(30,23,21,.19)';ctx.fill();

 // Generate strands in face-relative coordinates, not fixed screen pixels.
 // Screen-space seeds make the texture visibly slide when the head rotates.
 const left=pts[234],right=pts[454],top=pts[0],bottom=pts[152];
 const faceWidth=Math.max(1,Math.hypot((right.x-left.x)*w,(right.y-left.y)*h));
 const faceHeight=Math.max(1,Math.hypot((bottom.x-top.x)*w,(bottom.y-top.y)*h));
 const angle=Math.atan2((right.y-left.y)*h,(right.x-left.x)*w);
 const cx=(left.x+right.x)*w/2,cy=(left.y+right.y)*h/2;
 const cos=Math.cos(angle),sin=Math.sin(angle);
 const step=.012;
 for(let v=-.7;v<1.1;v+=step){
  for(let u=-.65;u<.65;u+=step){
   const hash=Math.sin(Math.round(u/step)*12.9898+Math.round(v/step)*78.233+seed*41.7)*43758.5453;
   const f=hash-Math.floor(hash);
   if(f<.38)continue;
   const x=cx+u*faceWidth*cos-v*faceHeight*sin;
   const y=cy+u*faceWidth*sin+v*faceHeight*cos;
   if(x<minX-10||x>maxX+10||y<minY-10||y>maxY+10)continue;
   const len=faceWidth*step*(.6+f*1.2);
   ctx.strokeStyle=f>.8?'rgba(17,13,12,.66)':'rgba(39,29,25,.48)';
   ctx.lineWidth=Math.max(.5,faceWidth*.0014);
   ctx.beginPath();ctx.moveTo(x,y);
   ctx.quadraticCurveTo(x-sin*len*.35,y+cos*len*.35,x-sin*len,y+cos*len);
   ctx.stroke();
  }
 }

 ctx.restore();
}
function draw(geometry){
 if(!enabled||!canvas||!ctx)return;
 clear();const pts=geometry?.landmarks;if(!pts||pts.length<455)return;
 const w=canvas.width,h=canvas.height;
 ctx.save();
 region(cheekL,pts,w,h,1);region(cheekR,pts,w,h,2);region(chin,pts,w,h,3);
 // Clear the complete mouth area, including lips, with a feathered-looking wide margin.
 if(polygon(mouth,pts,w,h)){
  ctx.globalCompositeOperation='destination-out';ctx.lineJoin='round';
  ctx.lineWidth=Math.max(12,w*.032);ctx.stroke();ctx.fill();
 }
 ctx.restore();
}
function onGeometry(event){draw(event.detail?.geometry)}
function resize(){if(!canvas||!host)return;const r=host.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width));canvas.height=Math.max(1,Math.round(r.height))}
function detach(){if(host)host.removeEventListener('klk:facegeometry',onGeometry);canvas?.remove();host=null;video=null;canvas=null;ctx=null}
function sync(){
 if(!enabled)return;const next=document.getElementById('klkStatusCamera'),v=next?.querySelector('video');
 if(!next||!v||!next.isConnected)return;if(host===next&&video===v)return;
 detach();host=next;video=v;canvas=document.createElement('canvas');canvas.className='klkBeardMaskOverlay';
 canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';
 if(getComputedStyle(host).position==='static')host.style.position='relative';
 host.appendChild(canvas);ctx=canvas.getContext('2d');host.addEventListener('klk:facegeometry',onGeometry);resize();
}
function setEnabled(value){enabled=!!value;if(enabled)sync();else detach()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});window.addEventListener('resize',resize);
global.KLKBeardMask=Object.freeze({setEnabled,resize,clear});
})(window);
