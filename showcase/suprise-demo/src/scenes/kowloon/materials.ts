import * as T from 'three';
import { loadMaterials as baseMaterials } from '../vertigo/materials';
import { assetUrl } from '../../shared/assets';
import { makeTexture,noise } from '../../shared/procedural';
export async function loadMaterials(renderer:T.WebGLRenderer){
 const m=await baseMaterials(renderer),loader=new T.TextureLoader();
 const load=async(name:string,repeat=true)=>{const t=await loader.loadAsync(assetUrl('kowloon',name));t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
 const [plaster,tiles,rooms,sign]=await Promise.all([load('plaster.jpg'),load('tiles.jpg'),load('rooms.jpg',false),load('sign.jpg',false)]);
 const metal=await loader.loadAsync(assetUrl('night-market','metal-color.jpg'));metal.colorSpace=T.SRGBColorSpace;metal.wrapS=metal.wrapT=T.RepeatWrapping;metal.anisotropy=8;
 m.walls=m.walls.map((old,i)=>new T.MeshStandardMaterial({map:plaster,color:[0xe6dfc9,0xc1c7b6,0xcbb99d,0x80968c,0xe2c2a5,0xb6a19c,0x9da8a8,0xd2d0bf][i],normalMap:old.normalMap,normalScale:new T.Vector2(.48,.48),bumpMap:plaster,bumpScale:.027,roughness:.91,roughnessMap:old.roughnessMap}));
 m.concrete.map=plaster;m.concrete.bumpMap=plaster;m.concrete.color.set(0xd4ccbc);m.concrete.roughness=.86;m.concrete.normalScale.set(.5,.5);
 m.floor.map=tiles;m.floor.bumpMap=tiles;m.floor.bumpScale=.008;m.floor.color.set(0xc5c6ae);m.floor.normalScale.set(.16,.16);m.floor.roughness=.32;m.floor.metalness=.08;
 m.room.map=plaster;m.room.color.set(0xe5d0a5);m.room.emissiveIntensity=.055;
 m.teal.map=plaster;m.teal.color.set(0x80a99b);m.teal.bumpMap=plaster;
 m.paintedMetal.forEach((p,i)=>{p.map=plaster;p.bumpMap=plaster;p.bumpScale=.014;p.roughness=.63;p.color.set([0x70958c,0xbba48d,0x85949a,0xc4c3ac][i]);});
 const steel=new T.MeshStandardMaterial({map:metal,color:0xaeb3ad,roughness:.3,metalness:.88,normalMap:m.concrete.normalMap,normalScale:new T.Vector2(.06,.06)});
 const red=new T.MeshStandardMaterial({map:plaster,color:0x7d2c22,bumpMap:plaster,bumpScale:.012,roughness:.56,metalness:.42});
 const enamel=new T.MeshStandardMaterial({color:0xdedac7,roughness:.22,metalness:.15});
 const redSeat=new T.MeshStandardMaterial({color:0x8c241c,roughness:.44,map:metal});
 const windowMat=new T.MeshStandardMaterial({map:rooms,emissiveMap:rooms,emissive:0xffffff,emissiveIntensity:2.4,roughness:.69});
 const darkRoom=windowMat.clone();darkRoom.color.set(0x536168);darkRoom.emissiveIntensity=.12;
 const signMat=new T.MeshStandardMaterial({map:sign,bumpMap:sign,bumpScale:.006,roughness:.72,metalness:.1});
 const glass=new T.MeshPhysicalMaterial({color:0xa6bbb6,roughness:.18,metalness:.2,transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide});
 const cool=new T.MeshStandardMaterial({color:0xe1f7f1,emissive:0xa4e1e8,emissiveIntensity:3.2});
 const neon=new T.MeshStandardMaterial({color:0xffbf7a,emissive:0xff4d16,emissiveIntensity:4.4});
 const fabric=makeTexture(256,(x,y)=>{const n=noise(x*.6,y*.7);return[130+n*50,118+n*47,94+n*42];});m.linen.map=fabric;m.linen.color.set(0xb7b29e);
 return{...m,steel,red,enamel,redSeat,windowMat,darkRoom,signMat,windowGlass:glass,cool,neon,tiles,plaster};
}
export type Materials=Awaited<ReturnType<typeof loadMaterials>>;
