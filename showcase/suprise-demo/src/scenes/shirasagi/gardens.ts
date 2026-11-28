import * as T from 'three';
import { seededRandom, vec, GeometryBatch } from '../../shared/geometry';
import { assetUrl } from '../../shared/assets';
import type { Obstacle } from '../../shared/types';
import { addEnclosure } from './garden-enclosure';
import { addGardenTrees, type GardenTree } from './garden-trees';

function texture(url:string, color:boolean) {
  const image=new T.TextureLoader().load(url);
  image.wrapS=image.wrapT=T.RepeatWrapping;image.anisotropy=8;
  if(color)image.colorSpace=T.SRGBColorSpace;
  return image;
}

function canopyOcclusion(sites:GardenTree[]) {
  // A low-frequency ambient shadow integrates the individual trees under the overcast sky.
  const c=document.createElement('canvas');c.width=c.height=512;
  const ctx=c.getContext('2d')!;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,512,512);
  const scale=512/240;
  function shade(x:number,z:number,radius:number,opacity:number) {
    const px=(x+120)*scale,pz=(z+120)*scale,s=radius*scale;
    const gradient=ctx.createRadialGradient(px,pz,0,px,pz,s);
    gradient.addColorStop(0,'rgba(0,0,0,'+opacity+')');
    gradient.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=gradient;ctx.fillRect(px-s,pz-s,s*2,s*2);
  }
  for(const site of sites){
    shade(site.x,site.z,site.height*.59,.22);
    shade(site.x,site.z,.47+site.height*.09,.42);
  }
  const texture=new T.CanvasTexture(c);texture.flipY=false;
  return texture;
}

function forestFloor(gravel:T.Texture,normal:T.Texture,loam:T.Texture,sites:GardenTree[]) {
  const shade=canopyOcclusion(sites);
  const material=new T.MeshStandardMaterial({map:gravel,normalMap:normal,normalScale:new T.Vector2(.38,.38),roughness:.98});
  material.onBeforeCompile=shader=>{
    shader.uniforms.gardenLoam={value:loam};
    shader.uniforms.gardenShade={value:shade};
    shader.fragmentShader='uniform sampler2D gardenShade; uniform sampler2D gardenLoam;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec2 p = vMapUv;
      float gravelLuma = dot(texture2D(map,p*.37).rgb,vec3(.25,.5,.25));
      vec3 coarse=texture2D(map,p*.43).rgb;
      vec3 fine=texture2D(map,mat2(.84,-.54,.54,.84)*p*1.17).rgb;
      vec3 soil=texture2D(gardenLoam,p*.33).rgb;
      vec3 leafLoam=texture2D(gardenLoam,mat2(.64,-.77,.77,.64)*p*.8).rgb;
      float mottling=sin(p.x*.57+cos(p.y*.33)*1.9)*.25+sin(p.y*.82+p.x*.34)*.1+gravelLuma*.8;
      vec2 q=abs(p)-vec2(18.,16.);
      float rim=length(max(q,0.))+min(max(q.x,q.y),0.);
      float walkway=abs(rim-11.+sin(p.y*.085+p.x*.06)*.95)-3.6;
      float northPath=max(p.y+16.,abs(p.x-13.5-sin((p.y+48.)*.072)*4.)-3.1);
      float southPath=max(20.-p.y,abs(p.x-16.-sin(p.y*.055)*13.)-2.9);
      float eastPath=max(27.-p.x,abs(p.y-33.+sin(p.x*.06)*4.4)-3.1);
      float pathMask=1.-smoothstep(-1.,1.,min(walkway,min(northPath,min(southPath,eastPath)))+mottling*1.1);
      vec3 trail=mix(fine,coarse,.62)*vec3(1.40,1.43,1.46)+vec3(.03);
      vec3 woodland=mix(leafLoam,soil,.67)*vec3(1.05,1.12,.98);
      float moss=smoothstep(.00,.29,mottling)*smoothstep(.8,3.8,abs(rim-11.));
      woodland=mix(woodland,woodland*.64+vec3(.059,.065,.018),moss*.64);
      float footing=length(max(abs(p)-vec2(19.,17.),0.));
      float shade=texture2D(gardenShade,p/240.+.5).r * mix(.71,1.,smoothstep(0.,2.8,footing));
      diffuseColor.rgb *= mix(woodland,trail,pathMask)*shade;
    `);
  };
  material.customProgramCacheKey=()=>'shirasagi-garden-floor-v1';
  const geometry=new T.PlaneGeometry(450,450,1,1);
  geometry.rotateX(-Math.PI/2);
  const position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
  for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i),position.getZ(i));
  // The normal detail shares the photographic footprint of the coarse gravel texture.
  normal.repeat.set(.43,.43);
  const ground=new T.Mesh(geometry,material);ground.name='砂礫の回遊路';ground.receiveShadow=true;
  ground.position.y=-.018;return ground;
}

function trees() {
  const r=seededRandom(12823);
  const specs:GardenTree[]=[
    {x:41,z:16.5,height:11.8,leaves:.21},
    {x:-7,z:24.5,height:9.2,leaves:.78},
    {x:-23,z:33.5,height:9.3,leaves:.86},
    {x:-32,z:10,height:8.8,leaves:.36},
    {x:25,z:-15,height:6.5,leaves:.71},
    {x:5.5,z:-30,height:6.2,leaves:.36},
    {x:21.8,z:-9.5,height:4.3,leaves:.89},
    {x:-29,z:-16,height:8.1,leaves:.64},
    {x:4,z:42,height:7.3,leaves:.83},
    {x:51,z:29,height:8.7,leaves:.31},
    {x:41,z:52,height:9.7,leaves:.62},
  ];
  for(let i=0;i<30;i++){
    const angle=(i+.55+r()*.6)*Math.PI*2/30;
    const x=Math.cos(angle)*(40+r()*17), z=Math.sin(angle)*(40+r()*18);
    if((x>16&&z>2&&x<48&&z<51)||(Math.abs(z+48)<5&&x>-57&&x<55)||(Math.abs(x+55)<4&&z>-52&&z<54))continue;
    if(Math.abs(x-13.5)<8&&z<-34) continue;
    if(specs.some(s=>Math.hypot(s.x-x,s.z-z)<5))continue;
    specs.push({x,z,height:6+r()*6,leaves:r()});
  }
  for(let i=0;i<123;i++){
    const angle=i*2.39996;
    const distance=64+r()*44;
    specs.push({x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,height:6+r()*9,leaves:.65+r()*.35,distant:true});
  }
  return specs;
}

function meadow(group:T.Group, rock:T.Texture, sites:GardenTree[]) {
  const random=seededRandom(4627);
  const vertices:number[]=[],colors:number[]=[];
  const grassShade=new T.Color(), bright=new T.Color();
  const spots:T.Vector3[]=[];
  // Tufts gather at tree roots and at the foot of the masonry, leaving the paths worn.
  for(const tree of sites.filter(s=>!s.distant)){
    for(let i=0;i<22;i++) {
      const a=random()*6.28,r=Math.sqrt(random())*4.7;
      spots.push(vec(tree.x+Math.cos(a)*r,0,tree.z+Math.sin(a)*r));
    }
  }
  for(let i=0;i<400;i++){
    const a=random()*6.28;
    const r=Math.min(19.1/Math.abs(Math.cos(a)),17.1/Math.abs(Math.sin(a)))+.15+random()*2.4;
    spots.push(vec(Math.cos(a)*r,0,Math.sin(a)*r));
  }
  for(const spot of spots){
    grassShade.setHSL(.124+random()*.080,.13+random()*.18,.20+random()*.14,T.SRGBColorSpace);
    bright.copy(grassShade).multiplyScalar(1.6);
    const size=.11+random()*.46;
    for(let j=0;j<10;j++){
      const x=spot.x+(random()-.5)*size*1.4,z=spot.z+(random()-.5)*size*1.4,a=random()*6.28;
      const w=.008+random()*.018,h=size*(.47+random()*.62),bx=Math.cos(a),bz=Math.sin(a);
      vertices.push(x-w*bz,0,z+w*bx,x+w*bz,0,z-w*bx,x+bx*h*.45,h,z+bz*h*.45);
      colors.push(grassShade.r,grassShade.g,grassShade.b,grassShade.r,grassShade.g,grassShade.b,bright.r,bright.g,bright.b);
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  group.add(new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide})));
  const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({map:rock,roughness:1}),93);
  const dummy=new T.Object3D();
  for (let i=0;i<rocks.count;i++){
    const p=spots[Math.floor(random()*spots.length)],s=.10+random()*.35;
    dummy.position.set(p.x,-s*.10,p.z);dummy.scale.set(s*(.8+random()*.73),s*.60,s*(.73+random()*.6));
    dummy.rotation.set(random(),random()*6,random()*.46);dummy.updateMatrix();
    rocks.setMatrixAt(i,dummy.matrix);rocks.setColorAt(i,new T.Color(0xa5a18a).multiplyScalar(.6+random()*.52));
  }
  rocks.receiveShadow=rocks.castShadow=true;group.add(rocks);
}

function lanterns(root:T.Group, rock:T.Texture, obstacles:Obstacle[]) {
  const b=new GeometryBatch();
  const stone=new T.MeshStandardMaterial({color:0xb5b4a8,map:rock,roughness:.97});
  const cavity=new T.MeshStandardMaterial({color:0x252429,roughness:1});
  for(const [x,z] of [[-36,15],[6,-39],[37,-31]]){
    b.at(x,z,Math.PI*.25,()=>{
      b.cylinder(.42,.50,.18,0,.09,0,stone,8);
      b.cylinder(.23,.34,.17,0,.26,0,stone,8);
      b.cylinder(.16,.20,.85,0,.72,0,stone,8);
      b.cylinder(.42,.22,.15,0,1.19,0,stone,6);
      b.box(.69,.11,.69,0,1.3,0,stone);
      b.box(.38,.39,.38,0,1.53,0,cavity);
      for(const xx of [-.23,.23])for(const zz of [-.23,.23])b.box(.10,.44,.10,xx,1.55,zz,stone);
      b.cylinder(.16,.62,.32,0,1.91,0,stone,4);
      b.sphere(.14,0,2.13,0,stone,vec(.89,1.08,.89));
    });
    obstacles.push({x,z,w:.71,d:.71,h:2.26});
  }
  b.flush(root);
}

export function createGardens():T.Group {
  const group=new T.Group();group.name='秋末の城庭';
  const obstacles:Obstacle[]=[];
  const local=(file:string)=>new URL('../assets/shirasagi/grounds/'+file,document.baseURI).href;
  const gravel=texture(local('leaf_scattered_gravel_diff.jpg'),true);
  const normal=texture(local('leaf_scattered_gravel_nor_gl.jpg'),false);
  const loam=texture(local('forest_ground_04_diff.jpg'),true);
  const bark=texture(local('bark_brown_02_diff.jpg'),true);
  const stone=texture(assetUrl('afterlight','rock-color.jpg'),true);
  const sites=trees();
  group.add(forestFloor(gravel,normal,loam,sites));
  addGardenTrees(group,sites,bark,obstacles);
  addEnclosure(group,obstacles,stone);
  meadow(group,stone,sites);lanterns(group,stone,obstacles);
  group.userData.obstacles=obstacles;
  return group;
}
