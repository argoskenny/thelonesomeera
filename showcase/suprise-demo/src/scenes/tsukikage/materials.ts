import * as T from 'three';
import type { Builder } from './builder';

function paperFibres(){
  const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d')!;
  let seed=37;
  const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle='#f2e9d8';ctx.fillRect(0,0,size,size);
  for(let i=0;i<6600;i++){
    const x=rng()*size,y=rng()*size,a=rng()*6.28,len=.9+rng()*5;
    ctx.beginPath();ctx.strokeStyle=rng()>.4?'rgba(106,88,52,.13)':'rgba(255,255,250,.39)';
    ctx.lineWidth=.35+rng()*.92;ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(a)*len*.4,y+Math.sin(a+.35)*len*.4,x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.stroke();
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(1.8,1.8);return texture;
}

export async function installMaterials(b:Builder,renderer:T.WebGLRenderer){
  const loader=new T.TextureLoader(),anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
  const root=new URL('../assets/tsukikage/',document.baseURI);
  async function texture(url:URL,srgb:boolean,repeat:number){
    const tex=await loader.loadAsync(url.href);tex.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;
    tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(repeat,repeat);
    tex.anisotropy=anisotropy;return tex;
  }
  async function timber(name:string,repeat:number){
    const [map,normalMap,roughnessMap]=await Promise.all(['color','normal','rough'].map((s,i)=>
      texture(new URL(name+'-'+s+'.webp',root),i===0,repeat)));
    return {map,normalMap,roughnessMap};
  }
  const [sugi,hinoki,cherry,stoneMap,stoneNormal]=await Promise.all([
    timber('sugi',.78),timber('hinoki',.57),timber('cherry',.69),
    texture(new URL('../afterlight/rock-color.jpg',root),true,.82),
    texture(new URL('../afterlight/rock-normal.jpg',root),false,.82)
  ]);
  function standard(name:string,p:T.MeshStandardMaterialParameters){b.material(name,new T.MeshStandardMaterial(p));}
  const wood=(name:string,m:typeof sugi,color:number,roughness:number,normal:number,coat:number)=>{
    b.material(name,new T.MeshPhysicalMaterial({...m,color,roughness,normalScale:new T.Vector2(normal,normal),clearcoat:coat,clearcoatRoughness:.25,envMapIntensity:.78}));
  };
  wood('cedar',sugi,0xf8e0bf,.76,.19,.26);
  wood('hinoki',hinoki,0xffe9d2,.77,.19,.20);
  wood('redwood',sugi,0xc7a18a,.77,.16,.30);
  wood('walnut',cherry,0xf2d9bd,.96,.17,.23);
  wood('lacquer',cherry,0xf09c75,.71,.14,.52);
  wood('floor',hinoki,0xf9dcba,.55,.16,.38);
  const paper=paperFibres();
  standard('paper',{color:0xe9d5b5,map:paper,emissive:0xffc487,emissiveIntensity:.068,roughness:.98});
  const backlit=new T.MeshStandardMaterial({color:0xffddb7,map:paper,emissive:0xffc27d,emissiveIntensity:.59,roughness:.96});
  // Washi is translucent. Rooms behind the screen light the paper unevenly
  // at lamp height, across adjacent sliding leaves rather than once per leaf.
  backlit.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 paperPoint;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\npaperPoint=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader='varying vec3 paperPoint;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float aperture=.50+.50*sin(paperPoint.x*1.47+paperPoint.z*.98+.25*sin(paperPoint.z*2.));
      float heightGlow=.46+.55*abs(sin((paperPoint.y-.34)*.71));
      float upper=smoothstep(5.8,8.,paperPoint.y);
      totalEmissiveRadiance*=(.29+aperture*.57+heightGlow*.54)*mix(1.,.36,upper);
    `);
  };
  b.material('paperGlow',backlit);
  standard('lantern',{color:0xffedca,map:paper,emissive:0xffc77b,emissiveIntensity:3.1,roughness:.78});
  standard('goldLight',{color:0xffce77,emissive:0xffbb4d,emissiveIntensity:3.5,roughness:.51});
  standard('plaster',{color:0xd8b996,map:paper,roughness:.96});
  standard('cream',{color:0xfceacd,map:paper,roughness:.85});
  standard('brass',{color:0xb89353,metalness:.83,roughness:.30});
  standard('roof',{color:0x574e43,metalness:.48,roughness:.52});
  standard('dark',{color:0x241e1c,roughness:.58,metalness:.24});
  standard('charcoal',{color:0x3d3733,roughness:.58});
  standard('tatami',{color:0xc7b287,map:paper,roughness:.97});
  standard('stairRunner',{color:0x968a75,map:paper,roughness:.93});
  standard('stone',{map:stoneMap,normalMap:stoneNormal,normalScale:new T.Vector2(.56,.56),color:0xb7ae9c,roughness:.83});
  standard('water',{color:0x292b21,roughness:.15,metalness:.28});
  standard('carpet',{color:0xa14222,map:paper,roughness:.99});
  return {stoneMap,stoneNormal};
}
