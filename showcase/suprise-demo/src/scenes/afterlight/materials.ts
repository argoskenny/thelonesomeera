import * as THREE from 'three';
import { noise, makeTexture, smoothstep } from '../../shared/procedural';
import { assetUrl } from '../../shared/assets';

export async function loadMaterials(renderer: THREE.WebGLRenderer) {
  const loader = new THREE.TextureLoader();
  const load = async (name: string, color = false) => {
    const t = await loader.loadAsync(assetUrl(name.startsWith('concrete-')||name==='water-normal.jpg'?'shared':'afterlight',name));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const [concreteMap, concreteNormal, concreteRough, rockMap, rockNormal, waterNormal, floorMap] = await Promise.all([
    load('concrete-color.jpg', true), load('concrete-normal.jpg'), load('concrete-roughness.jpg'),
    load('rock-color.jpg', true), load('rock-normal.jpg'), load('water-normal.jpg'), load('floor-color.jpg',true),
  ]);
  const concrete = new THREE.MeshStandardMaterial({
    color: 0xd6cec0, map: concreteMap, normalMap: concreteNormal,
    normalScale: new THREE.Vector2(.52, .52), roughnessMap: concreteRough, roughness: .93,
  });
  const stone = new THREE.MeshStandardMaterial({color:0xd6cbb8, map:floorMap, normalMap:rockNormal,normalScale:new THREE.Vector2(.19,.19),roughness:.74});
  const rock = new THREE.MeshStandardMaterial({color:0x9e9b89,map:rockMap,normalMap:rockNormal,normalScale:new THREE.Vector2(1.2,1.2),roughness:.94});
  const patina = makeTexture(512, (x,y) => {
    const n = noise(x/62,y/62)*.52+noise(x/19,y/19)*.3+noise(x/4,y/4)*.18;
    const oxidized = smoothstep(.41,.66,n);
    const fleck=noise(x*.63,y*.63)*.28+.78;
    return [(153-oxidized*89)*fleck,(103-oxidized*8)*fleck,(52+oxidized*29)*fleck];
  });
  const bronze = new THREE.MeshStandardMaterial({color:0xc7ac83,map:patina,normalMap:rockNormal,normalScale:new THREE.Vector2(.16,.16),roughness:.38,metalness:.73,envMapIntensity:1.9});
  const woodMap=makeTexture(512,(x,y)=>{
    const v=noise(x/1.6,y/120)*.3+noise(x/8,y/50)*.5+noise(x/38,y/280)*.2;
    const grain=Math.pow(Math.abs(Math.sin(x*.3+noise(x/33,y/105)*9)),12)*18;
    return [107+v*55-grain,64+v*40-grain*.6,29+v*23-grain*.2];
  });
  const wood=new THREE.MeshStandardMaterial({map:woodMap,roughness:.52,bumpMap:woodMap,bumpScale:.015});
  const dark=new THREE.MeshStandardMaterial({color:0x242521,roughness:.95});
  const soil=new THREE.MeshStandardMaterial({color:0x4d493a,map:rockMap,roughness:1});
  const warmLight=new THREE.MeshBasicMaterial({color:0xffb46a,toneMapped:false});
  return {concrete,stone,rock,bronze,wood,dark,soil,warmLight,waterNormal};
}
export type Materials = Awaited<ReturnType<typeof loadMaterials>>;
