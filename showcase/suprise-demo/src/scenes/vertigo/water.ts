import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { waveGLSL } from './waves';
import { createShoreline,type ShoreRock } from './shoreline';
import { createSurf } from './surf';

export function createSea(scene:THREE.Scene,normal:THREE.Texture,mobile:boolean,rocks:ShoreRock[]){
  const shore=createShoreline(rocks);
  // Concentrate vertices around the playable channel; the outer horizon stays inexpensive.
  const geometry=new THREE.PlaneGeometry(2,2,mobile?150:240,mobile?200:320),p=geometry.attributes.position;
  const stretch=(n:number,near:number)=>Math.abs(n)<=.84?n/.84*near:Math.sign(n)*(near+Math.pow((Math.abs(n)-.84)/.16,2)*(1100-near));
  for(let i=0;i<p.count;i++)p.setXY(i,stretch(p.getX(i),110),stretch(p.getY(i),150));geometry.computeBoundingSphere();
  // Retain AFTERLIGHT's real scene reflection and water-normal layers, adding actual swells.
  const sea=new Water(geometry,{textureWidth:mobile?256:512,textureHeight:mobile?256:512,waterNormals:normal,sunDirection:new THREE.Vector3(48,80,50).normalize(),sunColor:0xc4d6e6,waterColor:0x365d61,distortionScale:3.5,alpha:1,fog:true});
  sea.rotation.x=-Math.PI/2;sea.position.set(0,.05,-60);sea.material.uniforms.size.value=3.2;
  Object.assign(sea.material.uniforms,{uSwellTime:{value:0},uShore:{value:shore.texture},uShoreMin:{value:shore.min},uShoreSize:{value:shore.size}});
  sea.material.vertexShader=sea.material.vertexShader.replace('void main() {',`${waveGLSL}\nvarying vec3 vSwellNormal;varying float vSwellHeight;\nvoid main() {`)
    .replace(`mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );`,
    `vec4 baseWorld=modelMatrix*vec4(position,1.);vec3 displacement,swellNormal;swell(baseWorld.xz,displacement,swellNormal);
     float fade=1.-smoothstep(220.,550.,length(baseWorld.xz-vec2(0.,-60.)));
     worldPosition=baseWorld+vec4(displacement*fade,0.);vSwellNormal=normalize(mix(vec3(0.,1.,0.),swellNormal,fade));vSwellHeight=displacement.y*fade;
     mirrorCoord=textureMatrix*worldPosition;vec4 mvPosition=viewMatrix*worldPosition;`);
  sea.material.fragmentShader=sea.material.fragmentShader.replace('void main() {',`
    uniform float uSwellTime;uniform sampler2D uShore;uniform vec2 uShoreMin,uShoreSize;
    varying vec3 vSwellNormal;varying float vSwellHeight;
    float foamHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float foamNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(foamHash(i),foamHash(i+vec2(1.,0.)),f.x),mix(foamHash(i+vec2(0.,1.)),foamHash(i+1.),f.x),f.y);}
    void main() {`)
    .replace('vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );','vec3 surfaceNormal=normalize(vSwellNormal+vec3(noise.x*1.1,0.,noise.y*1.1));')
    .replace('float rf0 = 0.3;','float rf0 = 0.10;')
    .replace('vec3 outgoingLight = albedo;',`
      vec2 shoreUV=(worldPosition.xz-uShoreMin)/uShoreSize;
      float inMap=step(0.,shoreUV.x)*step(shoreUV.x,1.)*step(0.,shoreUV.y)*step(shoreUV.y,1.);
      float shoreDistance=mix(20.,texture2D(uShore,clamp(shoreUV,0.,1.)).r*20.,inMap);
      vec2 foamP=worldPosition.xz;
      float runup=smoothstep(-.65,1.15,vSwellHeight);
      float surge=1.-smoothstep(.45+runup*.7,2.7+runup*2.8,shoreDistance);
      vec2 warp=vec2(foamNoise(foamP*.23+uSwellTime*.08),foamNoise(foamP*.21-uSwellTime*.09));
      float foamPattern=foamNoise(foamP*.85+warp*2.4-vec2(uSwellTime*.24,uSwellTime*.38))*.65+foamNoise(foamP*2.8+warp-uSwellTime*.21)*.35;
      float cells=foamNoise(foamP*12.+warp*5.-uSwellTime*.48)*.65+foamNoise(foamP*31.+warp*7.+uSwellTime*.3)*.35;
      float lace=smoothstep(.32,.64,foamPattern+cells*.13)*(.52+.48*smoothstep(.25,.68,cells));
      float shoreFoam=surge*(.30+.70*runup)*lace;
      float whitecap=smoothstep(.78,1.45,vSwellHeight)*smoothstep(.42,.68,foamPattern)*(.4+.6*cells)*.70;
      float foam=clamp(shoreFoam+whitecap,0.,.94);
      vec3 foamColor=vec3(.64,.72,.72)*(vec3(.35)+sunColor*.65);
      vec3 outgoingLight=mix(albedo,foamColor,foam);
    `);
  scene.add(sea);
  const surf=createSurf(scene,shore,mobile);
  return {sea,surf:surf.group,get stats(){return surf.stats;},update(time:number,camera:THREE.Camera){sea.material.uniforms.time.value=time*.6;sea.material.uniforms.uSwellTime.value=time;surf.material.uniforms.uTint.value.copy(sea.material.uniforms.sunColor.value).multiplyScalar(.67);surf.update(time,camera);}};
}
