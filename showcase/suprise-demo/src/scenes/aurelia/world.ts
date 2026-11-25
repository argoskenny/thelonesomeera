import * as T from 'three';
import { GeometryBatch,seededRandom,vec } from '../../shared/geometry';
import { metricUV } from '../../shared/procedural';
import type { Obstacle,WalkSurface } from '../../shared/types';
import type { Materials } from './materials';
import { column,railing,archRing,cornice,urn,palazzo,cathedral,campanile,gothicHall } from './architecture';
import { table,lantern,bannerMesh,armillary } from './props';
import { createGardens } from './gardens';
import { buildLandscape } from './landscape';
import { stairFlight,openSpans } from './paths';
export function buildCity(scene:T.Scene,m:Materials,mobile:boolean){
  const root=new T.Group();root.name='AURELIA · Renaissance citadel';scene.add(root);buildLandscape(root,m);
  const b=new GeometryBatch(true),decor=new GeometryBatch(true),gardens=createGardens(m,mobile),r=seededRandom(284);
  const obstacles:Obstacle[]=[],surfaces:WalkSurface[]=[],flags:ReturnType<typeof bannerMesh>[]=[],lights:T.PointLight[]=[];
  let buildings=0,towers=0,bridges=0;
  function deck(x:number,z:number,w:number,d:number,y:number){b.box(w,1.5,d,x,y-.82,z,m.stone);b.box(w,.12,d,x,y-.06,z,m.floor);cornice(b,m,w,d,x,y-1.5,z,false);surfaces.push({x,z,w,d,y});}
  function rail(x1:number,z1:number,x2:number,z2:number,y:number){railing(b,m,x1,z1,x2,z2,y);obstacles.push({x:(x1+x2)/2,z:(z1+z2)/2,w:Math.max(.4,Math.abs(x2-x1)),d:Math.max(.4,Math.abs(z2-z1)),minY:y,h:y+1.35});}
  function flag(x:number,y:number,z:number,w:number,h:number,rotation=0){const f=bannerMesh(m,w,h);f.mesh.position.set(x,y-h/2,z);f.mesh.rotation.y=rotation;root.add(f.mesh);flags.push(f);decor.beam(vec(x-Math.cos(rotation)*(w/2+.18),y+.05,z+Math.sin(rotation)*(w/2+.18)),vec(x+Math.cos(rotation)*(w/2+.18),y+.05,z-Math.sin(rotation)*(w/2+.18)),.045,.045,m.gold);}
  function building(x:number,z:number,w:number,d:number,y:number,floors:number,index=0,detail=false){palazzo(b,m,x,y,z,w,d,floors,index,detail);buildings++;obstacles.push({x,z,w:w+.6,d:d+.6,minY:y-3,h:y+floors*5.1+4});if(detail){flag(x,y+floors*5.1-1,z+d/2+.7,1.6,4.5);gardens.ivy(x-w*.25,y+5.2,z+d/2+.7,3.5,2.5);}}
  // Main piazza and the shaded arrival terrace.
  deck(-30,2,108,104,25);deck(-25,82,34,40,46);deck(-40,56,10,12,46);
  for(const [a,c]of openSpans(-42,-8,[[-20,-13]]))rail(a,62,c,62,46);
  rail(-8,62,-8,102,46);rail(-42,102,-8,102,46);rail(-42,62,-42,102,46);
  for(const x of[-40,-24,-10]){b.box(1.2,21,1.2,x,35.5,65,m.base);b.box(1.2,21,1.2,x,35.5,99,m.base);}
  // Corinthian colonnade, coffered vault and open arches at eye level.
  for(const z of[54,66,78,90,102]){
    column(b,m,-37,46,z,10,.61);obstacles.push({x:-37,z,w:1.7,d:1.7,minY:46,h:57});
    column(b,m,-43,46,z,10,.48);
    if(z<102){b.at(-37,z+6,Math.PI/2,()=>archRing(b,m,5.5,.7,.75,0,51.4,0));}
    lantern(decor,m,-41,52.5,z+1,.55);
    if(z===78||z===90){const light=new T.PointLight(0xffbd72,12,13,2);light.position.set(-40,52,z+1);scene.add(light);lights.push(light);}
  }
  b.box(8,.65,54,-40,56.4,77,m.stone);for(let z=52;z<103;z+=2)for(let x=-43;x< -36;x+=2){b.box(1.6,.13,1.6,x,56.03,z,m.trim);b.box(1.15,.14,1.15,x,55.99,z,m.base);}
  b.box(1.2,11,54,-45,51.5,77,m.stone);flag(-36.25,55.2,79.5,1.6,5.6,Math.PI/2);
  for(const z of[54,66,78,90]){gardens.ivy(-36.8,55.7,z,8,2.4);gardens.bush(-36.7,46,z,1,1.1,220,true);}
  flag(-36.4,55.8,59.5,2,7);lantern(decor,m,-38,52.5,57,.5);
  table(decor,m,-33.8,46,63.5);obstacles.push({x:-33.8,z:63.5,w:3,d:3,minY:46,h:49});
  for(const x of[-24,-11]){urn(decor,m,x,46,63.2,1.05);gardens.bush(x,47.1,63.2,1.4,.75,800,true);gardens.ivy(x,47.2,61.8,4,2.4);}
  for(const z of[68,81,95]){urn(decor,m,-9,46,z,.85);gardens.bush(-9,47,z,1.2,.85,600,true);}
  gardens.ivy(-37,56,86,5,5);gardens.bush(-39,56,87,4,1.3,1700,true);
  // A 70-tread stair connects the upper loggia with the lower city.
  b.beam(vec(-16.5,45.4,62),vec(-16.5,24.4,23.5),7,.65,m.stone);
  const stairs=stairFlight(46,25,62,23.5,7,-16.5);for(const s of stairs){b.box(s.w,.32,s.d,s.x,s.y-.16,s.z,m.trim);surfaces.push(s);}
  for(const side of[-1,1]){const xx=-16.5+side*3.5;b.beam(vec(xx,47.1,62),vec(xx,26.1,23.5),.12,.12,m.bronze);for(let z=24;z<62;z+=1){const y=25+(z-23.5)/38.5*21;b.cylinder(.025,.025,1,xx,y+.5,z,m.bronze,6);obstacles.push({x:xx,z,w:.12,d:1.05,minY:y-.4,h:y+1.2});}}
  // The piazza wraps around the cathedral and an open arcaded market square.
  cathedral(b,m,-65,25,-30);buildings++;obstacles.push({x:-65,z:-30,w:34,d:50,minY:24,h:120});
  building(-12,-29,22,18,25,3,0,true);building(-4,-62,19,17,25,3,1,true);building(17,-36,15,15,25,2,2,true);building(-78,34,18,17,25,3,3,true);
  building(-48,35,16,14,25,2,2,true);building(-4,6,14,16,25,2,1,true);building(13,26,12,15,25,3,0,true);
  deck(-104,8,29,49,25);building(-104,-4,16,14,25,3,3,true);building(-104,22,17,14,25,2,2,true);
  for(const x of[-43,-37,-31]){column(b,m,x,25,-9,6,.35);archRing(b,m,2.5,.35,.6,x+3,28.1,-9);}
  for(const p of[[-12,42],[1,43]]){
    const [x,z]=p;for(const sx of[-1,1])for(const sz of[-1,1])b.cylinder(.04,.04,3.7,x+sx*3,26.85,z+sz*2,m.wood,8);
    const sail=new T.PlaneGeometry(6.5,4.5,12,12),pos=sail.attributes.position;for(let i=0;i<pos.count;i++){const xx=pos.getX(i),zz=pos.getY(i);pos.setXYZ(i,xx,29.1-.65*(1-Math.abs(xx)/3.25)+Math.sin(zz*2)*.06,zz);}sail.computeVertexNormals();b.add(sail,m.sail,x,0,z);
    b.box(5.6,.18,1.2,x,26.1,z,m.wood);for(let j=0;j<9;j++){b.cylinder(.18,.24,.32,x-2.2+j*.55,26.35,z,m.roof,12);gardens.bush(x-2.2+j*.55,26.55,z,.26,.32,18,true);}obstacles.push({x,z,w:5.6,d:1.2,minY:25,h:26.5});
  }
  // A shallow armillary fountain marks the lower arrival court.
  b.cylinder(4.5,4.7,.5,-20,25.25,11,m.trim,64);b.cylinder(4.1,4.1,.06,-20,25.54,11,m.water,64);b.torus(4.35,.15,-20,25.6,11,m.trim,new T.Euler(Math.PI/2,0,0),64);armillary(decor,m,-20,25.6,11,1.8);obstacles.push({x:-20,z:11,w:9,d:9,minY:25,h:31});
  for(const z of[-8,33,49])for(const x of[18,-52]){urn(decor,m,x,25,z,.8);gardens.cypress(x,26,z,6);}
  // True arch openings below the bridge; both banks are walkable.
  function bridge(x0:number,x1:number,z:number,y:number,width:number,spans:number){
    bridges++;const length=x1-x0,step=length/spans;deck((x0+x1)/2,z,length,width,y);rail(x0,z-width/2,x1,z-width/2,y);rail(x0,z+width/2,x1,z+width/2,y);
    for(let j=0;j<=spans;j++){const x=x0+j*step;b.box(3.1,y+95,width-1,x,(y-95)/2,z,m.base);for(let yy=-65;yy<y;yy+=18)cornice(b,m,3.2,width-1,x,yy,z,false);urn(decor,m,x,y,z+width/2,.7);}
    for(let j=0;j<spans;j++){
      const radius=step/2-1.55,s=new T.Shape();s.moveTo(-step/2,0);s.lineTo(-radius,0);s.absarc(0,0,radius,Math.PI,0,true);s.lineTo(step/2,0);s.lineTo(step/2,radius+1.8);s.lineTo(-step/2,radius+1.8);s.closePath();
      const baseY=y-radius-2.5,g=new T.ExtrudeGeometry(s,{depth:width-.4,bevelEnabled:false,curveSegments:28});b.add(metricUV(g,3.8),m.stone,x0+(j+.5)*step,baseY,z-width/2+.2);archRing(b,m,radius,.5,.45,x0+(j+.5)*step,baseY,z+width/2);
      if(j%2===0)flag(x0+(j+.5)*step,y-.6,z+width/2+.4,2.3,8);
    }
  }
  bridge(24,149,-7,25,9,4);deck(157,-7,26,30,25);rail(170,-22,170,8,25);rail(145,8,170,8,25);rail(145,-22,170,-22,25);
  for(const z of[-18,4]){urn(decor,m,162,25,z,1);gardens.bush(162,26.2,z,1.5,1.2,400,true);}
  // High citadel with a walkable courtyard and multiple layers of spires.
  deck(92,-166,116,94,118);rail(34,-119,150,-119,118);rail(34,-213,34,-119,118);rail(150,-213,150,-119,118);
  gothicHall(b,m,95,118,-173,40,44);buildings++;obstacles.push({x:95,z:-173,w:42,d:46,minY:118,h:174});
  for(const [x,z,h,w]of[[68,-145,53,8],[122,-145,61,8],[67,-197,66,9],[124,-198,74,9],[95,-183,101,12]]){campanile(b,m,x,118,z,h,w,true);towers++;obstacles.push({x,z,w:w+1,d:w+1,minY:118,h:118+h+18});}
  for(let i=0;i<12;i++){const a=i*Math.PI*2/12,x=92+Math.cos(a)*54,z=-166+Math.sin(a)*44;campanile(b,m,x,118,z,22+(i%3)*6,4.2,true);towers++;obstacles.push({x,z,w:5,d:5,minY:118,h:162});}
  // Ramparts and perpendicular flying buttresses give the citadel a broken silhouette.
  for(const x of[43,141]){b.box(2,15,80,x,125.5,-169,m.stone);obstacles.push({x,z:-169,w:2,d:80,minY:118,h:134});for(let z=-206;z< -132;z+=5){b.box(2.6,1.3,2,x,133.4,z,m.trim);b.beam(vec(x,138,z),vec(x+(x<90?-6:6),118,z),1,1.2,m.trim);}}
  for(const z of[-205,-126]){b.box(90,10,2,92,123,z,m.stone);obstacles.push({x:92,z,w:90,d:2,minY:118,h:130});for(let x=49;x<137;x+=5)b.box(2,1.3,2.5,x,128.6,z,m.trim);}
  for(let i=0;i<5;i++){const x=52+i*20;gardens.cypress(x,118,-123,7);gardens.ivy(x,118,-118,14,4);}
  flag(95,150,-149.5,3.5,11);flag(68,157,-140.5,2,8);flag(122,163,-140.5,2,8);
  // Cloister terraces and gardens break up the height below the upper rampart.
  for(const [x,z,y,w]of[[43,-104,83,27],[126,-114,92,26]]){
    deck(x,z,w,12,y);rail(x-w/2,z+6,x+w/2,z+6,y);
    for(let px=x-w/2;px<x+w/2;px+=5){column(b,m,px,y-18,z+5,18,.36);archRing(b,m,2.1,.4,.6,px+2.5,y-4,z+5);gardens.cypress(px,y,z-1,5);}
    gardens.ivy(x,y,z+6,12,w*.7);building(x,z-6,w*.65,9,y,1,1,false);
  }
  for(let i=0;i<14;i++){
    const a=.2+i/13*(Math.PI-.4),x=92+Math.cos(a)*78,z=-174+Math.sin(a)*64;
    gardens.bush(x,116,z,5.5,3.5,1400);gardens.ivy(x,116,z+1,14,5,false);
  }
  // Surrounding terraces and towns extend the setting beyond the foreground route.
  deck(-126,-139,80,57,49);deck(15,-117,70,40,65);
  // Retaining masonry anchors the upper village in the actual cliff face.
  
  for(let row=0;row<3;row++)for(let col=0;col<5;col++){
    const x=-156+col*15,z=-157+row*19;building(x,z,10+r()*3,12,49,2+Math.floor(r()*2),row*5+col,false);
  }
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){
    const x=-10+col*16,z=-128+row*21;building(x,z,11,13,65,2+Math.floor(r()*2),col+row,false);
  }
  // Aqueduct to the upper terrace, supported by full-height stone piers.
  bridge(-87,-20,-115,65,6,3);b.box(10,17,9,-87,56.5,-115,m.stone);
  for(const [x,z,y]of[[-160,-154,49],[15,-117,65],[198,-247,92]]){campanile(b,m,x,y,z,35,4.5);towers++;}
  // A small levitating observatory can also be reached in free flight.
  const isle=new T.IcosahedronGeometry(1,3),ip=isle.attributes.position;
  for(let i=0;i<ip.count;i++){const t=(ip.getY(i)+1)/2,k=.4+t*.6;ip.setXYZ(i,ip.getX(i)*22*k,ip.getY(i)*30,ip.getZ(i)*19*k);}
  isle.computeVertexNormals();b.add(metricUV(isle,8),m.rock,267,157,-310);deck(267,-310,26,21,185);
  building(262,-313,12,10,185,2,1);campanile(b,m,275,185,-310,28,4,true);towers++;gardens.cypress(258,185,-304,7);gardens.ivy(265,185,-299,12,15);
  // Grove, ivy and flowering terraces; all leaves and petals are lit 3D instances.
  for(let i=0;i<65;i++){const x=-115+r()*145,z=-78+r()*125;if(Math.hypot((x+42)/89,(z-16)/88)>.89||obstacles.some(o=>Math.abs(x-o.x)<o.w/2+2&&Math.abs(z-o.z)<o.d/2+2)||Math.abs(x+16.5)<5&&z>20)continue;gardens.tree(x,25,z,4+r()*3);}
  for(let i=0;i<75;i++){const a=r()*Math.PI*2;const x=92+Math.cos(a)*75,z=-174+Math.sin(a)*57;gardens.cypress(x,116,z,6+r()*4);if(i%3===0)gardens.tree(x,116,z,5+r()*5);}
  gardens.ivy(-60,25,54,20,16);gardens.ivy(12,25,54,13,8);gardens.ivy(165,25,27,12,8);
  b.flush(root);decor.flush(root);const gardenStats=gardens.flush(root);
  let triangles=0;root.traverse(o=>{if(o instanceof T.Mesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof T.InstancedMesh?o.count:1);});
  return {root,obstacles,surfaces,lights,stats:{buildings,towers,bridges,...gardenStats,triangles},update(t:number,mood:number){flags.forEach(f=>f.update(t));lights.forEach(l=>l.intensity=12+mood*20);m.lamp.emissiveIntensity=2.4+mood*2;m.glass.emissiveIntensity=.04+mood*.9;}};
}
