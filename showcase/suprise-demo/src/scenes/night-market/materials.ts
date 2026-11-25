import * as THREE from 'three';
import { noise } from '../../shared/procedural';

import { assetUrl } from '../../shared/assets';
const font='"Noto Serif TC", "Songti TC", "PMingLiU", serif';
function canvasTexture(w:number,h:number,paint:(ctx:CanvasRenderingContext2D)=>void){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d')!;paint(ctx);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
}
function surfaceTexture(color:string,tiled=false){
  return canvasTexture(512,512,ctx=>{
    ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
    if(tiled){
      for(let y=0;y<512;y+=64)for(let x=0;x<512;x+=32){
        const v=noise(x*.1,y*.1);ctx.fillStyle=`rgba(${v>.5?'245,237,209':'20,22,23'},${Math.abs(v-.5)*.24})`;ctx.fillRect(x+1,y+1,30,62);
      }
      ctx.strokeStyle='rgba(18,23,24,.45)';ctx.lineWidth=1.5;
      for(let y=0;y<512;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}
      for(let x=0;x<512;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}
    }
    const image=ctx.getImageData(0,0,512,512);
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){
      const i=(y*512+x)*4;const v=(noise(x*.5,y*.5)-.5)*13-(noise(x/27,y/130)>.62?15:0);
      for(let c=0;c<3;c++)image.data[i+c]=Math.max(0,image.data[i+c]+v);
    }ctx.putImageData(image,0,0);
    for(let i=0;i<32;i++){const x=noise(i,2)*512,y=noise(i,4)*512;ctx.fillStyle='rgba(7,12,12,.06)';ctx.fillRect(x,y,1+noise(i,8)*6,noise(i,6)*110);}
  });
}
export async function nightMaterials(renderer:THREE.WebGLRenderer){
  const loader=new THREE.TextureLoader();
  const load=async(path:string,color=false)=>{
    const t=await loader.loadAsync(assetUrl(path.startsWith('night/')?'night-market':'shared',path.replace(/^night\//,'')));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;return t;
  };
  const [asphaltMap,asphaltNormal,asphaltRough,concreteMap,concreteNormal,metalMap,metalNormal,brickMap,brickNormal,waterNormal]=await Promise.all([
    load('night/asphalt-color.jpg',true),load('night/asphalt-normal.jpg'),load('night/asphalt-roughness.jpg'),
    load('concrete-color.jpg',true),load('concrete-normal.jpg'),load('night/metal-color.jpg',true),load('night/metal-normal.jpg'),
    load('night/brick-color.jpg',true),load('night/brick-normal.jpg'),load('water-normal.jpg'),
  ]);
  const standard=(options:THREE.MeshStandardMaterialParameters)=>new THREE.MeshStandardMaterial(options);
  const tileColors=['#817369','#a27f66','#656c6a','#9f9b8e','#514f4b','#886353','#78928d','#b0aaa0','#72695c','#8b8a75','#ac9576','#69767a','#868b80','#a9958d','#5c6864','#afaa91','#736764','#a7afa8','#687175','#7c7772','#ae987f','#708786','#997a66','#989e99','#7b7b69','#ada28d'];
  const tile=tileColors.map(c=>{const t=surfaceTexture(c,true);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2.2,2.2);return standard({map:t,bumpMap:t,bumpScale:.009,normalMap:concreteNormal,normalScale:new THREE.Vector2(.3,.3),roughness:.86});});
  const concrete=standard({color:0x999382,map:concreteMap,normalMap:concreteNormal,normalScale:new THREE.Vector2(.55,.55),roughness:.9});
  const brick=standard({color:0x9b7d6d,map:brickMap,normalMap:brickNormal,normalScale:new THREE.Vector2(.5,.5),roughness:.85});
  const asphalt=standard({color:0x596367,map:asphaltMap,normalMap:asphaltNormal,normalScale:new THREE.Vector2(.6,.6),roughnessMap:asphaltRough,roughness:.75,metalness:.1});
  const brushed=canvasTexture(1024,1024,ctx=>{
    ctx.fillStyle='#c3c5c0';ctx.fillRect(0,0,1024,1024);
    for(let y=0;y<1024;y++){
      const v=noise(y*.32,1);ctx.fillStyle=`rgba(${v>.5?'255,255,251':'31,39,40'},${Math.abs(v-.5)*.27})`;ctx.fillRect(0,y,1024,1);
    }
    for(let i=0;i<300;i++){
      const x=noise(i,1)*1024,y=noise(i,2)*1024,r=8+noise(i,3)*90;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#30372f11');g.addColorStop(1,'#30372f00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    for(let i=0;i<1000;i++){ctx.strokeStyle=`rgba(32,39,37,${noise(i,6)*.07})`;const x=noise(i,2)*1024,y=noise(i,3)*1024;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+noise(i,7)*210,y+noise(i,9)*3);ctx.stroke();}
  });brushed.wrapS=brushed.wrapT=THREE.RepeatWrapping;
  const steel=standard({color:0xffffff,metalness:.92,roughness:.27,map:brushed,bumpMap:brushed,bumpScale:.0015,roughnessMap:brushed,envMapIntensity:1.25});
  const aluminum=standard({color:0x727e80,metalness:.82,roughness:.46});
  const iron=standard({color:0x302d29,map:metalMap,roughness:.6,metalness:.7});
  const rust=standard({color:0x8d4930,map:metalMap,normalMap:metalNormal,roughness:.88,metalness:.45});
  const black=standard({color:0x151c1e,roughness:.72});
  const shutter=standard({color:0x666860,metalness:.65,roughness:.48,map:metalMap,normalMap:metalNormal,normalScale:new THREE.Vector2(.25,.25)});
  const bamboo=standard({color:0x9d794a,map:concreteMap,roughness:.85});
  const plasticRed=standard({color:0x9c291c,roughness:.37});
  const plasticGreen=standard({color:0x265847,roughness:.48});
  const plasticBlue=standard({color:0x194954,roughness:.4});
  const porcelain=standard({color:0xdfdbc8,roughness:.3});
  const gold=standard({color:0xaf7e35,metalness:.75,roughness:.38});
  const gateRed=standard({color:0x6a2115,map:concreteMap,roughness:.56});
  const roof=standard({color:0x442620,map:brickMap,normalMap:brickNormal,normalScale:new THREE.Vector2(.5,.5),roughness:.65,metalness:.18,side:THREE.DoubleSide});
  const glass=new THREE.MeshPhysicalMaterial({color:0xcee2da,metalness:.15,roughness:.13,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide});
  const darkGlass=standard({color:0x182b30,metalness:.42,roughness:.32});
  const windowLit=standard({color:0x8d6a35,emissive:0xffb163,emissiveIntensity:.35,roughness:.65});
  const warmBulb=standard({color:0xffecc8,emissive:0xffcc83,emissiveIntensity:4.5,roughness:.3});
  const coolBulb=standard({color:0xd7f9fb,emissive:0x80e3ee,emissiveIntensity:3.5,roughness:.3});
  const paper=canvasTexture(1024,512,ctx=>{
    const glow=ctx.createLinearGradient(0,0,0,512);
    glow.addColorStop(0,'#80321b');glow.addColorStop(.16,'#c85d2c');glow.addColorStop(.48,'#ffbd65');glow.addColorStop(.78,'#dc662d');glow.addColorStop(1,'#792d19');
    ctx.fillStyle=glow;ctx.fillRect(0,0,1024,512);
    for(let y=22;y<501;y+=19){
      ctx.fillStyle='#551e135e';ctx.fillRect(0,y,1024,3);
      ctx.fillStyle='#ffe29b33';ctx.fillRect(0,y+3,1024,2);
    }
    for(let x=0;x<1024;x+=85){ctx.fillStyle='#571b1129';ctx.fillRect(x,0,2,512);}
    for(let i=0;i<18000;i++){ctx.fillStyle=`rgba(75,26,15,${noise(i,4)*.19})`;ctx.fillRect(noise(i,1)*1024,noise(i,2)*512,1,3);}
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#7b271c';ctx.font=`900 146px "Kaiti TC", ${font}`;
    for(const x of[256,768])ctx.fillText('福',x,257);
  });
  const lantern=standard({map:paper,color:0xf39465,emissiveMap:paper,emissive:0xff6d2e,emissiveIntensity:1.45,bumpMap:paper,bumpScale:.004,roughness:.89});
  const fried=standard({color:0xa87736,map:concreteMap,normalMap:concreteNormal,normalScale:new THREE.Vector2(.22,.22),roughness:.8});
  const sausage=standard({color:0x742e1b,roughness:.34});
  const greens=standard({color:0x37662d,roughness:.77});
  const blossom=standard({color:0xc68d88,roughness:.78,normalMap:concreteNormal,normalScale:new THREE.Vector2(.06,.06)});
  const broth=standard({color:0x56411d,roughness:.16,metalness:.3});
  const cloth=[['#722b21','#ae503b'],['#163d47','#376772'],['#615441','#918369'],['#244335','#506446']].map(([base,stripe])=>{
    const t=canvasTexture(512,512,ctx=>{
      ctx.fillStyle=base;ctx.fillRect(0,0,512,512);ctx.fillStyle=stripe;ctx.fillRect(0,0,65,512);ctx.fillRect(256,0,65,512);
      for(let y=0;y<512;y+=3){ctx.strokeStyle='rgba(0,0,0,.09)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}
      for(let i=0;i<8000;i++){const x=noise(i,1)*512,y=noise(i,6)*512;ctx.fillStyle=`rgba(8,12,12,${noise(i,3)*.12})`;ctx.fillRect(x,y,2,2);}
      const g=ctx.createLinearGradient(0,0,0,512);g.addColorStop(0,'#00000000');g.addColorStop(1,'#14120b65');ctx.fillStyle=g;ctx.fillRect(0,0,512,512);
    });t.wrapS=t.wrapT=THREE.RepeatWrapping;return standard({map:t,roughness:.94,side:THREE.DoubleSide,bumpMap:t,bumpScale:.008});
  });
  return {tile,concrete,brick,asphalt,steel,aluminum,iron,rust,black,shutter,bamboo,plasticRed,plasticGreen,plasticBlue,porcelain,gold,gateRed,roof,glass,darkGlass,windowLit,warmBulb,coolBulb,lantern,fried,sausage,greens,blossom,broth,cloth,asphaltNormal,waterNormal};
}
export type NightMaterials=Awaited<ReturnType<typeof nightMaterials>>;
export type SignSpec={text:string;bg:string;ink:string;sub?:string;vertical?:boolean;glow?:number};
export function signMaterial(spec:SignSpec){
  const vertical=!!spec.vertical,w=vertical?256:1024,h=vertical?1024:320;
  const map=canvasTexture(w,h,ctx=>{
    ctx.fillStyle=spec.bg;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=spec.ink;ctx.globalAlpha=.75;ctx.lineWidth=vertical?3:4;ctx.strokeRect(9,9,w-18,h-18);ctx.globalAlpha=1;
    const bg=ctx.createLinearGradient(0,0,w,0);bg.addColorStop(0,'#00000030');bg.addColorStop(.5,'#ffffff12');bg.addColorStop(1,'#00000030');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.fillStyle=spec.ink;ctx.textAlign='center';ctx.textBaseline='middle';
    if(vertical){
      const chars=[...spec.text],size=Math.min(172,(h-160)/chars.length*.85);ctx.font=`900 ${size}px ${font}`;
      chars.forEach((char,i)=>ctx.fillText(char,w/2,65+(i+.5)*(h-170)/chars.length,w-34));
      ctx.font=`500 27px ${font}`;ctx.fillText(spec.sub||'台灣・在地滋味',w/2,h-55,w-30);
    }else{
      ctx.font=`900 ${Math.min(185,840/[...spec.text].length)}px ${font}`;ctx.fillText(spec.text,w/2,h*.45,w-68);
      ctx.font=`500 34px ${font}`;ctx.fillText(spec.sub||'現點現做　・　古早好滋味',w/2,h*.83,w-100);
    }
    // Printed lightboxes have dirt, scratched corners and a dark rubber surround.
    for(let i=0;i<1300;i++){ctx.globalAlpha=noise(i,4)*.08;ctx.fillStyle='#282318';ctx.fillRect(noise(i,8)*w,noise(i,2)*h,noise(i,6)*3+1,noise(i,12)*5+1);}ctx.globalAlpha=1;
    ctx.strokeStyle='#171b1b';ctx.lineWidth=7;ctx.strokeRect(0,0,w,h);
  });
  return new THREE.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:spec.glow??.9,roughness:.4,side:THREE.DoubleSide});
}
export function menuMaterial(items:string[],title='手作・小吃'){
  return new THREE.MeshStandardMaterial({map:canvasTexture(512,768,ctx=>{
    ctx.fillStyle='#d7c79b';ctx.fillRect(0,0,512,768);ctx.strokeStyle='#8c3424';ctx.lineWidth=9;ctx.strokeRect(14,14,484,740);
    ctx.textAlign='center';ctx.fillStyle='#792817';ctx.font=`900 55px ${font}`;ctx.fillText(title,256,90,445);
    ctx.strokeStyle='#8d674655';ctx.lineWidth=2;
    items.forEach((text,i)=>{ctx.font=`600 35px ${font}`;ctx.fillStyle='#292621';ctx.fillText(text,256,170+i*89,425);ctx.beginPath();ctx.moveTo(40,192+i*89);ctx.lineTo(472,192+i*89);ctx.stroke();});
    ctx.font=`400 25px ${font}`;ctx.fillStyle='#8c3424';ctx.fillText('請先付款　謝謝光臨',256,717);
  }),roughness:.85});
}
export function smokeTexture(){
  const t=canvasTexture(128,128,ctx=>{
    const d=ctx.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const radius=Math.hypot((x-64)/64,(y-64)/64),n=noise(x*.055,y*.055)*.6+noise(x*.15,y*.15)*.4;
      const i=(y*128+x)*4;d.data[i]=d.data[i+1]=d.data[i+2]=255;d.data[i+3]=Math.max(0,1-radius)*Math.max(0,1-radius)*n*240;
    }ctx.putImageData(d,0,0);
  });return t;
}
