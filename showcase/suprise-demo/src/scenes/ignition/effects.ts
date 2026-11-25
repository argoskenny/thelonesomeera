import * as T from 'three';
import { seededRandom } from '../../shared/geometry';
import type { LaunchSequence } from './launch';
const noiseGLSL=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise(p)*.55+noise(p*2.03)*.28+noise(p*4.1)*.12+noise(p*8.0)*.05;}
`;
export function createEffects(scene:T.Scene,rocket:T.Group,mobile:boolean){
  const smokeUniforms={uTime:{value:0},uAge:{value:-1},uPower:{value:0},uAltitude:{value:0}};
  function smoke(count:number,vent:boolean){
    const source=new T.PlaneGeometry(1,1),g=new T.InstancedBufferGeometry();g.index=source.index;g.attributes=source.attributes;
    const rnd=seededRandom(vent?32:90),seed=[];for(let i=0;i<count;i++)seed.push(rnd(),rnd(),rnd(),rnd());g.setAttribute('seed',new T.InstancedBufferAttribute(new Float32Array(seed),4));g.instanceCount=count;
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:smokeUniforms,vertexShader:`attribute vec4 seed;uniform float uTime,uAge,uAltitude;varying vec2 vUv;varying float vFade,vSeed,vHeight;
    void main(){vUv=uv;vSeed=seed.w*90.;float period=${vent?'8.':'13.'};float clock=${vent?'uTime':'max(0.,uAge)'};float delay=seed.x*period;float age=mod(clock+delay,period);float t=age/period;float a=seed.y*6.2831;vec3 center;float size;
    ${vent?`center=vec3(-5.+cos(a)*age*.7,16.+age*1.2,2.+sin(a)*age*.6);size=1.4+age*.8;vFade=sin(t*3.14159)*.2;`:`center=vec3(cos(a)*age*(2.2+seed.z*2.5),2.+age*(.9+seed.y*.5),sin(a)*age*(2.1+seed.w*2.0));size=5.+age*2.0;vFade=sin(t*3.14159)*.5*step(age,clock)*step(0.,uAge)*(1.-smoothstep(300.,900.,uAltitude));`}
    vHeight=center.y;vec4 p=modelViewMatrix*vec4(center,1.);p.xy+=position.xy*size;gl_Position=projectionMatrix*p;}`,
      fragmentShader:`uniform float uTime,uPower;varying vec2 vUv;varying float vFade,vSeed,vHeight;${noiseGLSL}
      void main(){vec2 p=vUv-.5;float cloud=fbm(vec3(p*5.,vSeed+uTime*.08));float d=length(p);float density=smoothstep(.52,.1,d+(.5-cloud)*.28);float alpha=density*vFade;if(alpha<.006)discard;vec3 shade=mix(vec3(.22,.26,.30),vec3(.73,.72,.67),cloud+vUv.y*.22);shade+=vec3(.55,.18,.035)*uPower*exp(-vHeight*.15)*density;gl_FragColor=vec4(shade,alpha);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
    const mesh=new T.Mesh(g,material);mesh.frustumCulled=false;mesh.renderOrder=3;scene.add(mesh);return mesh;
  }
  const vent=smoke(mobile?45:85,true),clouds=smoke(mobile?210:480,false);
  const points=[];for(let i=0;i<=45;i++){const t=i/45;points.push(new T.Vector2((1-t)*4.6+Math.sin(t*Math.PI)*2.2,-t*46));}
  const flameMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:smokeUniforms,
    vertexShader:'varying vec3 vP;varying vec2 vUv;void main(){vP=position;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uTime,uPower;varying vec3 vP;varying vec2 vUv;${noiseGLSL}void main(){float t=-vP.y/46.;float n=fbm(vec3(vUv.x*18.,t*12.-uTime*6.,uTime*.7));float shock=pow(.5+.5*sin(t*56.-uTime*4.),7.)*(1.-t);vec3 color=mix(vec3(2.3,1.8,1.2),vec3(2.,.40,.035),smoothstep(.03,.48,t));color+=shock*vec3(.7,.9,1.4);float alpha=(1.-t)*smoothstep(.1,.65,n)*uPower;gl_FragColor=vec4(color,alpha);}`});
  const flame=new T.Mesh(new T.LatheGeometry(points,48),flameMaterial);flame.position.y=-1.4;rocket.add(flame);flame.visible=false;
  const core=new T.Mesh(new T.ConeGeometry(3.5,22,40,1,true),flameMaterial);core.rotation.z=Math.PI;core.position.y=-11;flame.add(core);
  const glow=new T.PointLight(0xff8e31,0,170,2);glow.position.set(0,8,0);scene.add(glow);
  return {clouds,vent,update(time:number,launch:LaunchSequence){smokeUniforms.uTime.value=time;smokeUniforms.uAge.value=launch.phase==='standby'||launch.phase==='countdown'?-1:launch.elapsed-10;smokeUniforms.uAltitude.value=launch.altitude;smokeUniforms.uPower.value=launch.throttle;flame.visible=launch.throttle>0;flame.scale.y=.2+launch.throttle*.8;glow.position.y=10+launch.altitude;glow.intensity=launch.throttle*(17000+Math.sin(time*39)*900);vent.visible=launch.altitude<25;}};
}
