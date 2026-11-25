import * as T from 'three';
import { assetUrl } from '../../shared/assets';
import { makeTexture,noise } from '../../shared/procedural';
export async function loadMaterials(renderer:T.WebGLRenderer){
  const loader=new T.TextureLoader();
  const load=async(scope:Parameters<typeof assetUrl>[0],file:string,color=false)=>{const t=await loader.loadAsync(assetUrl(scope,file));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;return t;};
  const [limestone,normal,rock,rockNormal,leaf,roof,banner]=await Promise.all([load('aerie','limestone.jpg',true),load('shared','concrete-normal.jpg'),load('aurelia','cliff.jpg',true),load('afterlight','rock-normal.jpg'),load('aerie','leaf.png',true),load('aurelia','terracotta.jpg',true),load('aurelia','heraldry.jpg',true)]);
  const paving=makeTexture(1024,(x,y)=>{const row=Math.floor(y/128),xx=(x+row%2*160)%320,yy=y%128,seam=xx<3||yy<3,v=seam?80:178+noise(x*.7,y*.7)*14+noise(x/35,y/35)*14;return[v,v*.96,v*.86];});
  const stone=new T.MeshStandardMaterial({map:limestone,color:0xe0d8c5,normalMap:normal,normalScale:new T.Vector2(.28,.28),roughness:.88,bumpMap:limestone,bumpScale:.024});
  const trim=stone.clone();trim.color.set(0xf4e7cf);trim.normalScale.set(.16,.16);
  const base=stone.clone();base.color.set(0x8f9284);
  const roofMat=new T.MeshStandardMaterial({map:roof,bumpMap:roof,bumpScale:.065,roughness:.85,color:0xd8a68b,side:T.DoubleSide});
  const cloth=new T.MeshStandardMaterial({map:banner,bumpMap:banner,bumpScale:.008,roughness:.91,side:T.DoubleSide});
  const windowMap=makeTexture(256,(x,y)=>{const seam=x%32<2||y%48<2,n=noise(Math.floor(x/32),Math.floor(y/48));return seam?[27,27,24]:[35+n*32,56+n*43,61+n*47];});
  const windowGlow=makeTexture(256,(x,y)=>{const lit=noise(Math.floor(x/32),Math.floor(y/48))>.68;return x%32<2||y%48<2||!lit?[0,0,0]:[255,185,90];});
  const stoneVariants=[0xd7c6a5,0xb5b6a3,0xe1d7ba,0xc5ad8f].map(c=>{const m=stone.clone();m.color.set(c);return m;});
  return {stone,trim,base,stoneVariants,roof:roofMat,copper:roofMat,cloth,banner,
    floor:new T.MeshStandardMaterial({map:paving,normalMap:normal,normalScale:new T.Vector2(.25,.25),bumpMap:paving,bumpScale:.035,roughness:.78}),
    gold:new T.MeshStandardMaterial({color:0xb4924c,metalness:.8,roughness:.32}),bronze:new T.MeshStandardMaterial({color:0x494a35,metalness:.72,roughness:.4}),
    glass:new T.MeshPhysicalMaterial({map:windowMap,emissive:0xffdaa2,emissiveMap:windowGlow,emissiveIntensity:.04,color:0xb6c7c5,metalness:.35,roughness:.22,clearcoat:1}),
    shadow:new T.MeshStandardMaterial({color:0x31332d,roughness:1}),
    rock:new T.MeshStandardMaterial({map:rock,bumpMap:rock,bumpScale:.3,normalMap:rockNormal,normalScale:new T.Vector2(.8,.8),color:0x707568,roughness:.94}),
    moss:new T.MeshStandardMaterial({map:rock,normalMap:rockNormal,color:0x566644,roughness:1}),
    soil:new T.MeshStandardMaterial({color:0x41412c,roughness:1}),bark:new T.MeshStandardMaterial({map:rock,color:0x51442d,roughness:1}),
    canopy:new T.MeshStandardMaterial({color:0x344c25,roughness:.9}),
    foliage:new T.MeshStandardMaterial({map:leaf,alphaTest:.42,roughness:.7,side:T.DoubleSide,color:0xf2f2c7,emissive:0x293a13,emissiveIntensity:.08}),
    flower:new T.MeshStandardMaterial({color:0xffffff,roughness:.72,side:T.DoubleSide}),
    sail:new T.MeshStandardMaterial({color:0xece2c5,roughness:.95,side:T.DoubleSide}),
    velvet:new T.MeshStandardMaterial({color:0x631e2a,roughness:1,normalMap:normal,normalScale:new T.Vector2(.05,.05)}),
    wood:new T.MeshStandardMaterial({map:limestone,color:0x584331,roughness:.65}),
    paper:new T.MeshStandardMaterial({color:0xd6c6a1,roughness:1}),
    lamp:new T.MeshStandardMaterial({color:0xffe4a9,emissive:0xffb354,emissiveIntensity:2.4,roughness:.3}),
    azure:new T.MeshStandardMaterial({color:0x81d9fa,emissive:0x0a98ff,emissiveIntensity:5.5,metalness:.22,roughness:.17}),
    water:new T.MeshPhysicalMaterial({color:0x387d87,metalness:.3,roughness:.16,transparent:true,opacity:.83,clearcoat:1}),
  };
}
export type Materials=Awaited<ReturnType<typeof loadMaterials>>;
