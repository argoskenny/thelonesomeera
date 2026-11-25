import * as THREE from 'three';
import { seededRandom } from '../../shared/geometry';
import { waveHeight } from './waves';
import type { Shoreline } from './shoreline';

export function createSurf(scene:THREE.Scene,shore:Shoreline,mobile:boolean){
  const count=mobile?1600:4600,rand=seededRandom(45392),positions=new Float32Array(count*3),opacity=new Float32Array(count),sizes=new Float32Array(count),kind=new Float32Array(count),seeds=new Float32Array(count);
  const origin=new Float32Array(count*3),velocity=new Float32Array(count*3),birth=new Float32Array(count),life=new Float32Array(count);
  positions.fill(-2000);birth.fill(-100);for(let i=0;i<count;i++)seeds[i]=rand();
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('aOpacity',new THREE.BufferAttribute(opacity,1).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('aKind',new THREE.BufferAttribute(kind,1).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,fog:true,
    uniforms:{...THREE.UniformsLib.fog,uPixelScale:{value:600},uTint:{value:new THREE.Color(.69,.77,.79)}},
    vertexShader:`#include <fog_pars_vertex>
      attribute float aOpacity,aSize,aKind,aSeed;uniform float uPixelScale;varying float vOpacity,vKind,vSeed;
      void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;gl_PointSize=clamp(aSize*uPixelScale/max(.4,-mvPosition.z),1.,90.);vOpacity=aOpacity;vKind=aKind;vSeed=aSeed;
      #include <fog_vertex>
      }`,
    fragmentShader:`#include <fog_pars_fragment>
      uniform vec3 uTint;varying float vOpacity,vKind,vSeed;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){if(vOpacity<.005)discard;vec2 p=gl_PointCoord-.5;float a;
        if(vKind<.5){p.x*=1.9;a=(1.-smoothstep(.12,.49,length(p)))*vOpacity;}
        else {float n=noise(p*12.+vSeed*42.)*.62+noise(p*27.-vSeed*28.)*.38;a=(1.-smoothstep(.12,.5,length(p)))*smoothstep(.20,.73,n)*vOpacity;}
        if(a<.012)discard;gl_FragColor=vec4(uTint,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`});
  const spray=new THREE.Points(geometry,material);spray.frustumCulled=false;spray.renderOrder=2;
  const viewport=new THREE.Vector4();spray.onBeforeRender=(renderer,_scene,camera)=>{renderer.getCurrentViewport(viewport);material.uniforms.uPixelScale.value=viewport.w*.5*camera.projectionMatrix.elements[5];};
  const group=new THREE.Group();group.name='wave-impact-spray';group.add(spray);scene.add(group);
  // A short-lived curved sheet forms the bulk of each impact; droplets peel away from it.
  const fanCount=mobile?40:80,fanGeometry=new THREE.InstancedBufferGeometry(),fanPlane=new THREE.PlaneGeometry(1,1,12,14);
  fanGeometry.index=fanPlane.index;fanGeometry.attributes.position=fanPlane.attributes.position;fanGeometry.attributes.uv=fanPlane.attributes.uv;fanGeometry.instanceCount=fanCount;
  const fanOrigins=new Float32Array(fanCount*3),fanDirections=new Float32Array(fanCount*2),fanTiming=new Float32Array(fanCount*2);for(let i=0;i<fanCount;i++)fanTiming[i*2]=-100;
  fanGeometry.setAttribute('aOrigin',new THREE.InstancedBufferAttribute(fanOrigins,3).setUsage(THREE.DynamicDrawUsage));fanGeometry.setAttribute('aDirection',new THREE.InstancedBufferAttribute(fanDirections,2).setUsage(THREE.DynamicDrawUsage));fanGeometry.setAttribute('aTiming',new THREE.InstancedBufferAttribute(fanTiming,2).setUsage(THREE.DynamicDrawUsage));
  const fanMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,fog:true,uniforms:{...THREE.UniformsLib.fog,uTime:{value:0},uTint:material.uniforms.uTint},
    vertexShader:`#include <fog_pars_vertex>
    attribute vec3 aOrigin;attribute vec2 aDirection,aTiming;uniform float uTime;varying vec2 vUv;varying float vAge,vSeed;
    void main(){float age=uTime-aTiming.x,energy=aTiming.y;vUv=uv;vAge=age;vSeed=aTiming.x;
      vec3 tangent=vec3(-aDirection.y,0.,aDirection.x),outward=vec3(aDirection.x,0.,aDirection.y);
      float height=max(0.,6.8*energy*age-4.905*age*age),v=uv.y,u=uv.x-.5;
      float edge=.87+.13*sin(u*31.+aTiming.x*7.);
      vec3 p=aOrigin+tangent*u*(.7+v*2.9)*(1.+age*.8)+outward*(.25+v*v*age*2.1);
      p.y+=height*v*edge;p+=outward*sin(v*4.+u*7.)*.15*v;
      if(age<0.||age>1.3)p.y=-2000.;vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`,
    fragmentShader:`#include <fog_pars_fragment>
    uniform vec3 uTint;varying vec2 vUv;varying float vAge,vSeed;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){if(vAge<0.||vAge>1.3)discard;float n=noise(vUv*vec2(22.,13.)+vec2(vSeed,-vAge*3.))*.7+noise(vUv*vec2(58.,33.)-vAge*4.)*.3;
      float edge=(1.-smoothstep(.29,.5,abs(vUv.x-.5)))*(1.-smoothstep(.69,1.,vUv.y))*smoothstep(0.,.10,vUv.y);
      float pulse=smoothstep(0.,.12,vAge)*(1.-smoothstep(.45,1.3,vAge));float a=edge*pulse*smoothstep(.22,.66,n)*.55;
      if(a<.012)discard;gl_FragColor=vec4(uTint,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }`});
  const fans=new THREE.Mesh(fanGeometry,fanMaterial);fans.frustumCulled=false;fans.renderOrder=1;group.add(fans);let fanHead=0;
  const sites=shore.sites.map(s=>({...s,lastHeight:waveHeight(s.x,s.z,0),lastHit:-10}));
  let head=0,previousTime=0,impactCount=0,active=0;
  function burst(s:typeof sites[number],time:number,height:number,distance:number){
    const close=distance<65,number=close?(mobile?36:72):(mobile?12:24),energy=.8+rand()*.55;
    for(let j=0;j<number;j++){
      const i=head;head=(head+1)%count;const mist=j%5===0,tangent=(rand()-.5)*2.5,outward=.45+rand()*2.65;
      origin[i*3]=s.x+s.nx*(.20+rand()*.35)-s.nz*(rand()-.5)*1.6;origin[i*3+1]=Math.max(.1,height)+rand()*.2;origin[i*3+2]=s.z+s.nz*(.20+rand()*.35)+s.nx*(rand()-.5)*1.6;
      velocity[i*3]=(s.nx*outward-s.nz*tangent)*energy;velocity[i*3+1]=(mist?2.1+rand()*2.1:3.1+rand()*4.4)*energy;velocity[i*3+2]=(s.nz*outward+s.nx*tangent)*energy;
      birth[i]=time+rand()*.14;life[i]=mist?1.1+rand()*.8:.72+rand()*.85;sizes[i]=mist?.34+rand()*.55:.035+rand()*.095;kind[i]=mist?1:0;
    }
    const fi=fanHead;fanHead=(fanHead+1)%fanCount;fanOrigins.set([s.x+s.nx*.2,Math.max(.1,height),s.z+s.nz*.2],fi*3);fanDirections.set([s.nx,s.nz],fi*2);fanTiming.set([time,energy],fi*2);
    fanGeometry.attributes.aOrigin.needsUpdate=true;fanGeometry.attributes.aDirection.needsUpdate=true;fanGeometry.attributes.aTiming.needsUpdate=true;
    impactCount++;
  }
  return {group,material,get stats(){return {impactSites:sites.length,impacts:impactCount,activeSpray:active};},update(time:number,camera:THREE.Camera){
    fanMaterial.uniforms.uTime.value=time;if(time===previousTime)return;const dt=Math.max(.001,time-previousTime);previousTime=time;
    for(const s of sites){const h=waveHeight(s.x,s.z,time),rising=(h-s.lastHeight)/dt,distance=Math.hypot(camera.position.x-s.x,camera.position.y,camera.position.z-s.z);
      if(h>.32&&s.lastHeight<=.32&&rising>.5&&time-s.lastHit>1.9&&distance<(mobile?115:180)){burst(s,time,h,distance);s.lastHit=time;}s.lastHeight=h;}
    active=0;
    for(let i=0;i<count;i++){
      const age=time-birth[i],fraction=age/life[i];if(age<0||fraction>=1||!life[i]){opacity[i]=0;continue;}
      const mist=kind[i]>.5,drag=mist?(1-Math.exp(-age*1.35))/1.35:age;
      positions[i*3]=origin[i*3]+velocity[i*3]*drag+age*age*.13;
      positions[i*3+1]=origin[i*3+1]+velocity[i*3+1]*drag-(mist?1.5:4.905)*age*age;
      positions[i*3+2]=origin[i*3+2]+velocity[i*3+2]*drag;
      opacity[i]=(mist?.28:.78)*Math.min(1,age*16)*Math.pow(1-fraction,mist?1.3:.55);active++;
    }
    for(const attribute of['position','aOpacity','aSize','aKind'])geometry.attributes[attribute].needsUpdate=true;
  }};
}
