import * as T from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import { metricUV,noise } from '../../shared/procedural';
import type { Obstacle,WalkSurface } from '../../shared/types';
import { label,type Materials } from './materials';
import { buildRocket } from './rocket';
import { consolePosition } from './views';
export function buildBase(scene:T.Scene,m:Materials,mobile:boolean){
  const b=new GeometryBatch(true),obstacles:Obstacle[]=[],surfaces:WalkSurface[]=[{x:0,z:20,w:310,d:240,y:0}],random=seededRandom(831);
  const blocker=(x:number,z:number,w:number,d:number,h:number,minY=0)=>obstacles.push({x,z,w,d,h,minY});
  const rail=(x:number,y:number,z:number,w:number,d:number)=>{
    for(const dx of[-w/2,w/2])for(const dz of[-d/2,d/2])b.box(.07,1.1,.07,x+dx,y+.55,z+dz,m.yellow);
    for(const h of[.5,1.05]){for(const dz of[-d/2,d/2])b.box(w,.055,.055,x,y+h,z+dz,m.yellow);for(const dx of[-w/2,w/2])b.box(.055,.055,d,x+dx,y+h,z,m.yellow);}
  };
  b.box(310,.6,240,0,-.3,20,m.ground);
  b.box(18,.06,240,-103,.035,20,m.asphalt);b.box(310,.06,14,0,.035,105,m.asphalt);
  for(let z=-98;z<135;z+=10)b.box(.18,.012,5,-103,.075,z,m.white);
  for(let x=-148;x<153;x+=10)b.box(5,.012,.18,x,.075,105,m.white);
  // Expansion joints and patched concrete slabs anchor the industrial scale.
  for(let x=-145;x<156;x+=10)b.box(.025,.008,225,x,.006,20,m.asphalt);
  for(let z=-95;z<139;z+=10)b.box(298,.008,.025,0,.008,z,m.asphalt);
  b.cylinder(20,22,.10,0,.075,0,m.concrete,96);b.torus(19,.11,0,.14,0,m.yellow,undefined,96);
  for(let a=0;a<36;a++){const angle=a*Math.PI/18;b.at(Math.sin(angle)*23,Math.cos(angle)*23,-angle,()=>b.box(.2,.02,2,0,.04,0,m.yellow));}
  // Ring launch mount, six support legs and open flame trench.
  b.box(15,.025,40,0,.019,1,m.black);b.box(17,.23,3,0,.10,22,m.concrete);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,p=vec(Math.sin(a)*7.8,0,Math.cos(a)*7.8),q=vec(Math.sin(a)*6.5,13,Math.cos(a)*6.5);
    b.beam(p,q,1.7,1.6,m.frame);b.box(4,.3,4,p.x,.14,p.z,m.concrete);blocker(p.x,p.z,2.1,2.1,13);
    b.beam(vec(p.x*.6,2,p.z*.6),q,.28,.28,m.alloy);
  }
  b.torus(6.5,1.0,0,13,0,m.frame,undefined,64);b.torus(7.5,.28,0,12.4,0,m.alloy,undefined,64);
  for(let i=0;i<48;i++){const a=i/48*Math.PI*2;b.box(.07,2,.07,Math.sin(a)*8,14,Math.cos(a)*8,m.yellow);}
  for(const y of[13.5,14.9])b.torus(8,.055,0,y,0,m.yellow,undefined,64);
  blocker(0,0,10,10,135,13);
  const towerX=25,towerZ=-4;
  b.box(20,1,22,towerX,-.1,towerZ,m.concrete);blocker(towerX,towerZ,15,15,143);
  for(const x of[18,32])for(const z of[-11,3]){
    b.box(1.1,146,1.1,x,73,z,m.frame);b.box(2.5,1,2.5,x,.5,z,m.concrete);
    for(let y=4;y<143;y+=8){b.box(1.35,.4,1.35,x,y,z,m.alloy);for(const dx of[-.43,.43])b.sphere(.075,x+dx,y+.12,z+.59,m.black);}
  }
  for(let y=6;y<=134;y+=8){
    b.box(15,.24,16,towerX,y,towerZ,m.frame);
    for(const z of[-11,3]){
      b.beam(vec(18,y,z),vec(32,y+8,z),.28,.31,m.alloy);b.beam(vec(32,y,z),vec(18,y+8,z),.28,.31,m.frame);
      b.box(14,.65,.45,towerX,y,z,m.frame);
    }
    for(const x of[18,32]){b.beam(vec(x,y,-11),vec(x,y+8,3),.30,.30,m.frame);b.beam(vec(x,y,3),vec(x,y+8,-11),.30,.30,m.alloy);}
    rail(25,y,3.5,16,1.3);
    // Service stair flights inside the lattice.
    for(let k=0;k<16;k++)b.box(2,.13,.54,28,y+k*.5,-8+k*.58,m.alloy);
    b.beam(vec(27,y+1,-8),vec(27,y+9,1),.05,.05,m.yellow);
    b.box(1.3,.10,.8,25,y+.4,4,m.light);
  }
  b.box(20,.4,21,25,143,-4,m.frame);rail(25,143,-4,20,21);surfaces.push({x:25,z:-4,w:20,d:21,y:143});
  for(const dx of[-2,0,2])b.cylinder(.16,.16,135,22+dx,68,-8,m.alloy,12);
  b.cylinder(.10,.10,12,30,151,-10,m.alloy,8);
  const arms:T.Group[]=[];
  for(const y of[77,112]){
    const arm=new T.Group();arm.position.set(18,y,-4);const a=new GeometryBatch();
    a.box(14,.4,3.8,-7,0,0,m.frame);a.box(14,.3,3.8,-7,3.2,0,m.frame);
    for(const z of[-1.8,1.8])for(let x=0;x<14;x+=2){a.beam(vec(-x,0,z),vec(-x-2,3.2,z),.16,.16,m.alloy);a.beam(vec(-x,3.2,z),vec(-x-2,0,z),.16,.16,m.frame);}
    for(const z of[-1,1])a.cylinder(.2,.2,13,-7,1.5,z,m.alloy,16,new T.Euler(0,0,Math.PI/2));
    a.flush(arm);scene.add(arm);arms.push(arm);
  }
  // Cryogenic tank farm: insulated vessels, flanges, service valves and pipe racks.
  for(let i=0;i<8;i++){
    const x=58+(i%4)*15,z=-29-Math.floor(i/4)*24,h=[22,30,26,21][i%4],r=4.6;
    b.cylinder(r,r,h,x,h/2+.8,z,m.white,48);b.sphere(r,x,h+.8,z,m.white,vec(1,.30,1));b.cylinder(5,5,.8,x,.4,z,m.concrete,48);
    for(let y=3;y<h;y+=4)b.torus(r+.085,.035,x,y,z,m.alloy,undefined,48);
    b.cylinder(.16,.16,h+2,x-r-.45,(h+2)/2,z,m.alloy,12);
    for(let k=0;k<h*2;k++)b.box(.65,.055,.09,x+r+.3,k*.5,z,m.alloy);
    for(const dx of[-.34,.34])b.cylinder(.045,.045,h,x+r+.3+dx,h/2,z,m.alloy,8);
    b.plane(5,1.25,x,8,z+r+.02,label(i%2?'LIQUID OXYGEN':'LIQUID METHANE','#aeb7b4','#263a45'));
    blocker(x,z,10,10,h+2);
  }
  for(let i=0;i<4;i++){
    const x=58+i*16,z=7;b.cylinder(2.2,2.2,22,x,4,z,m.white,36,new T.Euler(Math.PI/2,0,0));
    for(const dz of[-11,11])b.sphere(2.2,x,4,z+dz,m.white,vec(1,1,.40));
    for(const dz of[-7,7])b.box(4.5,2,1,x,1.1,z+dz,m.concrete);
    for(let q=-9;q<=9;q+=3)b.torus(2.22,.042,x,4,z+q,m.alloy,new T.Euler(),36);
    blocker(x,z,4.5,25,6.4);
  }
  for(let k=0;k<9;k++){
    const z=-18+k*.82;b.tube([vec(111,1.5,z),vec(114,2,z),vec(115,4,z),vec(110,5,z),vec(45,5,z),vec(40,4,z),vec(35,2,z),vec(13,2,z),vec(7,7,z*.32)],.19+(k%3)*.06,m.alloy,32);
    for(const x of[45,61,77,93,109]){
      b.torus(.28,.055,x,5,z,m.frame,new T.Euler(0,Math.PI/2,0),12);
      if(k===0){b.box(.25,5,.25,x,2.5,-14,m.frame);b.box(.3,.3,8,x,4.6,-14,m.frame);}
    }
    b.cylinder(.25,.25,1,48+k,5.6,z,m.red,12);b.torus(.55,.05,48+k,6.15,z,m.red,undefined,16);
  }
  // Dense foreground pipe gallery, insulated elbows and bolted collector manifolds.
  for(let lane=0;lane<7;lane++){
    const z=27+lane*1.2;
    b.cylinder(.30,.30,70,79,3.4,z,m.alloy,20,new T.Euler(0,0,Math.PI/2));
    for(let x=45;x<115;x+=7){b.torus(.37,.07,x,3.4,z,m.frame,new T.Euler(0,Math.PI/2,0),16);if(lane===0){for(const zz of[26,36])b.box(.3,3.4,.3,x,1.7,zz,m.frame);b.box(.3,.4,11,x,2.7,31,m.frame);}}
    b.tube([vec(44,3.4,z),vec(41,3.4,z),vec(40,2,z),vec(40,1,z+2),vec(32,1,z+2)],.3,m.white,18);
    b.cylinder(.12,.12,1,83,4.1,z,m.alloy,10);b.torus(.46,.06,83,4.65,z,m.red,undefined,16);
  }
  for(let i=0;i<14;i++){
    const x=52+(i%7)*9,z=43+Math.floor(i/7)*6;
    b.box(2.7,.4,2.6,x,.2,z,m.concrete);b.cylinder(.6,.6,2.8,x,1.8,z,m.alloy,24);
    b.sphere(.6,x,3.2,z,m.alloy,vec(1,.5,1));b.box(.5,.8,.6,x+.8,2,z,m.frame);
    b.tube([vec(x,1,z),vec(x+2,1,z),vec(x+2,.5,39)],.13,m.alloy,12);
    blocker(x,z,2,2,3.6);
  }
  for(let i=0;i<18;i++){
    const x=-83+(i%9)*15,z=68+Math.floor(i/9)*7;
    b.box(5,.35,2,x,.35,z,m.frame);b.box(1.4,.8,1.9,x+1.5,.9,z,m.white,.05);
    for(const dx of[-1.6,1.6])for(const dz of[-1,1])b.cylinder(.42,.42,.24,x+dx,.42,z+dz,m.black,16,new T.Euler(Math.PI/2,0,0));
    for(let q=0;q<3;q++)b.cylinder(.36,.36,3,x-.4,1+q*.5,z,m.alloy,16,new T.Euler(0,0,Math.PI/2));
  }
  // Storage sheds, electrical cabinets, container corrugations and yard equipment.
  for(let i=0;i<12;i++){
    const x=i<6?-65+i%3*17:55+(i%3)*19,z=i<6?-30-Math.floor(i/3)*27:56+Math.floor((i-6)/3)*19,w=i%3===0?12:9;
    const mat=i%3===0?m.white:m.frame;b.box(w,3,5,x,1.5,z,mat);
    for(let q=-w/2+.2;q<w/2;q+=.36)b.box(.10,2.8,.07,x+q,1.5,z+2.53,m.alloy);
    b.box(1.9,2.45,.04,x,1.23,z+2.56,m.black);b.box(.06,2.2,.07,x+.12,1.23,z+2.6,m.alloy);
    b.box(2,.12,1.1,x,3.13,z+1.3,m.alloy);blocker(x,z,w,5,3.2);
    if(i%2===0)b.plane(3,.75,x,2.2,z+2.59,label(`SECTOR ${String(i+1).padStart(2,'0')}`));
  }
  for(let i=0;i<32;i++){
    const x=-85+random()*205,z=75+random()*13;
    b.box(1.2,1.35,1,x,.68,z,i%3?m.frame:m.yellow,.08);for(let q=0;q<5;q++)b.box(.8,.025,.03,x,.5+q*.12,z+.51,m.black);
    blocker(x,z,1.2,1,1.4);
  }
  const lights:T.PointLight[]=[];
  for(const [x,z]of[[-70,22],[-70,-65],[46,37],[120,34],[120,-67],[-32,80],[5,-54],[135,110]]){
    b.cylinder(.14,.24,16,x,8,z,m.alloy,12);b.box(3.2,.17,1,x,16,z,m.frame);
    for(const dx of[-1.2,0,1.2]){b.box(.7,.35,.5,x+dx,16,z,m.black);b.box(.64,.16,.52,x+dx,15.95,z+.03,m.light);}
    b.box(.48,.7,.28,x,.7,z,m.frame);
    const light=new T.PointLight(0xffdbac,115,40,2);light.position.set(x,15.5,z);scene.add(light);lights.push(light);
  }
  // Perimeter fencing and jersey barriers, leaving the main entrance traversable.
  for(const z of[-94,134])for(let x=-147;x<147;x+=6){
    if(z>0&&Math.abs(x+103)<12)continue;
    b.cylinder(.045,.045,2.4,x,1.2,z,m.frame,8);b.box(5.8,.035,.035,x+3,2.25,z,m.alloy);
    for(let q=0;q<12;q++)b.beam(vec(x+q*.5,0,z),vec(x+q*.5+1,2.2,z),.009,.009,m.alloy);
  }
  for(let i=0;i<13;i++){const x=-68+i*8;b.box(3,.8,.55,x,.4,91,m.concrete,.12);b.box(.8,.3,.03,x,.57,91.3,m.yellow);blocker(x,91,3,.6,.8);}
  // Ground launch console, with a real red mushroom switch and safety hoop.
  b.at(consolePosition.x,consolePosition.z,0,()=>{
    b.box(2.8,.16,2.2,0,.08,0,m.concrete);b.box(1.25,1.02,.7,0,.67,0,m.frame,.06);
    b.box(1.65,.14,1,0,1.25,0,m.alloy,.04);b.plane(1.1,.28,0,.83,.36,label('LAUNCH CONTROL'));
    b.box(.52,.016,.36,-.42,1.33,.04,m.black,.02);b.box(.43,.018,.23,-.42,1.344,.04,m.green,.01);
    for(const x of[-.65,.65])b.cylinder(.025,.025,.4,x,1.5,-.36,m.yellow,8);b.box(1.3,.035,.035,0,1.7,-.36,m.yellow);
    b.cylinder(.19,.19,.04,.36,1.35,.10,m.black,24);
  });
  const switchMesh=new T.Mesh(new T.CylinderGeometry(.145,.16,.095,24),new T.MeshStandardMaterial({color:0xd32e1e,roughness:.28,emissive:0x771004,emissiveIntensity:.25}));switchMesh.position.copy(consolePosition).add(vec(.36,1.43,.1));scene.add(switchMesh);blocker(consolePosition.x,consolePosition.z,1.5,1,1.4);
  b.flush(scene);
  scene.traverse(o=>{if(o instanceof T.Mesh&&(o.material===m.ground||o.material===m.asphalt))o.castShadow=false;});
  const rocket=buildRocket(m);scene.add(rocket);
  // Low coastal marsh islands: real geometry, with the water reflecting through tidal channels.
  const terrain=new T.PlaneGeometry(2400,2100,mobile?160:256,mobile?140:224);terrain.rotateX(-Math.PI/2);terrain.translate(0,0,-280);
  const pos=terrain.attributes.position,colors=[];
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i),n=noise(x/95,z/44)*.6+noise(x/28,z/17)*.28+noise(x/9,z/7)*.12;
    const channel=Math.sin(z*.019+Math.sin(x*.006)*2.8)*.55+Math.sin(x*.014+z*.003)*.22;
    let y=(n-.48)*7+channel*2;if(z<-650)y-=(-z-650)*.018;
    const dx=Math.max(0,Math.abs(x)-155),dz=Math.max(0,Math.abs(z-20)-120),edge=Math.hypot(dx,dz);if(edge<70)y=Math.max(y,.3*(1-edge/70));if(Math.abs(x)<155&&z>-100&&z<140)y=-1.3;pos.setY(i,y);
    const color=new T.Color().setRGB(.085+n*.11,.083+n*.10,.045+n*.065);colors.push(color.r,color.g,color.b);
  }
  terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.computeVertexNormals();const marsh=new T.Mesh(terrain,new T.MeshStandardMaterial({vertexColors:true,roughness:.96,normalMap:m.concrete.normalMap,normalScale:new T.Vector2(.15,.15)}));marsh.receiveShadow=true;scene.add(marsh);
  const sea=new Water(new T.PlaneGeometry(9000,9000),{textureWidth:mobile?256:512,textureHeight:mobile?256:512,waterNormals:m.waterNormal,sunDirection:vec(-.65,.15,-.74).normalize(),sunColor:0xffbe7a,waterColor:0x162e38,distortionScale:1.5,fog:false});sea.rotation.x=-Math.PI/2;sea.position.y=-.8;sea.material.uniforms.size.value=3.8;scene.add(sea);
  return {rocket,arms,lights,sea,obstacles,surfaces,switchMesh,update(time:number,arm:number){sea.material.uniforms.time.value=time*.33;arms.forEach((a,i)=>a.rotation.y=arm*(i?-.95:1.15));},stats:{tanks:12,towerHeight:146,rocketHeight:119}};
}
