import * as T from 'three';
import { seededRandom } from '../../shared/geometry';
const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}`;
export function createWaterfalls(scene:T.Scene,mobile:boolean){
  const root=new T.Group();root.name='Cascades and wind-borne spray';scene.add(root);const time={value:0},dusk={value:0};
  const falls=[{x:57,z:-105,y:116,end:-90,w:6},{x:105,z:-102,y:116,end:-100,w:9},{x:140,z:-117,y:116,end:-105,w:5},{x:-120,z:-91,y:48,end:-110,w:6},{x:29,z:57,y:24,end:-120,w:5},{x:175,z:38,y:24,end:-100,w:4}];
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time,dusk},vertexShader:`varying vec2 vUv;varying float vDepth;uniform float time;void main(){vUv=uv;vec3 p=position;p.z+=sin(uv.y*35.+time*1.7+uv.x*5.)*.22+sin(uv.y*91.-time*3.)*.07;vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec2 vUv;varying float vDepth;uniform float time,dusk;${noise}
  void main(){float v=vUv.y;vec2 flow=vec2(vUv.x*35.,v*22.+time*2.7);float a=noise(flow),b=noise(flow*vec2(2.4,.6)+time*.4),c=noise(vec2(vUv.x*9.,v*8.+time));float edge=smoothstep(0.,.12,vUv.x)*(1.-smoothstep(.87,1.,vUv.x));float streak=smoothstep(.18,.83,a*.5+b*.35+c*.15);float foam=pow(streak,.5);vec3 col=mix(vec3(.16,.36,.37),vec3(.91,.96,.95),foam);col=mix(col,vec3(.69,.78,.81),smoothstep(100.,600.,vDepth)*.5);col*=mix(1.,.35,dusk);float alpha=edge*(.23+foam*.64)*smoothstep(0.,.05,v);gl_FragColor=vec4(col,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  for(const [i,f]of falls.entries())for(let layer=0;layer<2;layer++){
    const g=new T.PlaneGeometry(f.w*(1+layer*.2),f.y-f.end,12,100),p=g.attributes.position;
    for(let j=0;j<p.count;j++){const t=1-g.attributes.uv.getY(j);p.setZ(j,t*t*7+Math.sin(t*18+i)*.35+layer*.38);p.setX(j,p.getX(j)*(1+t*.45)+Math.sin(t*5+i)*t*1.5);}
    g.computeVertexNormals();const mesh=new T.Mesh(g,material);mesh.position.set(f.x,(f.y+f.end)/2,f.z);root.add(mesh);
    // Visible lip and stream crossing the stone before it falls into the valley.
    const lip=new T.Mesh(new T.PlaneGeometry(f.w,12,12,12),material);lip.rotation.x=-Math.PI/2;lip.position.set(f.x,f.y+.12,f.z-5.8);root.add(lip);
  }
  const random=seededRandom(773),count=mobile?600:1400,g=new T.BufferGeometry(),positions=new Float32Array(count*3),seeds=new Float32Array(count*4);
  for(let i=0;i<count;i++){const f=falls[i%falls.length];positions.set([f.x,f.y,f.z],i*3);seeds.set([random(),random(),random(),f.y-f.end],i*4);}
  g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('seed',new T.BufferAttribute(seeds,4));
  const spray=new T.Points(g,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time,dusk},vertexShader:`attribute vec4 seed;uniform float time;varying float alpha;void main(){float t=fract(seed.x+time*.065);vec3 p=position;p.y-=seed.w*t;p.x+=(seed.y-.5)*(4.+t*13.);p.z+=t*t*9.+sin(seed.z*30.)*t*4.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(130.*(.12+seed.z*.28)/max(1.,-mv.z),1.,7.);alpha=sin(t*3.14159)*.45;}`,fragmentShader:`uniform float dusk;varying float alpha;void main(){float a=1.-smoothstep(.1,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(mix(vec3(.9,.95,1.),vec3(.4,.55,.7),dusk),a*alpha);}`}));spray.frustumCulled=false;root.add(spray);
  return{root,count:falls.length,update(t:number,mood:number){time.value=t;dusk.value=mood;}};
}
