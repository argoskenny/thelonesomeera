import * as T from 'three';
import { seededRandom } from '../../shared/geometry';

const noiseGLSL=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=noise(p)*a;p=mat2(.8,-.6,.6,.8)*p*2.03+17.3;a*=.5;}return n;}`;
export function createAtmosphere(scene:T.Scene,mobile:boolean,panorama:T.Texture){
  const time={value:0},storm={value:0};
  const sky=new T.Mesh(new T.SphereGeometry(1400,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{time,storm,panorama:{value:panorama}},vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
  varying vec3 vDir;uniform sampler2D panorama;uniform float storm;
  void main(){vec3 d=normalize(vDir);vec2 uv=vec2(atan(d.z,d.x)/6.2831853+.75,asin(clamp(d.y,-1.,1.))/3.14159265+.5);vec3 col=texture2D(panorama,uv).rgb;float wrap=fract(uv.x);float seam=(1.-smoothstep(0.,.085,min(wrap,1.-wrap)))*.5;col=mix(col,texture2D(panorama,vec2(1.-uv.x,uv.y)).rgb,seam);
  col=mix(col,col*.68+vec3(.045,.06,.08),storm*.55);gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`}));sky.renderOrder=-100;scene.add(sky);
  const random=seededRandom(885);
  const count=mobile?110:190,geo=new T.InstancedBufferGeometry();geo.index=new T.PlaneGeometry(1,1).index;const plane=new T.PlaneGeometry(1,1);geo.setAttribute('position',plane.attributes.position);geo.setAttribute('uv',plane.attributes.uv);
  const centres=new Float32Array(count*3),sizes=new Float32Array(count*2),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*780;centres.set([Math.cos(a)*r,16+random()*31,-130+Math.sin(a)*r],i*3);sizes.set([95+random()*140,30+random()*65],i*2);seeds[i]=random()*100;}
  geo.setAttribute('centre',new T.InstancedBufferAttribute(centres,3));geo.setAttribute('cloudSize',new T.InstancedBufferAttribute(sizes,2));geo.setAttribute('seed',new T.InstancedBufferAttribute(seeds,1));geo.instanceCount=count;
  const cloudMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time,storm},vertexShader:`
  attribute vec3 centre;attribute vec2 cloudSize;attribute float seed;uniform float time,storm;varying vec2 vUv;varying float vSeed;varying float vDistance;
  void main(){vUv=uv;vSeed=seed;vec3 p=centre;p.x+=sin(time*.007+seed)*13.;p.y+=storm*12.;vec4 mv=modelViewMatrix*vec4(p,1.);mv.xy+=position.xy*cloudSize;vDistance=-mv.z;gl_Position=projectionMatrix*mv;}`,fragmentShader:`
  varying vec2 vUv;varying float vSeed,vDistance;uniform float storm;${noiseGLSL}
  void main(){vec2 uv=vUv;float shape=length((uv-.5)*vec2(1.6,2.2));float n=fbm(uv*6.+vSeed);float density=smoothstep(.20,.8,1.-shape+n*.65-.25);float edge=1.-smoothstep(.35,.5,max(abs(uv.x-.5),abs(uv.y-.5)));float alpha=density*edge*.67;if(alpha<.006)discard;
  float light=smoothstep(.2,.8,uv.y+n*.35);vec3 c=mix(vec3(.45,.57,.67),vec3(.99,.97,.90),light);c=mix(c,vec3(.74,.83,.89),smoothstep(120.,800.,vDistance)*.5);gl_FragColor=vec4(c,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  const clouds=new T.Mesh(geo,cloudMaterial);clouds.frustumCulled=false;clouds.renderOrder=2;scene.add(clouds);
  return {sky,clouds,update(t:number,mood:number,camera:T.Camera){time.value=t;storm.value=mood;sky.position.copy(camera.position);}};
}
