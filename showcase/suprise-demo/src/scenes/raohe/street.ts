import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { assetUrl } from '../../shared/assets';

const streetVertex = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 reflected;
  varying vec3 world;
  void main() {
    world = (modelMatrix * vec4(position,1.)).xyz;
    reflected = textureMatrix * vec4(position,1.);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
  }
`;

const streetFragment = /* glsl */ `
  uniform sampler2D tDiffuse, asphalt, stoneNormal, rough;
  uniform float clock;
  varying vec4 reflected;
  varying vec3 world;
  float hash(vec2 u) { return fract(sin(dot(u,vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
  }
  float strip(float dist,float footprint) { return 1.-smoothstep(-footprint,footprint,dist); }
  float roadPaint(vec2 p, float footprint) {
    float stem = max(abs(p.x)-.125,abs(p.y-.38)-.68);
    float tip = max(max(abs(p.x)*1.68-p.y-.89,p.y+.18),-p.y-.89);
    return strip(min(stem,tip),footprint);
  }
  // Subtle rings form where individual drops strike the smoother patches of road.
  vec2 ripple(vec2 p) {
    p*=2.8;
    vec2 cell=floor(p), q=fract(p)-.5;
    float seed=hash(cell);
    q-=(vec2(seed,hash(cell+16.))-.5)*.28;
    float r=length(q), age=fract(clock*.56+seed*9.);
    float envelope=(1.-smoothstep(.19,.37,r))*(1.-age)*smoothstep(0.,.06,age);
    float wave=(r-age*.42)*49.;
    return q/max(r,.001)*cos(wave)*exp(-abs(wave)*.3)*envelope;
  }
  void main() {
    vec2 p=world.xz, uv=p*.47;
    vec3 viewDir=normalize(cameraPosition-world);
    float distanceToEye=distance(cameraPosition,world);
    vec3 aggregate=texture2D(asphalt,uv).rgb;
    vec3 n=texture2D(stoneNormal,uv).rgb*2.-1.;
    float tooth=texture2D(rough,uv).g;
    float broad=noise(p*vec2(.72,.29))*.48+noise(p*1.2+17.)*.32+noise(p*2.3)*.20;
    float wet=smoothstep(.40,.70,broad+(1.-tooth)*.10);
    float grain=dot(aggregate,vec3(.30,.56,.14));
    float wear=clamp((grain*.8+tooth*.7+noise(p*13.)*.45)-.25,.10,.98);
    float fw=clamp(fwidth(p.x)*.8,.003,.10);
    float line=strip(abs(abs(p.x)-2.69)-.039,fw)*step(-74.,p.y)*step(p.y,10.);
    float arrow=roadPaint(p-vec2(.03,-.6),fw) + roadPaint(p-vec2(.04,-47.),fw);
    float dash=strip(max(abs(p.x)-.045,abs(mod(p.y+1.,5.7)-2.85)-.58),fw)*step(p.y,-7.)*step(-73.,p.y);
    float markings=clamp(arrow+dash,0.,1.);
    float left=mod(p.y+1.51,3.53)-1.76, right=mod(p.y+.6,3.61)-1.80;
    float washL=1./(1.1+pow((p.x+3.30)*.54,2.)+left*left*.27);
    float washR=1./(1.1+pow((p.x-3.26)*.54,2.)+right*right*.31);
    vec3 incident=vec3(.26,.27,.34)+vec3(1.65,.79,.30)*washL+vec3(1.98,1.08,.49)*washR;
    vec3 base=aggregate * mix(vec3(.78,.74,.78),vec3(.31,.32,.37),wet);
    base=mix(base,vec3(.73,.44,.09),line*wear*.90);
    base=mix(base,vec3(.86,.82,.73),markings*wear*.93);
    float gutter=1.-.60*smoothstep(2.7,3.8,abs(p.x));
    vec3 diffuse=base*incident*gutter;
    vec2 projected=reflected.xy/reflected.w;
    vec2 micro=n.xy*(.6+.6*tooth) + (noise(p*24.)-.5)*.36;
    micro=mix(micro,micro*.35+ripple(p)*.32,wet);
    float nearFade=1./(1.+distanceToEye*.048);
    float distortion=(.027-.012*wet)*nearFade;
    vec2 projectedRoad=projected+micro*distortion*vec2(.49,1.);
    float blur=mix(.018,.0035,wet)*nearFade;
    vec3 mirror=texture2D(tDiffuse,projectedRoad).rgb*.28;
    mirror+=texture2D(tDiffuse,projectedRoad+vec2(blur,blur*1.4)).rgb*.18;
    mirror+=texture2D(tDiffuse,projectedRoad-vec2(blur,blur*1.4)).rgb*.18;
    mirror+=texture2D(tDiffuse,projectedRoad+vec2(-blur*.8,blur*2.3)).rgb*.18;
    mirror+=texture2D(tDiffuse,projectedRoad+vec2(blur*.8,-blur*2.3)).rgb*.18;
    float grazing=pow(1.-max(viewDir.y,0.),3.);
    float reflectivity=(.075+.39*grazing)*mix(.40,.98,wet);
    // A rough wet aggregate spreads the warm under-counter lamps much farther
    // than the almost mirror-like pools, especially along each wheel track.
    float sheen=0.;
    for(int side=0;side<2;side++){
      float x=side==0?-3.0:3.0;
      vec3 reflectedEye=reflect(-viewDir,normalize(vec3(micro.x*.07,1.,micro.y*.07)));
      float lampHeight=2.05;
      vec2 hit=p+reflectedEye.xz*lampHeight/max(.075,reflectedEye.y);
      float z=round((hit.y-.63)/3.43)*3.43+.63;
      float broadness=1.0+.13*distanceToEye;
      float spread=pow((hit.x-x)/broadness,2.)+pow((hit.y-z)/(broadness*1.4),2.);
      sheen+=exp(-spread*1.45)*smoothstep(-77.,-73.,z)*(1.-smoothstep(8.,13.,z));
    }
    vec3 result=diffuse+mirror*reflectivity*(.74+.47*wear)
      +vec3(.22,.099,.029)*sheen*(.35+.7*wet)*(.42+wear);
    float fog=1.-exp(-distanceToEye*distanceToEye*.000022);
    gl_FragColor=vec4(mix(result,vec3(.038,.044,.062),fog),1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export async function buildStreet(scene:T.Scene, renderer:T.WebGLRenderer, mobile:boolean) {
  const loader=new T.TextureLoader();
  const [color,normal,roughness]=await Promise.all(['color','normal','roughness'].map(async (type)=>{
    const texture=await loader.loadAsync(assetUrl('night-market',`asphalt-${type}.jpg`));
    texture.wrapS=texture.wrapT=T.RepeatWrapping;
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    if(type==='color') texture.colorSpace=T.SRGBColorSpace;
    return texture;
  }));
  const road=new Reflector(new T.PlaneGeometry(120,230),{
    textureWidth:mobile?480:900,textureHeight:mobile?600:640,multisample:0,clipBias:.0005,
    shader:{
      name:'Rain-darkened asphalt',
      uniforms:{tDiffuse:{value:null},color:{value:null},textureMatrix:{value:null},asphalt:{value:null},stoneNormal:{value:null},rough:{value:null},clock:{value:0}},
      vertexShader:streetVertex,fragmentShader:streetFragment,
    },
  });
  road.name='Wet asphalt with planar reflections';road.rotation.x=-Math.PI/2;road.position.z=-32;
  const uniforms=(road.material as T.ShaderMaterial).uniforms;
  uniforms.asphalt.value=color;uniforms.stoneNormal.value=normal;uniforms.rough.value=roughness;
  // Rain moves in the surface shader every frame. Reflect the static scenery again only after the view changes.
  const renderMirror=road.onBeforeRender;
  const lastView=new T.Matrix4(),lastProjection=new T.Matrix4();
  let dirty=true;
  road.onBeforeRender=(...args)=>{
    const cam=args[2];
    if(!dirty && cam.matrixWorld.equals(lastView) && cam.projectionMatrix.equals(lastProjection)) return;
    renderMirror.apply(road,args);
    lastView.copy(cam.matrixWorld);lastProjection.copy(cam.projectionMatrix);dirty=false;
  };
  scene.add(road);
  addIronwork(scene);
  addStreetLights(scene);
  return {road,update(t:number){uniforms.clock.value=t;},invalidate(){dirty=true;}};
}

function addIronwork(scene:T.Scene) {
  const surface=document.createElement('canvas');surface.width=surface.height=384;
  const g=surface.getContext('2d')!;
  g.fillStyle='#322f2a';g.fillRect(0,0,384,384);
  for(let i=0;i<9000;i++){
    const x=(Math.sin(i*41.992)*46785)%1, y=(Math.cos(i*6.821)*98641)%1;
    g.fillStyle=i%3===0?'#726456':'#484541';g.fillRect(Math.abs(x)*384,Math.abs(y)*384,1.3,1.3);
  }
  const circle=(r:number,color:string,w:number)=>{
    g.beginPath();g.arc(192,192,r,0,Math.PI*2);g.strokeStyle=color;g.lineWidth=w;g.stroke();
  };
  for(const r of [127,138,161,173,179,187]) {circle(r,'#1b1d1c',3);circle(r+2,'#69645a',2);}
  for(let i=0;i<4;i++){
    for(let j=0;j<20+i*6;j++){
      const a=j*Math.PI*2/(20+i*6)+(i%2)*.065;
      g.save();g.translate(192+Math.cos(a)*(61+i*21),192+Math.sin(a)*(61+i*21));g.rotate(a+Math.PI/4);
      g.fillStyle='#161817';g.fillRect(-5,-2,13,5);g.fillStyle='#716a5c';g.fillRect(-5,2,13,2);g.restore();
    }
  }
  g.fillStyle='#8b8273';g.font='600 31px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('雨水',192,194);
  const iron=new T.CanvasTexture(surface);iron.colorSpace=T.SRGBColorSpace;
  const covers=new T.InstancedMesh(new T.CircleGeometry(.36,48),new T.MeshStandardMaterial({map:iron,bumpMap:iron,bumpScale:.009,metalness:.63,roughness:.37}),4);
  const transform=new T.Object3D();transform.rotation.x=-Math.PI/2;
  [[1.43,-5.2],[-1.45,-23.6],[1.86,-53.6],[-.9,-70]].forEach(([x,z],i)=>{
    transform.position.set(x,.008,z);transform.rotation.z=i*.9;transform.updateMatrix();covers.setMatrixAt(i,transform.matrix);
  });
  scene.add(covers);
  const dark=new T.MeshStandardMaterial({color:0x343431,metalness:.70,roughness:.48});
  const grates=new T.InstancedMesh(new T.BoxGeometry(.24,.025,.029),dark,22*16);
  transform.rotation.set(0,0,0);let index=0;
  for(const sign of [-1,1]) for(let z=6;z>=-74;z-=8){
    for(let j=0;j<16;j++){
      transform.position.set(sign*2.87,.008,z+j*.043);transform.updateMatrix();grates.setMatrixAt(index++,transform.matrix);
    }
  }
  grates.count=index;scene.add(grates);
}

function addStreetLights(scene:T.Scene){
  const wires:number[]=[], lamps:T.Vector3[]=[];
  const crossings=[[-28,5.18,.85],[-43,4.94,1.05],[-61,5.5,.90],[-78,5.85,1.1]];
  crossings.forEach(([z,h,sag],index)=>{
    const at=(u:number)=>new T.Vector3(-5.7+u*11.4,h-4*u*(1-u)*sag,z+u*(index%2?2.6:-3.5));
    for(let step=0;step<24;step++)wires.push(...at(step/24).toArray(),...at((step+1)/24).toArray());
    for(let i=1;i<11;i++){
      if((i+index*2)%7===0)continue;
      const mount=at(i/11),bulb=mount.clone();
      bulb.y-=.10+(i%3)*.024;wires.push(...mount.toArray(),...bulb.toArray());lamps.push(bulb);
    }
  });
  const line=new T.BufferGeometry();line.setAttribute('position',new T.Float32BufferAttribute(wires,3));
  scene.add(new T.LineSegments(line,new T.LineBasicMaterial({color:0x292127})));
  const bulbs=new T.InstancedMesh(new T.SphereGeometry(.033,8,5),new T.MeshBasicMaterial({color:new T.Color(4.8,3.3,1.8)}),lamps.length);
  const matrix=new T.Matrix4();
  lamps.forEach((p,i)=>{matrix.makeScale(.84,1.20,.84).setPosition(p);bulbs.setMatrixAt(i,matrix);});
  scene.add(bulbs);
}
