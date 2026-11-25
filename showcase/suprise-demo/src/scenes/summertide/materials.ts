import * as T from 'three';
import { assetUrl } from '../../shared/assets';
import { makeTexture,noise } from '../../shared/procedural';
export async function loadMaterials(renderer:T.WebGLRenderer){
  const loader=new T.TextureLoader();
  const tex=async(scope:Parameters<typeof assetUrl>[0],file:string,color=false)=>{const t=await loader.loadAsync(assetUrl(scope,file));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;return t;};
  const [concrete,normal,rough,asphalt,asphaltNormal,asphaltRough,rock,rockNormal,leaf,waterNormal,forest,windowMap]=await Promise.all([tex('shared','concrete-color.jpg',true),tex('shared','concrete-normal.jpg'),tex('shared','concrete-roughness.jpg'),tex('night-market','asphalt-color.jpg',true),tex('night-market','asphalt-normal.jpg'),tex('night-market','asphalt-roughness.jpg'),tex('afterlight','rock-color.jpg',true),tex('afterlight','rock-normal.jpg'),tex('aerie','leaf.png',true),tex('shared','water-normal.jpg'),tex('summertide','forest.jpg',true),tex('summertide','window.jpg',true)]);
  const sand=makeTexture(512,(x,y)=>{const n=noise(x*.6,y*.6)*15+noise(x*.03,y*.03)*16;return[177+n,162+n,132+n];});
  const green=makeTexture(512,(x,y)=>{const n=noise(x*.017,y*.017)*.6+noise(x*.15,y*.15)*.3+noise(x,y)*.1;return[39+n*42,50+n*52,24+n*20];});
  const roofMap=makeTexture(512,(x,y)=>{const ridge=Math.pow(Math.cos(x/512*Math.PI*32),8)*28,wear=noise(x*.1,y*.1)*24+noise(x*.012,y*.012)*30;return[150+wear+ridge,150+wear+ridge,150+wear+ridge];});
  const plaster=makeTexture(512,(x,y)=>{const n=noise(x*.05,y*.05)*14+noise(x*.7,y*.7)*7;return[212+n,210+n,201+n];});
  const paint=makeTexture(256,(x,y)=>{const n=noise(x*.7,y*.7);return n>.79?[100,100,100]:[215+n*30,215+n*30,215+n*30];});
  const mat=(color:number,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
  const concreteMat=new T.MeshStandardMaterial({map:concrete,normalMap:normal,normalScale:new T.Vector2(.45,.45),roughnessMap:rough,color:0xd4d0bd,roughness:.9});
  const walls=[0xd9ddd7,0x8bbec4,0xe1c990,0xe9dfc6,0x8da9b7,0xb2c7b1,0xd3a597].map(color=>new T.MeshStandardMaterial({map:plaster,color,normalMap:normal,normalScale:new T.Vector2(.18,.18),roughness:.9}));
  
  function terrainMaterial(map:T.Texture,scale:number){
    const material=new T.MeshStandardMaterial({map,roughness:1});
    material.onBeforeCompile=shader=>{
      shader.uniforms.terrainRock={value:rock};
      shader.vertexShader='varying vec3 terrainP,terrainN;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n terrainP=(modelMatrix*vec4(transformed,1.)).xyz;terrainN=normalize(mat3(modelMatrix)*objectNormal);');
      shader.fragmentShader='uniform sampler2D terrainRock;varying vec3 terrainP,terrainN;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec3 weights=pow(abs(terrainN),vec3(4.));weights/=max(.0001,weights.x+weights.y+weights.z);
        vec3 cliff=texture2D(terrainRock,terrainP.zy*.18).rgb*weights.x+texture2D(terrainRock,terrainP.xz*.18).rgb*weights.y+texture2D(terrainRock,terrainP.xy*.18).rgb*weights.z;
        float steep=1.-smoothstep(.45,.82,terrainN.y);diffuseColor.rgb=mix(diffuseColor.rgb,cliff*.72,steep);`);
    };
    material.customProgramCacheKey=()=>`summer-terrain-${scale}`;return material;
  }
  return {waterNormal,concrete:concreteMat,walls,
    asphalt:new T.MeshStandardMaterial({map:asphalt,normalMap:asphaltNormal,roughnessMap:asphaltRough,color:0xa6a7a2,normalScale:new T.Vector2(.5,.5),roughness:.95}),
    sand:new T.MeshStandardMaterial({map:sand,bumpMap:sand,bumpScale:.035,roughness:1}),
    canopy:new T.MeshStandardMaterial({map:forest,roughness:1,color:0xc2ccae}),forest:terrainMaterial(forest,38),
    green:terrainMaterial(green,12),
    rock:new T.MeshStandardMaterial({map:rock,normalMap:rockNormal,normalScale:new T.Vector2(.7,.7),color:0x777c6b,roughness:.95}),
    yellow:new T.MeshStandardMaterial({map:paint,color:0xe4a62e,roughness:.9}),white:new T.MeshStandardMaterial({map:paint,color:0xe5e1cf,roughness:.86}),
    roofs:[0xa75236,0x286f8b,0x8b4630,0x667c7b,0x26586a,0x9b7453].map(color=>new T.MeshStandardMaterial({map:roofMap,bumpMap:roofMap,bumpScale:.045,color,metalness:.25,roughness:.68,side:T.DoubleSide})),
    metal:new T.MeshStandardMaterial({color:0x87918e,metalness:.8,roughness:.36}),dark:mat(0x252e31),wood:mat(0x695140),rubber:mat(0x242523),
    window:new T.MeshStandardMaterial({map:windowMap,color:0xb5c6c6,roughness:.31,metalness:.18,envMapIntensity:.6}),
    glass:new T.MeshPhysicalMaterial({color:0x456774,metalness:.5,roughness:.16,clearcoat:1,envMapIntensity:1.4}),
    foliage:new T.MeshStandardMaterial({map:leaf,alphaTest:.45,roughness:.8,side:T.DoubleSide,color:0xffffed,emissive:0x3e5a12,emissiveIntensity:.17,emissiveMap:leaf}),
    trunk:mat(0x76654c),palm:new T.MeshStandardMaterial({color:0x4d651f,roughness:.9,side:T.DoubleSide}),
    carPaint:[0xe19f2c,0xe3e7e4,0x427080,0x873f34,0x27373e].map(color=>new T.MeshPhysicalMaterial({color,metalness:.5,roughness:.26,clearcoat:1})),
    lamp:new T.MeshStandardMaterial({color:0xfff2cc,emissive:0xffdeb2,emissiveIntensity:.3}),
  };
}
export type Materials=Awaited<ReturnType<typeof loadMaterials>>;
