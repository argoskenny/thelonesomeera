import * as T from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import type { Materials } from './materials';
import { islands } from './landscape';
import { seededRandom } from '../../shared/geometry';
export function createWater(scene:T.Scene,m:Materials,mobile:boolean){
 const river=new Water(new T.PlaneGeometry(1100,1300),{textureWidth:mobile?256:512,textureHeight:mobile?256:512,waterNormals:m.waterNormal,sunDirection:new T.Vector3(-.2,.8,.4),sunColor:0x94caff,waterColor:0x051c2c,distortionScale:2.5,fog:true});river.rotation.x=-Math.PI/2;river.position.set(0,.08,-200);scene.add(river);
 const wet=new Reflector(new T.PlaneGeometry(32,34),{textureWidth:mobile?512:1024,textureHeight:mobile?512:1024,clipBias:.003,multisample:0});wet.rotation.x=-Math.PI/2;wet.position.set(-36,60.022,74);wet.renderOrder=3;
 const wetMat=wet.material as T.ShaderMaterial;wetMat.transparent=true;wetMat.depthWrite=false;
 wetMat.uniforms.uNormal={value:m.asphaltNormal};wetMat.uniforms.uTime={value:0};
 wetMat.vertexShader=`uniform mat4 textureMatrix;varying vec4 vCoord;varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vCoord=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 wetMat.fragmentShader=`uniform sampler2D tDiffuse;uniform sampler2D uNormal;uniform float uTime;varying vec4 vCoord;varying vec3 vWorld;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec2 n=texture2D(uNormal,vWorld.xz*.7).xy*2.-1.;vec2 uv=vCoord.xy/vCoord.w+n*.003;float wetness=smoothstep(.25,.75,noise(vWorld.xz*.6));vec3 c=texture2D(tDiffuse,uv).rgb*.5;float blur=.0007+wetness*.001; c+=texture2D(tDiffuse,uv+vec2(blur,0)).rgb*.125;c+=texture2D(tDiffuse,uv-vec2(blur,0)).rgb*.125;c+=texture2D(tDiffuse,uv+vec2(0,blur)).rgb*.125;c+=texture2D(tDiffuse,uv-vec2(0,blur)).rgb*.125;
 float fresnel=pow(1.-abs(normalize(cameraPosition-vWorld).y),3.);gl_FragColor=vec4(c,.16+wetness*.4+fresnel*.22);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 scene.add(wet);
 // Water and the wet balcony must not recursively render one another's reflection camera.
 let reflecting=false;for(const surface of[river,wet]){const original=surface.onBeforeRender.bind(surface);surface.onBeforeRender=(...args)=>{if(reflecting||scene.overrideMaterial)return;reflecting=true;const other=surface===river?wet:river,visible=other.visible;other.visible=false;try{original(...args);}finally{other.visible=visible;reflecting=false;}};}
 const falls=new T.Group();scene.add(falls);const time={value:0};
 const mat=new T.ShaderMaterial({uniforms:{time},transparent:true,depthWrite:false,side:T.DoubleSide,vertexShader:`varying vec2 vUv;varying vec3 vWorld;uniform float time;void main(){vUv=uv;vec3 p=position;p.x+=sin(uv.y*32.+time*3.+position.x)*.1;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float time;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){float ribbons=n(vec2(vUv.x*40.,vUv.y*13.-time*1.2));float detail=n(vec2(vUv.x*130.,vUv.y*55.-time*8.));float edges=smoothstep(0.,.08,vUv.x)*smoothstep(1.,.92,vUv.x);float foam=smoothstep(.28,.72,ribbons*.65+detail*.35);vec3 col=mix(vec3(.07,.23,.38),vec3(.55,.8,1.1),foam);float fog=1.-exp(-pow(distance(cameraPosition,vWorld)*.0016,2.));col=mix(col,vec3(.025,.047,.09),fog);gl_FragColor=vec4(col,edges*(.34+foam*.58));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const splashes:{x:number;y:number;z:number;w:number}[]=[];
 for(const [ci,c]of islands.entries())for(let j=0;j<(ci===0?5:3);j++){
 const offset=(j-(ci===0?2:1))*(ci===0?21:15),w=4+(j%3)*3,height=c.y-1.2,p:number[]=[],uv:number[]=[],idx:number[]=[];
 for(let iy=0;iy<=64;iy++)for(let ix=0;ix<=8;ix++){const t=iy/64,u=ix/8,z=c.z+c.rz*(.79+.35*Math.pow(t,.48));p.push(c.x+offset+(u-.5)*w*(.8+t*.5),height*(1-t),z);uv.push(u,t);if(iy&&ix){const k=iy*9+ix;idx.push(k,k-1,k-9,k-1,k-10,k-9);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();falls.add(new T.Mesh(g,mat));splashes.push({x:c.x+offset,y:.3,z:c.z+c.rz*1.14,w});}
 const rand=seededRandom(76),count=mobile?600:1600,positions=new Float32Array(count*3),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));const spray=new T.Points(g,new T.PointsMaterial({color:0x8fbed7,size:.7,transparent:true,opacity:.23,depthWrite:false,blending:T.AdditiveBlending}));falls.add(spray);const seeds=Array.from({length:count},()=>[rand(),rand(),rand(),rand()]);
 return{river,wet,falls,count:splashes.length,update(t:number){(river.material as T.ShaderMaterial).uniforms.time.value=t*.35;wetMat.uniforms.uTime.value=t;time.value=t;for(let i=0;i<count;i++){const p=splashes[i%splashes.length],s=seeds[i],age=(t*.22+s[0])%1,a=s[1]*Math.PI*2,r=age*(2+s[2]*8);positions[i*3]=p.x+Math.cos(a)*r;positions[i*3+1]=p.y+Math.sin(age*Math.PI)*(2+s[3]*7);positions[i*3+2]=p.z+Math.sin(a)*r;}g.attributes.position.needsUpdate=true;}};
}
