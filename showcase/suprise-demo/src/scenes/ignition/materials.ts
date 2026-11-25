import * as T from 'three';
import { makeTexture,noise } from '../../shared/procedural';
import { assetUrl } from '../../shared/assets';
export async function loadMaterials(renderer:T.WebGLRenderer){
  const loader=new T.TextureLoader();
  const load=async(name:string,color=false)=>{const t=await loader.loadAsync(assetUrl('shared',name));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;return t;};
  const [map,normal,rough,waterNormal]=await Promise.all([load('concrete-color.jpg',true),load('concrete-normal.jpg'),load('concrete-roughness.jpg'),load('water-normal.jpg')]);
  const metalMap=makeTexture(512,(x,y)=>{const band=Math.floor(y/32),seam=y%32<1?-.24:0,n=noise(x*.8,y*.08)*.08+noise(x/70,band)*.15+seam;return [165+n*190,171+n*190,179+n*190];});
  const metalRough=makeTexture(256,(x,y)=>{const v=105+noise(x/20,y/2)*62;return [v,v,v];});metalRough.colorSpace=T.NoColorSpace;
  const tiles=makeTexture(512,(x,y)=>{const row=Math.floor(y/12),xx=(x+(row%2)*6)%12,yy=y%12,edge=xx<.9||yy<.9,n=noise(Math.floor((x+(row%2)*6)/12),row);const v=edge?15:48+n*20;return [v,v+1,v+2];});
  const mat=(color:number,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const steel=new T.MeshPhysicalMaterial({map:metalMap,roughnessMap:metalRough,metalness:1,roughness:.58,clearcoat:.12,envMapIntensity:1.65});
  const ground=new T.MeshStandardMaterial({color:0xb0a89b,map,normalMap:normal,normalScale:new T.Vector2(.4,.4),roughnessMap:rough,roughness:.91});
  const concrete=ground.clone();concrete.roughness=.94;
  const dark=new T.MeshStandardMaterial({map:tiles,roughness:.65,metalness:.18,envMapIntensity:1.6,bumpMap:tiles,bumpScale:.012});
  return {ground,concrete,steel,dark,waterNormal,frame:mat(0x454c4e,.46,.75),alloy:mat(0xa5afb4,.31,.85),black:mat(0x171b20,.7,.35),white:mat(0xbfc3bc,.47,.22),yellow:mat(0xc4933b,.63,.2),red:mat(0xa73123,.43,.2),soil:mat(0x494a32,.97),asphalt:mat(0x292e31,.9),light:new T.MeshBasicMaterial({color:new T.Color(4,2.7,1.35),toneMapped:false}),green:new T.MeshBasicMaterial({color:0x72e9bc}),glass:mat(0x1d3846,.16,.75)};
}
export type Materials=Awaited<ReturnType<typeof loadMaterials>>;
export function label(text:string,bg='#171f25',ink='#e2dfcd'){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.strokeRect(9,9,494,110);ctx.font='500 35px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=ink;ctx.fillText(text,256,66);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map,roughness:.6});
}
