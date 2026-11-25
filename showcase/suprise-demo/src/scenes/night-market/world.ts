import * as THREE from 'three';
import { GeometryBatch,vec } from './geometry';
import { type NightMaterials } from './materials';
import { buildings,toWorld,streetX,streetZ,districtStats } from './district';
import { building } from './buildings';
import { vendor,vendorMaterials } from './vendors';
import { vendingMachine,vendingMaterials,planter,lanternString } from './street-props';
import { createGate,createWetRoad,createSteam } from './atmosphere';
import { umbrella } from './props';
import { bakeStreetBounce } from './lighting';
import { createScooters,type loadScooters } from './scooters';
import { metricUV } from '../../shared/procedural';
import type { Obstacle } from '../../shared/types';

export function buildNightMarket(scene:THREE.Scene,m:NightMaterials,mobile:boolean,scooterAssets:Awaited<ReturnType<typeof loadScooters>>){
  const obstacles:Obstacle[]=[],signMats:THREE.MeshStandardMaterial[]=[],steamSources:THREE.Vector3[]=[];
  const details:{group:THREE.Group;x:number;z:number}[]=[],lightSites:{position:THREE.Vector3;color:THREE.Color;power:number}[]=[];
  const vendorMats=vendorMaterials(),vendingMats=vendingMaterials();
  signMats.push(...vendorMats.map(v=>v.sign),...vendingMats.flatMap(v=>[v.header,v.prices,v.panel]));
  const ground=new GeometryBatch();
  ground.add(metricUV(new THREE.PlaneGeometry(176,154,176,154),2.8),m.asphalt,0,-.025,0,new THREE.Euler(-Math.PI/2,0,0));
  // Kerbs, drainage grates, parking bays, repaired asphalt seams and crosswalks.
  for(const x of streetX)for(let z=-59;z<61;z+=12){
    ground.box(.10,.01,4.3,x,.006,z,m.porcelain);
    for(const side of[-1,1]){
      if(Math.abs(z)%50<7)continue;
      ground.box(.10,.012,6.0,x+side*4.5,.014,z,m.gold);
    }
  }
  for(const z of streetZ)for(let x=-69;x<69;x+=9){
    if(streetX.some(s=>Math.abs(x-s)<6))continue;
    ground.box(4.1,.01,.10,x,.006,z,m.porcelain);
  }
  for(const x of streetX)for(const z of streetZ){
    for(const side of[-1,1])for(let q=-3;q<=3;q++){
      ground.box(.47,.012,2.4,x+q*.77,.013,z+side*5.6,m.porcelain);
      ground.box(2.4,.012,.47,x+side*5.6,.013,z+q*.77,m.porcelain);
    }
    ground.cylinder(.43,.43,.022,x+2.4,.024,z+1.9,m.iron,32);
    ground.torus(.42,.012,x+2.4,.040,z+1.9,m.aluminum);
    for(let q=-3;q<=3;q++)ground.box(.63,.014,.022,x+2.4,.041,z+1.9+q*.09,m.black);
  }
  // The tiny uneven asphalt cracks catch wet highlights without becoming road obstacles.
  for(let i=0;i<28;i++){
    const x=streetX[i%4]+Math.sin(i*2.1)*2,z=-57+i*4.1;
    ground.tube([vec(x,.012,z),vec(x+.3,.012,z+.8),vec(x-.1,.012,z+1.6),vec(x+.25,.012,z+2.3)],.014,m.black,6);
  }
  ground.flush(scene);
  const blocks=Array.from({length:6},()=>new GeometryBatch());
  let stallCount=0,vendingCount=0;
  buildings.forEach(s=>{
    const base=blocks[s.block],detail=new GeometryBatch(),group=new THREE.Group();group.name=`${s.id+1} · ${s.name}`;
    base.at(s.x,s.z,s.angle,()=>detail.at(s.x,s.z,s.angle,()=>building(base,detail,m,s,signMats)));
    const h=3.25+(s.floors-1)*2.95;
    const addCollider=(x:number,z:number,w:number,d:number,height:number,minY=0)=>{
      const p=toWorld(s,x,z),swap=Math.abs(Math.sin(s.angle))>.5;obstacles.push({...p,w:swap?d:w,d:swap?w:d,h:height,minY});
    };
    addCollider(0,0,s.width,s.depth,h+.5,3.05);addCollider(0,-1.9,s.width,.22,3.2);
    for(const x of[-s.width/2+.1,s.width/2-.1])addCollider(x,0,.22,s.depth,3.3);
    if(s.id%9===7)addCollider(0,s.depth/2,s.width-.9,.1,2.8);
    for(const x of[-s.width/2+.3,s.width/2-.3])addCollider(x,s.depth/2+.3,.37,.42,3.4);
    detail.at(s.x,s.z,s.angle,()=>{
      // Continuous sheltered pavement; carts sit outside the arcade circulation strip.
      detail.box(s.width,.13,2.45,0,.005,4.44,m.concrete,.018);
      detail.box(s.width,.13,.11,0,.008,5.66,m.concrete,.012);
      detail.box(s.width,.027,.22,0,.018,5.87,m.iron);
      for(let x=-s.width/2;x<s.width/2;x+=.17)detail.box(.028,.014,.22,x,.038,5.87,m.aluminum);
      const vendorCount=s.id%6===0?3:s.id%6===1?1:2;
      for(let k=0;k<vendorCount;k++){
        const x=vendorCount===2?(k?1:-1)*2.55:(k-(vendorCount-1)/2)*3.22,z=5.12,index=stallCount++;
        detail.at(x,z,0,()=>{
          const result=vendor(detail,m,index,vendorMats);
          if(result.steaming){const p=toWorld(s,x-.5,z);steamSources.push(vec(p.x,1.62,p.z));}
        });
        addCollider(x,z,2.99,1.5,2.15);
      }
      // One individually coloured scooter per building, parked inside the shop setback.
      addCollider(s.width*.37,2.12,1.30,2.20,1.70);
      planter(detail,m,-s.width*.39,2.4,s.id);
      if(s.id%3===0){vendingCount++;detail.at(-s.width*.31,1.6,0,()=>vendingMachine(detail,m,Math.floor(s.id/3),vendingMats));addCollider(-s.width*.31,1.6,1.25,.93,2.2);}
      if(s.id%8===2)umbrella(detail,m,0,5.2,s.id%2);
      for(const x of[-2.5,2.5]){
        detail.sphere(.066,x,2.71,5.5,m.warmBulb);detail.cylinder(.012,.012,.25,x,2.9,5.5,m.black,6);
      }
      detail.tube([vec(-s.width/2,4.4,4.0),vec(0,4.12,4.02),vec(s.width/2,4.4,4.0)],.017,m.black,20);
    });
    const lamp=toWorld(s,0,5.0);lightSites.push({position:vec(lamp.x,2.65,lamp.z),color:new THREE.Color(s.id%4===0?0x8bd7e6:0xffbd85),power:38});
    detail.flush(group);scene.add(group);details.push({group,x:s.x,z:s.z});
  });
  blocks.forEach((b,i)=>{const g=new THREE.Group();g.name=`District ${i+1} architecture`;b.flush(g);scene.add(g);});
  const streets=new GeometryBatch();
  // The central lantern streets retain the compressed, layered composition of the original.
  for(const x of[-20,20])for(const side of[-1,1])for(const z of[-25,25]){
    lanternString(streets,m,[vec(x+side*2.5,5.65,z+20),vec(x+side*2.5,5.0,z),vec(x+side*2.5,5.65,z-20)],13);
  }
  for(const z of[-50,0,50])for(let segment=0;segment<3;segment++){
    const x=[-41,0,41][segment];
    lanternString(streets,m,[vec(x-15,6,z),vec(x,5.2,z),vec(x+15,6,z)],8);
  }
  for(const x of streetX)for(const z of[-40,-20,20,40])for(let q=0;q<3;q++){
    streets.tube([vec(x-5.5,7.7+q*.15,z),vec(x,6.5+q*.15,z+.6),vec(x+5.5,8.0+q*.15,z+.3)],.013+q*.003,m.black,20);
  }
  // Hero gate, photographed from the main lane, with unobstructed passages below.
  streets.at(20,-40,0,()=>createGate(streets,m,0,signMats));
  for(const x of[16.2,23.8])obstacles.push({x,z:-40,w:.72,d:.72,h:7.2});
  obstacles.push({x:20,z:-40,w:10.5,d:3.2,h:9.7,minY:5.7});
  lightSites.push({position:vec(17,5.7,-39),color:new THREE.Color(0xff8b38),power:36},{position:vec(23,5.7,-39),color:new THREE.Color(0xff8b38),power:36});
  // Street lamps, utility cabinets, poles and street-name plaques at the intersections.
  for(const x of streetX)for(const z of streetZ){
    const px=x+4.7,pz=z+4.4;
    streets.cylinder(.09,.14,6.3,px,3.15,pz,m.iron,12);
    streets.tube([vec(px,5.9,pz),vec(px-.35,6.5,pz),vec(px-1.5,6.55,pz)],.05,m.iron,9);
    streets.box(.8,.1,.30,px-1.45,6.51,pz,m.aluminum,.03);streets.box(.65,.018,.22,px-1.45,6.445,pz,m.warmBulb);
    streets.box(.72,1.07,.55,px+.55,.65,pz+.3,m.plasticGreen,.03);
    for(let q=0;q<6;q++)streets.box(.39,.027,.02,px+.55,.9+q*.058,pz+.585,m.iron);
    obstacles.push({x:px,z:pz,w:.32,d:.32,h:6.4},{x:px+.55,z:pz+.3,w:.75,d:.58,h:1.2});
    lightSites.push({position:vec(px-1.45,6.1,pz),color:new THREE.Color(0xffd3a0),power:55});
  }
  // Low seating and planting in the two open courtyard entrances.
  for(const [x,z]of[[-41,-25],[0,25]]){
    streets.box(11,.16,19,x,.025,z,m.concrete);
    for(const side of[-1,1]){
      streets.box(3.3,.13,.64,x+side*3.3,.62,z,m.bamboo,.035);
      for(const dx of[-1.35,1.35])streets.box(.12,.53,.43,x+side*3.3+dx,.30,z,m.iron);
      obstacles.push({x:x+side*3.3,z,w:3.3,d:.7,h:.72});
      planter(streets,m,x+side*4,z-4,1);planter(streets,m,x+side*4,z+4,0);
    }
  }
  streets.flush(scene);
  // A constant-size pool avoids compiling a shader with dozens of neighbourhood lights.
  const lights=Array.from({length:mobile?8:14},()=>{const l=new THREE.PointLight(0xffbd85,38,14,2);scene.add(l);return l;});
  const bounce=bakeStreetBounce(scene,lightSites);
  // Shared instance geometry must not receive the world-space per-vertex bounce bake.
  const scooters=createScooters(scene,scooterAssets,mobile);
  const wet=createWetRoad(scene,m,mobile),steam=createSteam(scene,steamSources,mobile);
  let tick=0;
  const position=new THREE.Vector3(20,1.76,34);
  const update=(time:number,camera?:THREE.Camera)=>{
    wet.material.uniforms.uTime.value=time;steam.update(time);
    if(camera)position.copy(camera.position);
    if(tick++%12===0||!camera){
      scooters.update(position);
      const nearest=lightSites.map(site=>({site,d:site.position.distanceToSquared(position)})).sort((a,b)=>a.d-b.d);
      lights.forEach((light,i)=>{const site=nearest[i].site;light.position.copy(site.position);light.color.copy(site.color);light.userData.power=site.power;});
      // Fine props are spatially culled. Full architecture and lanterns stay visible at all distances.
      const range=position.y>18?Infinity:mobile?48:63;
      wet.visible=position.y<30;
      details.forEach(({group,x,z})=>group.visible=Math.hypot(position.x-x,position.z-z)<range);
    }
  };
  update(0);
  return {scooterMaterials:scooters.materials,obstacles,lights,signMats,wet,steam,bounce,stats:{...districtStats,scooterModel:'pink-scooter',scooterColors:scooters.counts,stalls:stallCount,vendingMachines:vendingCount},update};
}
