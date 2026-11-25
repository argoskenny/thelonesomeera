import * as T from 'three';
import { Water } from 'three/addons/objects/Water.js';

const shoreGLSL=`float shoreX(float z){return -60.-.00135*(z-80.)*(z-80.);}`;
const waves=`
uniform float swellTime;${shoreGLSL}
float heightAt(vec2 p){
 float d=shoreX(p.y)-p.x;
 float coast=1.-smoothstep(65.,150.,d),fade=smoothstep(-3.,7.,d);
 float swell=sin(d*.24+swellTime*1.35+sin(p.y*.018)*.6+sin(p.y*.08)*.22+sin(p.y*.2)*.12)*.48+sin(dot(p,vec2(.15,.21))-swellTime*1.17)*.21+sin(dot(p,vec2(-.36,.29))-swellTime*1.7)*.09;
 float breaker=pow(max(0.,sin(d*.245+swellTime*1.35+sin(p.y*.018)*.6+sin(p.y*.08)*.22+sin(p.y*.2)*.12)),5.)*1.1;
 return (swell+breaker*coast)*fade;
}
`;
export function createSea(scene:T.Scene,normal:T.Texture,mobile:boolean){
  const g=new T.PlaneGeometry(2,2,mobile?160:260,mobile?220:360),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const u=(p.getX(i)+1)/2,v=(1-p.getY(i))/2,z=-1600+v*2450,d=-9+Math.pow(u,1.8)*2400;p.setXYZ(i,(-60-.00135*(z-80)**2)-d,-z,0);}
  const indices=g.index!;for(let i=0;i<indices.count;i+=3){const b=indices.getX(i+1);indices.setX(i+1,indices.getX(i+2));indices.setX(i+2,b);}g.computeVertexNormals();g.computeBoundingSphere();
  const sea=new Water(g,{textureWidth:mobile?256:512,textureHeight:mobile?256:512,waterNormals:normal,sunDirection:new T.Vector3(-150,240,100).normalize(),sunColor:0xfff3d5,waterColor:0x087594,distortionScale:2.8,alpha:1,fog:true});
  sea.rotation.x=-Math.PI/2;sea.position.y=.16;sea.material.uniforms.size.value=2.7;
  Object.assign(sea.material.uniforms,{swellTime:{value:0},lightMood:{value:0}});
  sea.material.vertexShader=sea.material.vertexShader.replace('void main() {',`${waves}\nvarying vec3 swellNormal;varying float swellHeight;\nvoid main() {`)
  .replace(`mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );`,
  `vec4 base=modelMatrix*vec4(position,1.);float h=heightAt(base.xz);swellHeight=h;
   swellNormal=normalize(vec3(heightAt(base.xz-vec2(.2,0.))-heightAt(base.xz+vec2(.2,0.)),.4,heightAt(base.xz-vec2(0.,.2))-heightAt(base.xz+vec2(0.,.2))));
   worldPosition=base+vec4(0.,h,0.,0.);mirrorCoord=textureMatrix*worldPosition;vec4 mvPosition=viewMatrix*worldPosition;`);
  sea.material.fragmentShader=sea.material.fragmentShader.replace('void main() {',`
   uniform float swellTime,lightMood;varying vec3 swellNormal;varying float swellHeight;${shoreGLSL}
   float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float fn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hsh(i),hsh(i+vec2(1.,0.)),f.x),mix(hsh(i+vec2(0.,1.)),hsh(i+1.),f.x),f.y);}
   void main() {`)
  .replace('vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );','vec3 surfaceNormal=normalize(swellNormal+vec3(noise.x*.55,0.,noise.y*.55));')
  .replace('float rf0 = 0.3;','float rf0 = 0.035;')
  .replace('vec3 outgoingLight = albedo;',`
   float d=shoreX(worldPosition.z)-worldPosition.x;
   if(d< -7.)discard;
   vec2 p=worldPosition.xz;
   vec2 warp=vec2(fn(p*.13+swellTime*.06),fn(p*.18-swellTime*.07));
   float pattern=fn(p*.48+warp*3.-swellTime*.12)*.65+fn(p*1.6+warp*2.+swellTime*.13)*.35;
   float grain=fn(p*9.+warp*5.-swellTime*.32);
   float phase=d*.245+swellTime*1.35+sin(p.y*.018)*.6+sin(p.y*.08)*.22+sin(p.y*.2)*.12;
   float crest=smoothstep(.62,.98,sin(phase))*(1.-smoothstep(35.,85.,d));
   float trail=smoothstep(-.35,.8,sin(phase-.9))*.32*(1.-smoothstep(30.,65.,d));
   float wash=(1.-smoothstep(2.,12.,d+sin(swellTime*1.1)*2.))*.85;
   float lace=smoothstep(.27,.64,pattern)*(.5+.5*smoothstep(.15,.7,grain));
   float foam=clamp((crest+trail+wash)*lace,0.,.96);
   float cap=smoothstep(.45,.72,swellHeight)*smoothstep(.56,.74,pattern)*.35;
   foam=max(foam,cap);
   float shallow=1.-smoothstep(4.,95.,d);
   vec3 tint=mix(vec3(.002,.105,.28),vec3(.006,.42,.46),shallow);
   vec3 water=mix(albedo,tint,.70+shallow*.08)+specularLight*.12;
   vec3 outgoingLight=mix(water,vec3(.88,.93,.86)*(1.-lightMood*.13),foam);
  `);
  scene.add(sea);
  // Fine wind-blown spray above breaker crests, kept spatially attached to the shoreline.
  const count=mobile?500:1200,positions=new Float32Array(count*3),seeds=new Float32Array(count*4);
  let seed=27;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<count;i++){const z=-650+rand()*860;seeds.set([z,rand(),rand(),rand()],i*4);}
  const particles=new T.BufferGeometry();particles.setAttribute('position',new T.BufferAttribute(positions,3));
  const spray=new T.Points(particles,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{viewport:{value:innerHeight}},vertexShader:'uniform float viewport;varying float alpha;void main(){vec4 p=modelViewMatrix*vec4(position,1.);alpha=clamp(position.y*.25,0.,.55);gl_PointSize=clamp(viewport*.022/-p.z,1.,6.);gl_Position=projectionMatrix*p;}',fragmentShader:'varying float alpha;void main(){float r=length(gl_PointCoord-.5);float a=(1.-smoothstep(.1,.5,r))*alpha;if(a<.01)discard;gl_FragColor=vec4(.92,.97,1.,a);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'.replace(';#include',';\n#include')}));spray.frustumCulled=false;scene.add(spray);
  return {sea,spray,update(t:number,mood:number){sea.material.uniforms.time.value=t*.42;sea.material.uniforms.swellTime.value=t;sea.material.uniforms.lightMood.value=mood;
    for(let i=0;i<count;i++){const z=seeds[i*4],phase=(t*.32+seeds[i*4+1])%1,life=phase*2.4;const d=9+seeds[i*4+2]*28;positions[i*3]=-60-.00135*(z-80)**2-d+life*.9;positions[i*3+1]=Math.max(-1,.8+Math.sin(life*Math.PI/2.4)*(1.1+seeds[i*4+3]*.8));positions[i*3+2]=z+life*.8;}particles.attributes.position.needsUpdate=true;(spray.material as T.ShaderMaterial).uniforms.viewport.value=innerHeight;
  }};
}
