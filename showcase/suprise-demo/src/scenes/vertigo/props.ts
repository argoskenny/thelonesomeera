import * as THREE from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import type { CityMaterials } from './materials';

export function railing(b:GeometryBatch,m:CityMaterials,a:THREE.Vector3,c:THREE.Vector3,height=1.02){
  const length=a.distanceTo(c),steps=Math.ceil(length/.31);
  b.add(new THREE.CylinderGeometry(.034,.034,length,10),m.rust,(a.x+c.x)/2,(a.y+c.y)/2+height,(a.z+c.z)/2,new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(vec(0,1,0),c.clone().sub(a).normalize())));
  b.beam(a.clone().add(vec(0,.16,0)),c.clone().add(vec(0,.16,0)),.041,.042,m.iron);
  for(let i=0;i<=steps;i++){
    const p=a.clone().lerp(c,i/steps);b.beam(p,p.clone().add(vec(0,height,0)),i%4===0?.053:.021,i%4===0?.053:.021,m.rust);
    if(i%4===0)b.box(.12,.028,.12,p.x,p.y+.02,p.z,m.iron);
  }
}
export function airConditioner(b:GeometryBatch,m:CityMaterials,x:number,y:number,z:number,variant=0){
  b.box(.9,.63,.48,x,y,z,m.paintedMetal[variant%4],.028);
  b.box(.88,.025,.02,x,y-.2,z+.25,m.iron);
  b.cylinder(.214,.214,.020,x-.17,y+.02,z+.255,m.iron,24,new THREE.Euler(Math.PI/2,0,0));
  b.torus(.201,.014,x-.17,y+.02,z+.273,m.aluminum,new THREE.Euler(),24);
  for(let q=-4;q<=4;q++){
    const len=Math.sqrt(Math.max(.001,.20*.20-q*q*.043*.043))*2;
    b.box(len,.013,.014,x-.17,y+.02+q*.043,z+.286,m.aluminum);
  }
  for(let q=0;q<7;q++)b.box(.23,.026,.018,x+.27,y-.20+q*.071,z+.251,m.iron);
  for(const dx of[-.35,.35])b.beam(vec(x+dx,y-.34,z-.17),vec(x+dx,y-.34,z+.28),.042,.042,m.rust);
  b.tube([vec(x+.46,y-.17,z),vec(x+.53,y-.4,z-.18),vec(x+.57,y-.80,z-.16)],.024,m.black,7);
}
export function cageLamp(b:GeometryBatch,m:CityMaterials,x:number,y:number,z:number){
  b.box(.19,.44,.065,x,y,z,m.iron,.025);
  b.cylinder(.078,.078,.29,x,y,z+.115,m.shade,14);
  b.sphere(.064,x,y,z+.115,m.bulb,vec(.65,1.7,.65));
  for(const dy of[-.17,.17])b.cylinder(.107,.11,.037,x,y+dy,z+.115,m.rust,16);
  for(let q=0;q<6;q++){const a=q*Math.PI/3;b.cylinder(.008,.008,.35,x+Math.cos(a)*.104,y,z+.115+Math.sin(a)*.104,m.iron,6);}
}
export function plant(b:GeometryBatch,m:CityMaterials,x:number,y:number,z:number,seed=1){
  const rand=seededRandom(seed);b.cylinder(.19,.135,.34,x,y+.17,z,m.pot,14);b.torus(.182,.015,x,y+.34,z,m.rust);
  b.cylinder(.17,.17,.013,x,y+.329,z,m.black,12);
  for(let k=0;k<11;k++){
    const a=rand()*6.28,r=.12+rand()*.21,h=.26+rand()*.42;
    const end=vec(x+Math.cos(a)*r,y+.34+h,z+Math.sin(a)*r);
    b.beam(vec(x,y+.33,z),end,.006,.006,m.wood);
    const leaf=new THREE.SphereGeometry(.1,8,5);leaf.scale(.58,.11,1.6);leaf.rotateZ((rand()-.5)*1.3);leaf.rotateX((rand()-.5)*1.8);leaf.rotateY(a);b.add(leaf,m.leaf,end.x,end.y,end.z);
    const small=new THREE.SphereGeometry(.07,8,5);small.scale(.6,.12,1.4);small.rotateX(.4+rand());small.rotateY(a+1.4);b.add(small,m.leaf,(x+end.x)/2,(y+.34+end.y)/2,end.z);
  }
}
export function awning(b:GeometryBatch,m:CityMaterials,x:number,y:number,z:number,width:number,depth:number,index:number){
  const g=new THREE.PlaneGeometry(width,depth,Math.ceil(width*22),3),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const xx=p.getX(i),zz=p.getY(i)+depth/2;p.setXYZ(i,x+xx,y-zz*.15+Math.sin(xx*27)*.022,z+zz);}
  g.computeVertexNormals();b.add(g,m.paintedMetal[index%4]);
  for(const dx of[-width*.46,width*.46])b.beam(vec(x+dx,y,z),vec(x+dx,y-depth*.15,z+depth),.045,.055,m.rust);
  b.beam(vec(x-width/2,y-depth*.15,z+depth),vec(x+width/2,y-depth*.15,z+depth),.046,.056,m.rust);
}
export function laundry(b:GeometryBatch,m:CityMaterials,x:number,y:number,z:number,index:number){
  b.tube([vec(x-1.18,y,z),vec(x,y-.12,z+.035),vec(x+1.18,y,z)],.007,m.black,14);
  for(let i=0;i<4;i++){
    const xx=x-.83+i*.51,h=.48+(i%3)*.14,w=.29+(i%2)*.06,g=new THREE.PlaneGeometry(w,h,5,8),p=g.attributes.position;
    for(let j=0;j<p.count;j++){const u=(p.getY(j)+h/2)/h;p.setZ(j,Math.sin(p.getX(j)*28)*.025+Math.sin(u*5+index)*.04);}
    g.computeVertexNormals();b.add(g,m.cloth[(index+i)%5],xx,y-.15-h/2,z);
    for(const dx of[-w*.37,w*.37])b.box(.023,.048,.023,xx+dx,y-.15,z,m.wood);
  }
}
export function balcony(b:GeometryBatch,m:CityMaterials,x:number,y:number,z:number,width:number,index:number,detailed=true){
  const depth=1.03+(index%3)*.15;
  b.box(width,.16,depth,x,y-.08,z+depth/2,m.concrete);
  railing(b,m,vec(x-width/2,y,z+depth),vec(x+width/2,y,z+depth),.92);
  for(const side of[-1,1]){
    railing(b,m,vec(x+side*width/2,y,z),vec(x+side*width/2,y,z+depth),.92);
    b.beam(vec(x+side*width*.4,y-.14,z+depth*.90),vec(x+side*width*.4,y-1.0,z),.07,.09,m.rust);
  }
  if(detailed){
    if(index%3===0)plant(b,m,x+.65,y,z+.70,index+42);
    if(index%5===0)laundry(b,m,x,y+1.7,z+depth-.10,index);
    if(index%4===1)awning(b,m,x,y+2.65,z,width+.15,depth+.22,index);
  }
}
export function roomInterior(b:GeometryBatch,m:CityMaterials){
  // Open door at X=0, facade Z=0; actual floor and room extend four metres inward.
  b.box(4.8,.15,4.6,0,48.02,-2.2,m.floor);
  b.box(4.8,3.08,.13,0,49.55,-4.42,m.room);
  for(const x of[-2.4,2.4])b.box(.12,3.08,4.6,x,49.55,-2.2,m.room);
  b.box(4.8,.14,4.6,0,51.13,-2.2,m.room);
  for(const x of[-.71,.71])b.box(.12,2.72,.16,x,49.36,.06,m.wood);
  b.box(1.54,.12,.17,0,50.75,.06,m.wood);
  // The door is visibly open into the room, including inset panels, hinges and a handle.
  b.at(-.66,-.07,.97,()=>{
    b.box(1.22,2.62,.055,.61,49.37,0,m.wood);
    for(const yy of[48.74,49.62])b.box(.96,.66,.026,.61,yy,.039,m.paintedMetal[1]);
    b.box(.085,.20,.025,1.05,49.25,.055,m.rust);b.sphere(.027,1.05,49.25,.096,m.aluminum);
  });
  b.box(1.5,.085,.65,.72,48.83,-2.4,m.wood,.012);
  for(const dx of[-.62,.62])for(const dz of[-.24,.24])b.box(.065,.74,.065,.72+dx,48.44,-2.4+dz,m.wood);
  b.cylinder(.15,.15,.04,.42,48.90,-2.45,m.iron,16);b.cylinder(.024,.024,.48,.42,49.15,-2.45,m.rust,10);
  b.cylinder(.16,.29,.35,.42,49.56,-2.45,m.shade,24);b.sphere(.063,.42,49.51,-2.45,m.bulb);
  b.box(1.04,.10,.54,-1.46,48.55,-3.62,m.wood);b.box(1.04,.56,.08,-1.46,48.85,-3.83,m.wood);
  for(const x of[-1.88,-1.04])b.box(.065,.51,.42,x,48.26,-3.63,m.wood);
  for(let i=0;i<5;i++)b.box(.19,.04,.28,.98,48.91+i*.044,-2.37,m.cloth[i%5]);
  b.box(.68,.91,.043,1.60,50.01,-4.33,m.wood);b.box(.54,.76,.045,1.60,50.01,-4.30,m.cloth[0]);
  plant(b,m,-1.80,48.10,-.88,71);
  b.box(.32,.06,.48,0,48.13,-.04,m.black,.018);
}
