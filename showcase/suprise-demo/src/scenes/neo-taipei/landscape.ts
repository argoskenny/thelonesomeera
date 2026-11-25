import * as T from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import { metricUV,noise } from '../../shared/procedural';
import type { Materials } from './materials';
export type Island={x:number;z:number;y:number;rx:number;rz:number};
export const islands:Island[]=[{x:135,z:-300,y:130,rx:105,rz:70},{x:170,z:-110,y:50,rx:58,rz:42},{x:172,z:-42,y:30,rx:39,rz:30}];
export function islandHeight(c:Island,x:number,z:number){const a=Math.atan2((z-c.z)/c.rz,(x-c.x)/c.rx),r=Math.hypot((x-c.x)/c.rx,(z-c.z)/c.rz)/(1+.055*Math.sin(a*7)+.025*Math.sin(a*19));return Math.max(0,Math.min(c.y-.6,c.y*Math.pow(T.MathUtils.clamp((1.13-r)/.31,0,1),.55)+(noise(x*.14,z*.15)-.5)*Math.min(7,c.y*.1)*Math.min(1,r/.6)));}
export function buildLandscape(root:T.Object3D,b:GeometryBatch,m:Materials,mobile:boolean){
 for(const c of islands){const p:number[]=[],uv:number[]=[],idx:number[]=[],nr=45,na=112;
 for(let ir=0;ir<=nr;ir++)for(let ia=0;ia<=na;ia++){const a=ia/na*Math.PI*2,r=ir/nr*1.17,shape=1+.055*Math.sin(a*7)+.025*Math.sin(a*19),x=c.x+Math.cos(a)*r*c.rx*shape,z=c.z+Math.sin(a)*r*c.rz*shape;p.push(x,islandHeight(c,x,z),z);uv.push(x/14,z/14);if(ir&&ia){const k=ir*(na+1)+ia;idx.push(k,k-1,k-na-1,k-1,k-na-2,k-na-1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();metricUV(g,15);b.add(g,m.rock);
 const rand=seededRandom(c.x*11);for(let i=0;i<70;i++){const a=rand()*Math.PI*2,r=.84+rand()*.22,x=c.x+Math.cos(a)*r*c.rx,z=c.z+Math.sin(a)*r*c.rz,y=islandHeight(c,x,z);const crag=new T.IcosahedronGeometry(2+rand()*3,1);crag.scale(1.3,2.3,.8);metricUV(crag,8);b.add(crag,i%5===0?m.moss:m.rock,x,y-1,z,new T.Euler(rand()*.3,rand()*3,rand()*.2));}}
 b.box(42,1,24,165,49.5,-110,m.concrete);b.box(42,.05,24,165,50,-110,m.floor);
 for(let x=145;x<=185;x+=3){b.box(.12,1.2,.12,x,50.6,-98,m.steel);b.box(.12,1.2,.12,x,50.6,-122,m.steel);}for(const z of[-98,-122]){b.box(42,.1,.12,165,51.2,z,m.steel);b.box(42,.045,.08,165,50.4,z,m.pink);}
 // Low pavilion nestled in the flowering garden.
 b.box(12,.7,10,177,50.3,-113,m.iron);for(const x of[171,183])for(const z of[-118,-108])b.box(.25,5,.25,x,52.5,z,m.steel);b.box(15,.6,13,177,55.2,-113,m.iron);b.box(15,.08,.08,177,55,-106.5,m.pink);
 const trees=[vec(-39.5,60,59),vec(-39.5,60,88),vec(149,50,-117),vec(180,50,-117),vec(183,50,-101),vec(146,50,-101)];
 for(const c of islands.slice(1))for(let i=0;i<9;i++){const a=i*2.4,r=.58+Math.sin(i*2.6)*.16,x=c.x+Math.cos(a)*c.rx*r,z=c.z+Math.sin(a)*c.rz*r;trees.push(vec(x,islandHeight(c,x,z),z));}
 const total=trees.length*(mobile?240:520),flowers=new T.InstancedMesh(new T.PlaneGeometry(1,1),m.flowers,total),dummy=new T.Object3D(),rand=seededRandom(2090);let n=0;
 trees.forEach((p,i)=>{const scale=i<2?.58:1.2+rand()*.4;const twigs:T.Vector3[]=[];
 const trunkTop=p.clone().add(vec(.15,2.1*scale,0));b.cylinder(.11*scale,.24*scale,2.1*scale,p.x+.07,p.y+1.05*scale,p.z,m.wood,10);
 for(let j=0;j<7;j++){const a=j*2.4,tip=p.clone().add(vec(Math.cos(a)*2.8*scale,(3+rand()*1.9)*scale,Math.sin(a)*2.8*scale));
 const curve=new T.CatmullRomCurve3([p.clone().add(vec(.05,1.3*scale,0)),trunkTop,tip.clone().add(vec(0,-.6*scale,0)),tip]);
 const branch=new T.TubeGeometry(curve,14,.13*scale,6,false),positions=branch.getAttribute('position'),uv=branch.getAttribute('uv');
 for(let v=0;v<positions.count;v++){const t=uv.getX(v),center=curve.getPointAt(t),q=vec(positions.getX(v),positions.getY(v),positions.getZ(v)).sub(center).multiplyScalar(1-t*.88).add(center);positions.setXYZ(v,q.x,q.y,q.z);}branch.computeVertexNormals();b.add(branch,m.wood);
 for(let k=0;k<12;k++){const aa=k*2.4,reach=(.5+rand()*.95)*scale,end=tip.clone().add(vec(Math.cos(aa)*reach,(rand()-.35)*1.1*scale,Math.sin(aa)*reach));b.tube([tip.clone().add(vec(0,-.4*scale,0)),tip.clone().lerp(end,.45).add(vec(0,-.1*scale,0)),end],.018*scale,m.wood,5);twigs.push(end);}}
 for(let j=0;j<(mobile?240:520);j++){const tip=twigs[j%twigs.length],a=rand()*Math.PI*2,r=Math.sqrt(rand())*.32*scale;dummy.position.copy(tip).add(vec(Math.cos(a)*r,(rand()-.5)*.55*scale,Math.sin(a)*r));dummy.rotation.set(rand()*Math.PI,rand()*Math.PI,rand()*Math.PI);dummy.scale.setScalar((.25+rand()*.35)*scale);dummy.updateMatrix();flowers.setMatrixAt(n++,dummy.matrix);flowers.setColorAt(n-1,new T.Color().setHSL(.9+rand()*.08,.25,.55+rand()*.3));}});

 flowers.castShadow=false;flowers.receiveShadow=true;root.add(flowers);return trees.length;
}
