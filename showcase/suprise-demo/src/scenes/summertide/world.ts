import * as T from 'three';
import { GeometryBatch,seededRandom,vec } from '../../shared/geometry';
import { metricUV } from '../../shared/procedural';
import type { Obstacle,WalkSurface } from '../../shared/types';
import type { Materials } from './materials';
import { shoreX,terrainHeight,playableHeight,roadHeight } from './layout';
import { buildTerrain } from './terrain';
import { house,car } from './buildings';
import { vegetation } from './vegetation';

export function buildWorld(scene:T.Scene,m:Materials,mobile:boolean){
  const root=new T.Group();root.name='SUMMERTIDE · summer coastal town';scene.add(root);
  const terrain=buildTerrain(root,m),obstacles:Obstacle[]=[...terrain.obstacles],r=seededRandom(8128);
  const surfaces:WalkSurface[]=[{x:-300,z:-185,w:1600,d:850,y:0,heightAt:playableHeight}];
  let houses=0,cars=0,poles=0;
  const b=new GeometryBatch(true),details=new GeometryBatch(true);
  const cafeZ=-61,cafeX=shoreX(cafeZ)+55,cafeY=terrainHeight(cafeX,cafeZ);
  const place=(x:number,z:number,w:number,d:number,floors:number,variant:number,detail:boolean)=>{
    const base=Math.max(...[-1,1].flatMap(sx=>[-1,1].map(sz=>terrainHeight(x+sx*w/2,z+sz*d/2))));
    house(detail?details:b,m,x,base,z,w,d,floors,variant,detail);houses++;
    obstacles.push({x,z,w:w+.3,d:d+.3,minY:base-8,h:base+floors*3.15+2});
  };
  // A close, individually detailed row opens towards the downhill road.
  for(let z=-9,i=0;z<210;z+=18,i++)place(16+(i%3)*2,z,9+r()*2,11+r()*2,2+i%2,i,true);
  for(let z=-570,i=0;z<94;z+=19,i++){
    for(let row=0;row<7;row++){
      const x=shoreX(z)+52+row*18+(r()-.5)*5,zz=z+(r()-.5)*5;
      if(Math.abs(x-cafeX)<13&&Math.abs(zz-cafeZ)<17||Math.abs(x)<15&&zz> -45||Math.abs(zz+32)<18||Math.abs(x-17)<16&&zz> -23)continue;
      place(x,zz,7+r()*5,8+r()*5,1+Math.floor(r()*3)+(row===2&&i%9===0?3:0),Math.floor(r()*90),z> -130);
    }
  }
  // Waterfront café terrace, readable shop sign and open seating facing the bay.
  place(cafeX,cafeZ,10,10,1,18,true);
  details.box(10,.15,6,cafeX,cafeY+.12,cafeZ+8,m.concrete);
  for(const zz of[-2,2]){details.cylinder(.65,.65,.1,cafeX,cafeY+.9,cafeZ+8+zz,m.white,20);details.cylinder(.05,.08,.85,cafeX,cafeY+.45,cafeZ+8+zz,m.metal,8);for(const sx of[-1,1]){details.box(.55,.07,.55,cafeX+sx,cafeY+.48,cafeZ+8+zz,m.wood);details.box(.06,.8,.55,cafeX+sx*1.24,cafeY+.7,cafeZ+8+zz,m.wood);}}
  const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=256;const ctx=signCanvas.getContext('2d')!;ctx.fillStyle='#e8e3cb';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#264953';ctx.textAlign='center';ctx.font='64px serif';ctx.fillText('海 風 喫 茶',512,111);ctx.font='23px sans-serif';ctx.fillText('COFFEE  /  COLD BREW  /  SEA VIEW',512,181);
  const signMap=new T.CanvasTexture(signCanvas);signMap.colorSpace=T.SRGBColorSpace;const signMat=new T.MeshStandardMaterial({map:signMap,roughness:.8});details.plane(4.5,.85,cafeX,cafeY+2.9,cafeZ+5.08,signMat);
  // Utility infrastructure follows the road grade; wires sag between real pole tops.
  const poleSites:T.Vector3[]=[];
  for(let z=-16;z<230;z+=26){const x=6.15,y=roadHeight(z);poles++;poleSites.push(vec(x,y+9.8,z));details.cylinder(.13,.23,10.5,x,y+5.25,z,m.concrete,12);
    for(const yy of[8.4,9.7]){details.box(2.5,.12,.14,x,y+yy,z,m.metal);for(const dx of[-1.05,0,1.05]){details.cylinder(.06,.06,.32,x+dx,y+yy+.18,z,m.white,8);for(let i=0;i<3;i++)details.torus(.08,.025,x+dx,y+yy+.06+i*.08,z,m.white,new T.Euler(Math.PI/2,0,0),8);}}
    details.cylinder(.32,.32,.85,x+.45,y+7.3,z,m.metal,16);details.box(.3,.65,.25,x,y+2.2,z+.25,m.dark);details.tube([vec(x,y+8,z),vec(x-.4,y+8.5,z),vec(x-2.3,y+8.5,z)],.04,m.metal,8);details.box(.65,.12,.3,x-2.3,y+8.4,z,m.white);
    obstacles.push({x,z,w:.45,d:.45,minY:y,h:y+10.5});
  }
  for(let i=1;i<poleSites.length;i++)for(const dx of[-1.05,0,1.05]){const a=poleSites[i-1].clone().add(vec(dx,0,0)),c=poleSites[i].clone().add(vec(dx,0,0)),mid=a.clone().lerp(c,.5).add(vec(0,-1.7,0));details.tube([a,mid,c],.022,m.dark,20);}
  for(let z=-550;z<200;z+=38){const x=shoreX(z)+43;details.cylinder(.075,.13,6.7,x,7.4,z,m.metal,8);details.tube([vec(x,10.4,z),vec(x-1,11.2,z),vec(x-2,10.9,z)],.055,m.metal,8);details.box(.7,.1,.28,x-2,10.85,z,m.white);}
  // Road signs, benches, bins and parked compact cars provide a human scale.
  for(const z of[135,30]){const x=5.7,y=roadHeight(z);details.cylinder(.035,.035,3,x,y+1.5,z,m.metal,8);details.cylinder(.36,.36,.06,x,y+2.8,z,m.white,32,new T.Euler(Math.PI/2,0,0));details.torus(.31,.035,x,y+2.8,z+.04,m.roofs[0],new T.Euler(),32);}
  for(const z of[98,3]){car(details,m,2.8,roadHeight(z)+.1,z,Math.PI,0);cars++;}
  for(let z=-510;z<100;z+=43){const x=shoreX(z)+39;car(details,m,x,4.1,z,-Math.atan(-.0027*(z-80)),cars++);}
  for(let z=-400;z<160;z+=38){const x=shoreX(z)+26;for(let i=0;i<5;i++)details.box(2.3,.06,.1,x,4.62,z+(i-2)*.12,m.wood);for(const sx of[-1,1])details.box(.08,.55,.6,x+sx*.9,4.35,z,m.metal);details.box(2.3,.5,.08,x,4.95,z+.34,m.wood);details.cylinder(.26,.24,.9,x,4.55,z+2.5,m.metal,12);}
  // A timber lookout extends over the breaking surf.
  const pz=-150,px=shoreX(pz)+4;
  details.box(45,.3,5,px,4,pz,m.wood);surfaces.push({x:px,z:pz,w:45,d:5,y:4.15});
  for(let x=px-22;x<px+22;x+=2.5){for(const s of[-1,1]){details.cylinder(.12,.19,6,x,1.2,pz+s*2.2,m.wood,8);details.cylinder(.055,.055,1.1,x,4.7,pz+s*2.2,m.white,8);}details.box(.06,.02,4.7,x,4.16,pz,m.dark);}
  for(const s of[-1,1]){details.box(44, .08,.08,px,5.22,pz+s*2.2,m.white);obstacles.push({x:px,z:pz+s*2.2,w:44,d:.12,minY:4,h:5.3});}
  details.box(.1,1,4.5,px-22.4,4.7,pz,m.white);obstacles.push({x:px-22.4,z:pz,w:.1,d:4.5,minY:4,h:5.3});
  // Dark shore rocks, small pebbles and the distant wooded headland.
  for(let i=0;i<85;i++){const z=-640+r()*850,x=shoreX(z)-3+r()*15,s=.5+r()*2.5;const g=new T.IcosahedronGeometry(s,3);const rp=g.attributes.position;for(let j=0;j<rp.count;j++){const q=1+.11*Math.sin(rp.getX(j)*4)*Math.cos(rp.getY(j)*3+rp.getZ(j)*2);rp.setXYZ(j,rp.getX(j)*q,rp.getY(j)*q,rp.getZ(j)*q);}g.scale(1,.6+r()*.5,1.1);g.computeVertexNormals();details.add(metricUV(g,3),m.rock,x,-.4,z,new T.Euler(r(),r(),r()));}
  b.flush(root);details.flush(root);
  const leaves=vegetation(root,m,mobile,obstacles);
  let triangles=0;root.traverse(o=>{if(o instanceof T.Mesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof T.InstancedMesh?o.count:1);});
  return {root,obstacles,surfaces,stats:{houses,cars,poles,leaves,triangles}};
}
