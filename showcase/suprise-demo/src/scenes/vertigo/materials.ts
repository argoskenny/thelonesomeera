import * as THREE from 'three';
import { assetUrl } from '../../shared/assets';
import { makeTexture,noise } from '../../shared/procedural';
export async function loadMaterials(renderer:THREE.WebGLRenderer){
  const loader=new THREE.TextureLoader();
  const load=async(scope:'shared'|'vertigo'|'afterlight',name:string,color=false)=>{
    const t=await loader.loadAsync(assetUrl(scope,name));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;return t;
  };
  const [plaster,concrete,normal,rough,waterNormal,rockColor,rockNormal]=await Promise.all([load('vertigo','plaster-color.png',true),load('shared','concrete-color.jpg',true),load('shared','concrete-normal.jpg'),load('shared','concrete-roughness.jpg'),load('shared','water-normal.jpg'),load('afterlight','rock-color.jpg',true),load('afterlight','rock-normal.jpg')]);
  const standard=(p:THREE.MeshStandardMaterialParameters)=>new THREE.MeshStandardMaterial(p);
  const walls=[0xc8c3af,0xa1aba5,0xab9f8a,0x778780,0xc2b4a2,0x9a7e72,0x7d8a90,0xb1ada0].map(color=>standard({map:plaster,color,normalMap:normal,normalScale:new THREE.Vector2(.7,.7),bumpMap:plaster,bumpScale:.047,roughness:.92,roughnessMap:rough}));
  for(const wall of walls){wall.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>", "vec3 baseTint=diffuseColor.rgb;\n#include <map_fragment>\nfloat weatherDistance=smoothstep(12.,110.,length(vViewPosition));diffuseColor.rgb=mix(diffuseColor.rgb,baseTint*vec3(.46,.45,.42),weatherDistance*.48);");};}
  const rustTexture=makeTexture(512,(x,y)=>{
    const n=noise(x/55,y/72),s=noise(x/9,y/14),grain=noise(x*.6,y*.6),rust=n>.43;
    return rust?[56+n*91+s*14,35+n*26+s*11,23+n*13+grain*10]:[53+grain*21,61+grain*22,61+grain*21];
  });
  const timberTexture=makeTexture(512,(x,y)=>{const n=noise(x/3,y/75),fine=noise(x/1.3,y/60),g=noise(x/37,y/270);return [43+n*12+fine*8+g*8,36+n*10+fine*6,27+n*7+fine*5];});
  const concreteMat=standard({map:plaster,color:0xb6ae97,bumpMap:plaster,bumpScale:.028,normalMap:normal,normalScale:new THREE.Vector2(.8,.8),roughness:.88});
  const rust=standard({map:rustTexture,color:0x9c9388,metalness:.63,roughness:.70,bumpMap:rustTexture,bumpScale:.022});
  const iron=standard({color:0x333b39,map:rustTexture,metalness:.76,roughness:.52,bumpMap:rustTexture,bumpScale:.012});
  const wood=standard({map:timberTexture,roughness:.87,bumpMap:timberTexture,bumpScale:.016});
  const paintedMetal=[0x748883,0x9a8274,0x626b72,0xb1ac93].map(color=>standard({color,map:plaster,normalMap:normal,normalScale:new THREE.Vector2(.35,.35),metalness:.4,roughness:.75,side:THREE.DoubleSide}));
  const floor=standard({map:plaster,normalMap:normal,normalScale:new THREE.Vector2(.95,.95),color:0x353b37,roughness:.35,metalness:.15,bumpMap:plaster,bumpScale:.05});
  const teal=standard({map:plaster,color:0x4a7878,bumpMap:plaster,bumpScale:.035,roughness:.90});
  const aluminum=standard({color:0x8b8d7e,metalness:.77,roughness:.42,map:concrete});
  const black=standard({color:0x171e20,roughness:.72}),glass=standard({color:0x283c42,metalness:.45,roughness:.21});
  const room=standard({map:plaster,color:0xcbb48c,roughness:.92,emissive:0xd2823e,emissiveIntensity:.07});
  const litWindows=Array.from({length:5},(_,i)=>standard({color:[0xb39463,0xaa8b62,0x819593,0x947755,0x6d8c92][i],emissive:[0xffb55e,0xffd097,0xb6e5e9,0xeea65a,0xb1d3db][i],emissiveIntensity:[1.1,.7,.3,.45,.25][i],roughness:.8}));
  const bulb=standard({color:0xffddb0,emissive:0xffc276,emissiveIntensity:3.8,roughness:.45});
  const shade=standard({color:0xd6b27c,emissive:0xffac50,emissiveIntensity:.6,roughness:.88,side:THREE.DoubleSide});
  const linen=standard({color:0xb2a88b,map:concrete,roughness:1,side:THREE.DoubleSide});
  const cloth=[0x7c8c8d,0xa8967c,0x7b5750,0x475658,0xb0b1a2].map(color=>standard({color,map:concrete,roughness:1,side:THREE.DoubleSide}));
  const leaf=standard({color:0x46523c,roughness:.8,map:concrete,side:THREE.DoubleSide});
  const pot=standard({color:0x856247,map:concrete,bumpMap:normal,bumpScale:.04,roughness:1});
  rockColor.repeat.set(3,3);rockNormal.repeat.set(3,3);
  const rock=standard({color:0x92999a,map:rockColor,normalMap:rockNormal,normalScale:new THREE.Vector2(1.6,1.6),roughness:.94});
  rock.onBeforeCompile=shader=>{
    shader.vertexShader='varying float vWetHeight;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWetHeight=(modelMatrix*vec4(transformed,1.)).y;');
    shader.fragmentShader='varying float vWetHeight;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=mix(.57,1.,smoothstep(.6,3.8,vWetHeight));');
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.27,roughnessFactor,smoothstep(.4,3.6,vWetHeight));');
  };
  return {walls,concrete:concreteMat,rust,iron,wood,paintedMetal,floor,teal,aluminum,black,glass,room,litWindows,bulb,shade,linen,cloth,leaf,pot,rock,waterNormal};
}
export type CityMaterials=Awaited<ReturnType<typeof loadMaterials>>;
