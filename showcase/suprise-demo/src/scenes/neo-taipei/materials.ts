import * as T from 'three';
import { assetUrl } from '../../shared/assets';
export async function loadMaterials(renderer:T.WebGLRenderer){
 const loader=new T.TextureLoader();
 const load=async(scope:Parameters<typeof assetUrl>[0],name:string,color=false)=>{const t=await loader.loadAsync(assetUrl(scope,name));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;return t;};
 const [metal,metalNormal,concrete,concreteNormal,asphalt,asphaltNormal,rough,facade,portrait,sky,blossom,cliff,waterNormal]=await Promise.all([
 load('night-market','metal-color.jpg',true),load('night-market','metal-normal.jpg'),load('shared','concrete-color.jpg',true),load('shared','concrete-normal.jpg'),load('night-market','asphalt-color.jpg',true),load('night-market','asphalt-normal.jpg'),load('night-market','asphalt-roughness.jpg'),load('neo-taipei','facade.jpg',true),load('neo-taipei','portrait.jpg',true),load('neo-taipei','sky.jpg',true),load('neo-taipei','blossom.png',true),load('aurelia','cliff.jpg',true),load('shared','water-normal.jpg')]);
 const s=(p:T.MeshStandardMaterialParameters)=>new T.MeshStandardMaterial(p);
 const steel=s({color:0x818c92,map:metal,normalMap:metalNormal,normalScale:new T.Vector2(.18,.18),roughness:.32,metalness:.85});
 const iron=s({color:0x232e37,map:metal,normalMap:metalNormal,normalScale:new T.Vector2(.35,.35),roughness:.4,metalness:.72});
 const rust=s({color:0x654c40,map:metal,normalMap:metalNormal,roughness:.63,metalness:.65});
 const concreteMat=s({color:0x626e78,map:concrete,normalMap:concreteNormal,roughness:.82});
 const road=s({color:0x414d5a,map:asphalt,normalMap:asphaltNormal,normalScale:new T.Vector2(.55,.55),roughnessMap:rough,roughness:.56,metalness:.18});
 const floor=s({color:0x556168,map:metal,normalMap:asphaltNormal,normalScale:new T.Vector2(.32,.32),roughness:.26,metalness:.65});
 const window=s({map:facade,emissiveMap:facade,emissive:0xffffff,emissiveIntensity:1.05,roughness:.38,metalness:.35});
 const windows=Array.from({length:6},(_,i)=>{const map=facade.clone();map.offset.set((i%3)*.17,(i%2)*.21);const mat=window.clone();mat.map=mat.emissiveMap=map;mat.color.set([0x778fa3,0xa3bdc9,0x9aa2b6,0xb8aaa2,0x6a95ae,0x96acb5][i]);mat.emissive.set([0x739bb8,0xb6c6c7,0x998bcb,0xdab39b,0x6aa3bb,0xb5c4ce][i]);mat.emissiveIntensity=.65+i*.12;return mat;});
 const rock=s({map:cliff,color:0xc7ced0,bumpMap:cliff,bumpScale:.45,roughness:.94});
 const moss=s({map:concrete,color:0x233a35,roughness:1});
 const cyan=s({color:0x84ecff,emissive:0x21c9ff,emissiveIntensity:4,roughness:.22});
 const pink=s({color:0xff7de6,emissive:0xff20cb,emissiveIntensity:4.5,roughness:.22});
 const amber=s({color:0xffd7a2,emissive:0xff8834,emissiveIntensity:3.5,roughness:.25});
 const warm=s({color:0x967750,emissive:0xffa347,emissiveIntensity:.75,roughness:.6});
 const wood=s({map:concrete,color:0x594030,roughness:.7});
 const porcelain=s({color:0xb9c1bd,roughness:.19});
 const glass=new T.MeshPhysicalMaterial({color:0x223c4a,roughness:.12,metalness:.5,transparent:true,opacity:.35,depthWrite:false,side:T.DoubleSide});
 const flowers=s({map:blossom,alphaTest:.3,side:T.DoubleSide,roughness:.68,emissive:0x8c1746,emissiveIntensity:.5});
 const all=[steel,iron,rust,concreteMat,road,floor,rock,moss,wood];
 // A compact, static neon irradiance field adds colored bounce without dozens of per-pixel lights.
 const sources=[[-38,65,61,32,0xff245d],[-40,64,75,20,0xffa245],[-30,60,60,22,0x286fff],[-48,103,-44,90,0x8049ff],[125,90,-115,90,0xe52bdf],[135,240,-300,170,0x8739ff],[20,73,-8,75,0x139fff],[160,65,-80,50,0xff3d99]];
 for(const m of all){m.onBeforeCompile=shader=>{shader.uniforms.bouncePosition={value:sources.map(a=>new T.Vector4(a[0],a[1],a[2],a[3]))};shader.uniforms.bounceColor={value:sources.map(a=>new T.Color(a[4]).multiplyScalar(.6))};shader.vertexShader='varying vec3 bounceWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nbounceWorld=(modelMatrix*vec4(transformed,1.)).xyz;');shader.fragmentShader='varying vec3 bounceWorld; uniform vec4 bouncePosition[8]; uniform vec3 bounceColor[8];\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfor(int i=0;i<8;i++){float a=max(0.,1.-distance(bounceWorld,bouncePosition[i].xyz)/bouncePosition[i].w);totalEmissiveRadiance+=bounceColor[i]*a*a*.055;}');};m.customProgramCacheKey=()=> 'neo-bounce-v1';}
 return {steel,iron,rust,concrete:concreteMat,road,floor,window,windows,rock,moss,cyan,pink,amber,warm,wood,porcelain,glass,flowers,portrait,sky,waterNormal,asphaltNormal};
}
export type Materials=Awaited<ReturnType<typeof loadMaterials>>;
