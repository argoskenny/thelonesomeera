import * as THREE from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import { noise } from '../../shared/procedural';
import type { Obstacle, WalkSurface } from '../../shared/types';
import type { CityMaterials } from './materials';
import { tower,type Tower } from './architecture';
import { railing,awning,cageLamp,plant,laundry,airConditioner } from './props';
import { createSea } from './water';
import { rockShoreline,type ShoreRock } from './shoreline';

export function buildCity(scene:THREE.Scene,m:CityMaterials,mobile:boolean){
  const obstacles:Obstacle[]=[],specs:Tower[]=[],rand=seededRandom(8921),b=new GeometryBatch(true);
  const surfaces:WalkSurface[]=[];
  const towers=new THREE.Group();scene.add(towers);
  [-1,1].forEach(side=>{
    const zs=side===-1?[43,18,-6,-30,-56,-83,-112]:[36,11,-15,-42,-69,-98,-127];
    zs.forEach((z,i)=>specs.push({x:side*(15+(i>1?[0,1.8,-.7,3.3,-.4][i%5]:0)),z,width:i===1&&side===-1?17.5:17.5+(i%3)*1.5,depth:14+(i%3)*2,floors:[25,29,23,32,28,34,30][(i+(side===1?2:0))%7],angle:-side*Math.PI/2,seed:40+i+(side===1?19:0),hero:i===1&&side===-1}));
    for(let row=0;row<2;row++)for(let i=0;i<5;i++)specs.push({x:side*(43+row*25),z:32-i*35-row*10,width:22+(i%2)*3,depth:20,floors:26+Math.floor(rand()*14),angle:-side*Math.PI/2,seed:101+i+row*5+(side===1?31:0),distant:true});
  });
  const built=specs.map(t=>tower(t,m,towers,obstacles,surfaces));
  function slab(x:number,y:number,z:number,w:number,d:number,mat:THREE.Material=m.floor){surfaces.push({x,y,z,w,d});b.box(w,.23,d,x,y-.115,z,mat);obstacles.push({x,z,w,d,minY:y-.23,h:y+.02});}
  // The hero balcony is a continuous walkable ledge, with a cantilevered overlook.
  slab(-13.47,48,8,3.06,85);railing(b,m,vec(-11.91,48,50.5),vec(-11.91,48,-34.5));
  slab(-10.1,48,-1.5,6.6,6.7);railing(b,m,vec(-6.79,48,1.85),vec(-6.79,48,-4.85));
  for(const z of[1.85,-4.85])railing(b,m,vec(-11.90,48,z),vec(-6.79,48,z));
  for(let z=-32;z<51;z+=5.5){
    b.beam(vec(-15.1,44.8,z),vec(-11.94,47.82,z),.17,.21,m.rust);
    b.beam(vec(-15.1,47.78,z),vec(-11.89,47.78,z),.18,.27,m.iron);
    b.box(.35,.60,.035,-15.02,44.9,z,m.rust);
  }
  // Overhead service gallery: a rough soffit close to the camera and diagonal steel brackets.
  slab(-13.45,52.5,23,3.18,11,m.concrete);railing(b,m,vec(-11.86,52.5,28.5),vec(-11.86,52.5,17.5));
  for(const z of[17.8,23])b.beam(vec(-15,50.75,z),vec(-11.90,52.25,z),.12,.15,m.wood);
  b.at(-15,18,Math.PI/2,()=>{
    awning(b,m,-4.6,51.2,.0,4.3,2.05,1);
    b.box(.50,.78,.095,2.36,50.50,.12,m.paintedMetal[3]);
    b.box(.35,.49,.03,2.36,50.54,.18,m.iron);
    for(let i=0;i<5;i++)b.box(.24,.018,.025,2.36,50.35+i*.09,.204,m.aluminum);
    for(const x of[-5.1,-5.8])plant(b,m,x,48.03,1.3,Math.floor(-x*22));
  });
  // Floor expansion joints, patches and a narrow rainwater gutter.
  for(let z=-33;z<50;z+=2.7)b.box(2.8,.007,.015,-13.46,48.006,z,m.black);
  for(let i=0;i<32;i++){
    const x=-14.7+rand()*2.6,z=-30+rand()*77;const points=[vec(x,48.012,z)];
    for(let j=1;j<5;j++)points.push(vec(x+(rand()-.5)*.30,48.012,z+j*.13));b.tube(points,.006,m.black,10);
  }
  b.box(.16,.042,80,-14.9,48.025,8,m.iron);
  for(let z=-25;z<40;z+=9){b.box(.31,.018,.49,-14.25,48.012,z,m.iron);for(let i=0;i<6;i++)b.box(.25,.019,.022,-14.25,48.022,z-.19+i*.07,m.black);}
  // A second circulation level on the opposite wall and its little planted courtyard.
  slab(13.5,39,-48,3,44);railing(b,m,vec(11.97,39,-26),vec(11.97,39,-70));
  slab(11.3,39,-56,7.1,8);railing(b,m,vec(7.73,39,-52),vec(7.73,39,-60));
  for(const z of[-52,-60])railing(b,m,vec(7.73,39,z),vec(14.9,39,z));
  for(let i=0;i<7;i++)plant(b,m,8.3+i*.82,39.03,-59.4,300+i);
  b.box(2.3,.12,.55,11.3,39.52,-59,m.wood);for(const x of[10.4,12.2])b.box(.13,.48,.48,x,39.24,-59,m.iron);
  for(let z=-68;z<-25;z+=6)b.beam(vec(15,36.3,z),vec(12,38.8,z),.18,.2,m.rust);
  function bridge(z:number,y:number,house:boolean){
    slab(0,y,z,30.4,3.9);
    for(const zz of[z-2,z+2]){
      railing(b,m,vec(-15,y,zz),vec(15,y,zz));
      b.beam(vec(-15,y-.5,zz),vec(15,y-.5,zz),.19,.29,m.iron);
      b.beam(vec(-15,y-2.1,zz),vec(15,y-2.1,zz),.15,.20,m.rust);
      for(let x=-15;x<15;x+=3){b.beam(vec(x,y-.5,zz),vec(x+3,y-2.1,zz),.10,.12,m.rust);b.beam(vec(x,y-2.1,zz),vec(x+3,y-.5,zz),.10,.12,m.rust);}
    }
    for(const side of[-1,1])b.beam(vec(side*15,y-7,z),vec(side*9,y-2,z),.34,.39,m.iron);
    if(house){
      const x=4.3,w=6.4;
      // Doorway is open on the bridge-facing side. Glazed rooms sit behind the passage.
      b.box(w,2.8,.14,x,y+1.4,z-1.8,m.paintedMetal[1]);
      for(const xx of[x-w/2,x+w/2])b.box(.16,2.8,2.2,xx,y+1.4,z-.75,m.paintedMetal[1]);
      for(const xx of[x-2.45,x,x+2.6])b.box(1.3,2.8,.14,xx,y+1.4,z+.4,m.paintedMetal[1]);
      for(const xx of[x-1.4,x+1.3]){
        b.box(1.3,.65,.16,xx,y+.33,z+.4,m.paintedMetal[1]);b.box(1.3,.45,.16,xx,y+2.57,z+.4,m.paintedMetal[1]);
        b.box(1.29,1.74,.035,xx,y+1.52,z+.37,m.litWindows[1]);
        for(const dx of[-.64,0,.64])b.box(.045,1.77,.07,xx+dx,y+1.52,z+.45,m.wood);
        for(const yy of[y+.64,y+1.55,y+2.4])b.box(1.34,.045,.07,xx,yy,z+.45,m.wood);
      }
      for(let i=0;i<30;i++){const xx=x-w/2+i*.22;if(Math.abs(xx-(x-1.4))>.71&&Math.abs(xx-(x+1.3))>.71)b.box(.028,2.8,.04,xx,y+1.4,z+.51,m.wood);}
      awning(b,m,x,y+3.13,z-2.1,w+.8,4.5,1);laundry(b,m,x+.5,y+1.68,z+1.82,3);
      airConditioner(b,m,x+2.68,y+.41,z+.85,2);plant(b,m,x-2.6,y+.02,z+1.25,450);
      obstacles.push({x,z:z-.69,w,d:2.55,minY:y,h:y+2.8});
    }
  }
  bridge(-6,55,true);bridge(-74,33,false);bridge(-118,74,false);
  // Exposed stairs connect the left balconies and the upper bridge landing.
  const stairX=-13.2,steps=28;
  for(let i=0;i<steps;i++){
    const y=48+i*.25,z=7-i*.43;b.box(2.2,.10,.45,stairX,y,z,m.iron);
    obstacles.push({x:stairX,z,w:2.2,d:.45,minY:y-.05,h:y+.05});
    surfaces.push({x:stairX,z,w:2.2,d:.45,y:y+.05});
  }
  for(const x of[stairX-1.1,stairX+1.1]){
    b.beam(vec(x,47.8,7.2),vec(x,54.7,-5.2),.12,.16,m.rust);
    railing(b,m,vec(x,48,7.2),vec(x,55,-5.2),1);
  }
  // Electrical bundles span the canyon at different heights, never a single repeated grid.
  for(let i=0;i<20;i++){
    const z=48-i*8.8,y=60+(i%5)*8;
    b.tube([vec(-16,y+2,z),vec(-6,y-2.2,z-1.3),vec(5,y-2.6,z-.5),vec(16,y+.7,z-3)],.023+(i%3)*.008,m.black,32);
    if(i%2===0)b.tube([vec(-16,y+2.12,z+.11),vec(-5,y-2.6,z-1.8),vec(7,y-2.3,z-.4),vec(16,y+.83,z-2.86)],.019,m.black,32);
  }
  for(const side of[-1,1])for(let i=0;i<8;i++){
    const z=36-i*22,x=side*15.4;
    b.tube([vec(x,70,z),vec(x-side*.6,62,z+2),vec(x-side*.8,35,z-1),vec(x,9,z+1)],.11,m.rust,30);
    b.cylinder(.13,.13,2,x,10,z+1,m.iron,10);
  }
  // Irregular rock plinths ground the towers in the water, with small service docks.
  const shoreRocks:ShoreRock[]=[];
  for(const t of specs){
    for(let k=0;k<5;k++){
      const g=new THREE.SphereGeometry(1,30,22),p=g.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=noise(x*7+y*3,z*6+k)*.30;p.setXYZ(i,x*(1+n),y*(1+n*.7),z*(1+n*1.3));}
      g.scale(5+rand()*5,3+rand()*6,6+rand()*5);g.computeVertexNormals();
      const x=t.x+Math.sign(t.x)*(3+rand()*5),y=1+rand()*2,z=t.z-8+k*4;
      shoreRocks.push(rockShoreline(g,x,y,z));b.add(g,m.rock,x,y,z);
    }
  }
  b.flush(scene);
  const sea=createSea(scene,m.waterNormal,mobile,shoreRocks);
  const lights:THREE.PointLight[]=[];
  function light(x:number,y:number,z:number,power:number,distance:number){const l=new THREE.PointLight(0xffc07d,power,distance,2);l.position.set(x,y,z);l.userData.power=power;scene.add(l);lights.push(l);return l;}
  const roomLight=light(-17.42,49.53,17.58,24,9);roomLight.castShadow=true;roomLight.shadow.mapSize.set(512,512);roomLight.shadow.bias=-.0003;roomLight.shadow.normalBias=.015;light(-14.35,50.05,16.97,15,7);light(-14.5,50.3,21.9,13,7);
  light(-13.2,50.0,5.4,17,9);light(4.3,56.5,-3.9,28,11);light(12.8,41,-57,20,8);
  light(14.3,48.1,11,13,8);light(-14.2,60.0,-27,15,8);
  // Warm spill is physically localized; a soft fixture illuminates the walk beneath the soffit.
  const practical=new THREE.SpotLight(0xffcb91,34,12,Math.PI*.36,.68,2);practical.position.set(-14.5,50.2,17.1);practical.target.position.set(-12.3,48,18.5);scene.add(practical,practical.target);
  let lastLOD=0;
  return {obstacles,surfaces,lights,sea:sea.sea,surf:sea.surf,get surfStats(){return sea.stats;},stats:{towers:specs.length,floors:specs.reduce((n,t)=>n+t.floors,0),windows:built.reduce((n,t)=>n+t.windows,0),skybridges:3,viewpoints:6,people:0},
    update(time:number,camera:THREE.Camera){sea.update(time,camera);if(time-lastLOD>.6||time===0){lastLOD=time;built.forEach(t=>{t.props.visible=t.center.distanceTo(camera.position)<(mobile?80:115);});}},
  };
}
