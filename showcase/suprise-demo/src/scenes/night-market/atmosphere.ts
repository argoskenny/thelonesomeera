import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GeometryBatch,seededRandom,vec } from './geometry';
import { signMaterial,smokeTexture,type NightMaterials } from './materials';
import { metricUV } from '../../shared/procedural';
export function createGate(b:GeometryBatch,m:NightMaterials,z:number,signMats:THREE.MeshStandardMaterial[]){
  for(const x of[-3.8,3.8]){
    b.cylinder(.28,.32,7.2,x,3.6,z,m.gateRed,24);b.cylinder(.43,.47,.45,x,.25,z,m.concrete,20);
    b.cylinder(.37,.37,.13,x,6.33,z,m.gold,24);
  }
  b.box(8.2,1.17,.58,0,6.25,z,m.gateRed,.045);
  const gate=signMaterial({text:'島嶼觀光夜市',bg:'#d6b57a',ink:'#4d0d09',sub:'TAIWAN NIGHT MARKET',glow:.7});signMats.push(gate);
  b.plane(6.1,.98,0,6.3,z+.31,gate);b.plane(6.1,.98,0,6.3,z-.31,gate,Math.PI);
  for(const level of[0,1]){
    const w=level?7.6:10.2,d=level?2.1:3.1,y=level?8.15:7.0;
    const g=new THREE.PlaneGeometry(w,d,60,20);const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),zz=p.getY(i),h=y+(1-Math.abs(zz)/(d/2))*.8+Math.pow(Math.abs(x)/(w/2),6)*.51+Math.pow(Math.abs(zz)/(d/2),9)*.14;
      p.setXYZ(i,x,h,z+zz);
    }g.computeVertexNormals();metricUV(g,.4);b.add(g,m.roof);
    for(const side of[-1,1]){
      const points:THREE.Vector3[]=[];
      for(let i=0;i<=40;i++){const x=-w/2+w*i/40,yy=y+Math.pow(Math.abs(x)/(w/2),6)*.51+.14;points.push(vec(x,yy,z+side*d/2));}
      b.tube(points,.049,m.gold,60);
      for(let i=0;i<66;i++){const x=-w/2+w*i/65,yy=y+Math.pow(Math.abs(x)/(w/2),6)*.51+.11;b.sphere(.027,x,yy,z+side*(d/2+.065),m.warmBulb);}
      for(const x of[-w/2,w/2])b.tube([vec(x,y+.55,z+side*d/2),vec(x*1.03,y+.76,z+side*d*.52),vec(x*1.05,y+1.06,z+side*d*.54)],.043,m.gold,12);
    }
    b.tube([vec(-w*.46,y+.97,z),vec(0,y+.81,z),vec(w*.46,y+.97,z)],.095,m.gold,40);
    for(let x=-w/2+.08;x<w/2;x+=.18){
      const points=[];for(let j=0;j<=10;j++){const zz=-d/2+d*j/10;points.push(vec(x,y+(1-Math.abs(zz)/(d/2))*.8+Math.pow(Math.abs(x)/(w/2),6)*.51+.035,z+zz));}b.tube(points,.025,m.gold,12);
    }
  }
  for(let i=0;i<9;i++){
    const x=-3.25+i*.81;b.sphere(.22,x,5.22,z,m.lantern,vec(1,1.2,1));b.cylinder(.009,.009,.44,x,5.65,z,m.black,6);b.cylinder(.05,.075,.15,x,4.88,z,m.gateRed,10);
  }
}
export function createWetRoad(scene:THREE.Scene,m:NightMaterials,mobile:boolean){
  const wet=new Reflector(new THREE.PlaneGeometry(144,126),{textureWidth:mobile?512:1024,textureHeight:mobile?512:1024,color:0x777777,multisample:0,
    shader:{name:'Wet asphalt reflections',uniforms:{tDiffuse:{value:null},color:{value:new THREE.Color()},textureMatrix:{value:new THREE.Matrix4()},uNormal:{value:m.asphaltNormal},uTime:{value:0},uWet:{value:1}},
    vertexShader:`uniform mat4 textureMatrix;varying vec4 vReflection;varying vec3 vWorld;void main(){vReflection=textureMatrix*vec4(position,1.);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform sampler2D uNormal;uniform float uTime;uniform float uWet;varying vec4 vReflection;varying vec3 vWorld;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      void main(){vec2 n=texture2D(uNormal,vWorld.xz*.85).xy-.5;vec2 fine=texture2D(uNormal,vWorld.xz*3.7).xy-.5;vec2 uv=vReflection.xy/vReflection.w+n*.006+fine*.0015;
        float wetness=smoothstep(.34,.66,noise(vWorld.xz*1.15)*.55+noise(vWorld.xz*4.3)*.45);
        float blur=.0004+(1.-wetness)*.0018;
        vec3 reflection=texture2D(tDiffuse,uv).rgb*.4;
        reflection+=(texture2D(tDiffuse,uv+vec2(blur,0.)).rgb+texture2D(tDiffuse,uv-vec2(blur,0.)).rgb+texture2D(tDiffuse,uv+vec2(0.,blur)).rgb+texture2D(tDiffuse,uv-vec2(0.,blur)).rgb)*.15;
        float fresnel=1.-clamp(normalize(cameraPosition-vWorld).y,0.,1.);
        gl_FragColor=vec4(reflection*.80,(.10+wetness*.6)*(.65+fresnel*.35)*uWet);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}}) as Reflector & {material:THREE.ShaderMaterial};
  wet.rotation.x=-Math.PI/2;wet.position.set(0,.007,0);wet.material.transparent=true;wet.material.depthWrite=false;wet.renderOrder=3;scene.add(wet);return wet;
}
export function createSteam(scene:THREE.Scene,sources:THREE.Vector3[],mobile:boolean){
  const rand=seededRandom(900),count=sources.length*(mobile?12:22),p=new Float32Array(count*3),colors=new Float32Array(count*3),seeds: number[]=[];
  for(let i=0;i<count;i++){seeds.push(rand());const c=new THREE.Color(i%3?0xd8b78d:0x83b9c5);c.toArray(colors,i*3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const mat=new THREE.PointsMaterial({map:smokeTexture(),size:1.25,transparent:true,opacity:.14,depthWrite:false,vertexColors:true,blending:THREE.NormalBlending});
  const steam=new THREE.Points(g,mat);steam.frustumCulled=false;steam.renderOrder=4;scene.add(steam);
  return {material:mat,update:(time:number)=>{
    for(let i=0;i<count;i++){const s=sources[i%sources.length],t=(seeds[i]+time*.075)%1,r=t*.4;
      p[i*3]=s.x+Math.sin(time*.43+i*2.6)*r;p[i*3+1]=s.y+t*2.7;p[i*3+2]=s.z+Math.cos(time*.27+i)*r;
    }g.attributes.position.needsUpdate=true;
  }};
}
