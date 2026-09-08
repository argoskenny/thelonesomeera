import * as THREE from 'three';

/** A fixed celestial background: translation never makes the moon follow a nearby building. */
export function createNightSky():THREE.CanvasTexture {
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
 const ctx=canvas.getContext('2d')!;
 const gradient=ctx.createLinearGradient(0,0,0,650);
 gradient.addColorStop(0,'#08121f');gradient.addColorStop(.6,'#101f30');gradient.addColorStop(.79,'#12202b');gradient.addColorStop(1,'#12202b');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,2048,1024);
 let seed=7291;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 // Sparse, steady square stars keep the same pixel-like treatment as the night-market signs.
 for(let i=0;i<85;i++){
  const x=Math.floor(random()*2048),y=90+Math.floor(random()*355),size=random()>.88?3:2;
  ctx.fillStyle=`rgba(210,224,237,${.30+random()*.40})`;ctx.fillRect(x,y,size,size);
 }
 // One small warm moon, pre-corrected for equirectangular stretching at its elevation.
 const elevation=27*Math.PI/180,mx=1024,my=512-elevation/Math.PI*1024;
 ctx.save();ctx.translate(mx,my);ctx.scale(1/Math.cos(elevation),1);
 ctx.fillStyle='rgba(217,226,219,.035)';ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#e3e4cb';ctx.beginPath();for(let i=0;i<24;i++){const angle=i/24*Math.PI*2;const x=Math.cos(angle)*12,y=Math.sin(angle)*12;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.clip();
 ctx.fillStyle='#c4cbbb';for(const [x,y,r] of [[-4,-3,3],[5,4,2.5],[-2,7,1.5],[6,-6,1.7]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.restore();
 // Broad, angular wisps sit above the skyline. Keep the moon's immediate patch of sky clear.
 for(const [x,y,w,h] of [[210,320,210,23],[560,245,250,28],[840,385,150,15],[1240,250,245,25],[1530,360,240,21],[1900,290,170,18]]){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(74,89,108,.23)';
  ctx.beginPath();ctx.moveTo(-w*.5,h*.1);ctx.lineTo(-w*.30,-h*.12);ctx.lineTo(-w*.18,-h*.65);ctx.lineTo(-w*.04,-h*.48);ctx.lineTo(w*.09,-h*.85);ctx.lineTo(w*.23,-h*.4);ctx.lineTo(w*.33,-h*.33);ctx.lineTo(w*.5,h*.15);ctx.lineTo(w*.22,h*.30);ctx.lineTo(-w*.14,h*.22);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(99,113,130,.10)';ctx.beginPath();ctx.moveTo(-w*.31,-h*.10);ctx.lineTo(-w*.16,-h*.48);ctx.lineTo(-w*.03,-h*.30);ctx.lineTo(w*.10,-h*.65);ctx.lineTo(w*.29,-h*.17);ctx.closePath();ctx.fill();ctx.restore();
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;return texture;
}
