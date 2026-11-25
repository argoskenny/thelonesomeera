import * as T from 'three';
import { assetUrl } from '../../shared/assets';
import { makeTexture, noise } from '../../shared/procedural';

export async function loadMaterials(renderer:T.WebGLRenderer){
  const loader=new T.TextureLoader();
  const load=async(scope:'aerie'|'shared',name:string,color=false)=>{
    const t=await loader.loadAsync(assetUrl(scope,name));t.wrapS=t.wrapT=T.RepeatWrapping;
    t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;return t;
  };
  const [limestone,normal,leaf]=await Promise.all([load('aerie','limestone.jpg',true),load('shared','concrete-normal.jpg'),load('aerie','leaf.png',true)]);
  const paving=makeTexture(1024,(x,y)=>{
    const row=Math.floor(y/128),xx=(x+row%2*128)%256,yy=y%128;
    const seam=xx<3||yy<3,wear=noise(x*.5,y*.5)*13+noise(x/25,y/25)*15+noise(Math.floor((x+row%2*128)/256),row)*24;
    const v=seam?80:173+wear;return[v,v*.965,v*.88];
  });
  const copperMap=makeTexture(512,(x,y)=>{const n=noise(x/30,y/30)+noise(x/5,y/5)*.32,seam=x%64<2||y%128<2;return seam?[42,57,54]:[61+n*40,96+n*48,88+n*44];});
  const stone=new T.MeshStandardMaterial({map:limestone,color:0xc9c7b9,roughness:.88,normalMap:normal,normalScale:new T.Vector2(.32,.32),bumpMap:limestone,bumpScale:.045});
  const trim=stone.clone();trim.color.set(0xe0d8c3);trim.normalScale.set(.18,.18);
  const base=stone.clone();base.color.set(0x8e958b);
  const floor=new T.MeshStandardMaterial({map:paving,normalMap:normal,normalScale:new T.Vector2(.28,.28),bumpMap:paving,bumpScale:.035,roughness:.86});
  return {stone,trim,base,floor,
    copper:new T.MeshStandardMaterial({map:copperMap,bumpMap:copperMap,bumpScale:.018,metalness:.62,roughness:.57,color:0xc9dcce}),
    gold:new T.MeshStandardMaterial({color:0x9e8050,metalness:.8,roughness:.33}),
    bronze:new T.MeshStandardMaterial({color:0x35443f,metalness:.75,roughness:.48}),
    glass:new T.MeshPhysicalMaterial({color:0x334b55,metalness:.5,roughness:.2,clearcoat:1,envMapIntensity:1.4}),
    shadow:new T.MeshStandardMaterial({color:0x232d2b,roughness:1}),
    water:new T.MeshPhysicalMaterial({color:0x7da5a0,roughness:.13,metalness:.28,transparent:true,opacity:.82,clearcoat:1}),
    soil:new T.MeshStandardMaterial({color:0x353d27,roughness:1}),
    bark:new T.MeshStandardMaterial({color:0x514c37,roughness:1}),
    flower:new T.MeshStandardMaterial({color:0xe6d599,roughness:.8}),
    canopy:new T.MeshStandardMaterial({color:0x304327,roughness:1}),
    foliage:new T.MeshStandardMaterial({map:leaf,bumpMap:leaf,bumpScale:.006,alphaTest:.45,color:0xffffff,roughness:.72,side:T.DoubleSide}),
    sail:new T.MeshStandardMaterial({color:0xe0dcc8,roughness:.94,side:T.DoubleSide}),
    cloth:new T.MeshStandardMaterial({color:0x30555c,roughness:1,side:T.DoubleSide}),
    lamp:new T.MeshStandardMaterial({color:0xffe0a0,emissive:0xffc47b,emissiveIntensity:1.4,roughness:.5})
  };
}
export type Materials=Awaited<ReturnType<typeof loadMaterials>>;
