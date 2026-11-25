import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import { metricUV } from '../../shared/procedural';
import type { Materials } from './materials';

// Reusable sculpted profiles, actual openings and mouldings at metre scale.
const baluster=new T.LatheGeometry([[.15,0],[.16,.08],[.09,.14],[.07,.23],[.14,.42],[.12,.55],[.06,.66],[.06,.78],[.12,.82]].map(p=>new T.Vector2(...p as [number,number])),8);
export function column(b:GeometryBatch,m:Materials,x:number,y:number,z:number,h:number,r=.46){
  b.box(r*2.9,.28,r*2.9,x,y+.14,z,m.trim);
  b.cylinder(r*1.33,r*1.4,.2,x,y+.38,z,m.trim,16);
  b.torus(r*1.14,.08,x,y+.53,z,m.trim);
  const profile=[[r*1.04,.58],[r*.95,.72],[r*.9,h*.25],[r*.82,h-.65],[r*1.08,h-.52],[r*1.2,h-.28]];
  const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p as [number,number])),32);
  const pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){const angle=Math.atan2(pos.getX(i),pos.getZ(i)),f=1-.038*(.5+.5*Math.cos(angle*16));pos.setX(i,pos.getX(i)*f);pos.setZ(i,pos.getZ(i)*f);}
  g.computeVertexNormals();b.add(metricUV(g,3.8),m.stone,x,y,z);
  b.box(r*3,.22,r*3,x,y+h-.11,z,m.trim);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;b.torus(r*.32,.065,x+Math.sin(a)*r,y+h-.4,z+Math.cos(a)*r,m.trim,new T.Euler(Math.PI/2,0,a),10);}
}
export function railing(b:GeometryBatch,m:Materials,x1:number,z1:number,x2:number,z2:number,y:number){
  const length=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.ceil(length/.68));
  b.beam(vec(x1,y+.12,z1),vec(x2,y+.12,z2),.25,.42,m.trim);
  b.beam(vec(x1,y+1.09,z1),vec(x2,y+1.09,z2),.18,.48,m.trim);
  for(let i=0;i<=n;i++){const t=i/n,x=T.MathUtils.lerp(x1,x2,t),z=T.MathUtils.lerp(z1,z2,t);
    if(i%7===0||i===n){b.box(.52,1.1,.52,x,y+.55,z,m.stone);b.box(.68,.14,.68,x,y+1.16,z,m.trim);}
    else b.add(baluster.clone(),m.trim,x,y+.2,z);
  }
}
export function cornice(b:GeometryBatch,m:Materials,w:number,d:number,x:number,y:number,z:number,detail=true){
  [[.1,.28],[.5,.18],[.75,.23],[.95,.13]].forEach(([out,h],i)=>b.box(w+out,h,d+out,x,y+i*.2,z,m.trim));
  if(detail){for(let px=-w/2+.4;px<w/2;px+=.8){b.box(.23,.32,.33,x+px,y-.25,z+d/2+.08,m.trim);b.box(.23,.32,.33,x+px,y-.25,z-d/2-.08,m.trim);}for(let pz=-d/2+.4;pz<d/2;pz+=.8){b.box(.33,.32,.23,x+w/2+.08,y-.25,z+pz,m.trim);b.box(.33,.32,.23,x-w/2-.08,y-.25,z+pz,m.trim);}}
}
export function archRing(b:GeometryBatch,m:Materials,r:number,thick:number,depth:number,x:number,y:number,z:number){
  const s=new T.Shape();s.absarc(0,0,r+thick,0,Math.PI,false);s.absarc(0,0,r,Math.PI,0,true);s.closePath();
  b.add(metricUV(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:18}),3.8),m.trim,x,y,z-depth/2);
  for(let i=0;i<=12;i++){const a=i*Math.PI/12;b.box(thick+.06,.035,depth+.04,x+Math.cos(a)*(r+thick*.5),y+Math.sin(a)*(r+thick*.5),z,m.base,0,new T.Euler(0,0,a));}
}
export function windowBay(b:GeometryBatch,m:Materials,x:number,y:number,z:number,w:number,h:number){
  const r=w*.25,spring=h*.52;
  const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h);shape.lineTo(-w/2,h);shape.closePath();
  const hole=new T.Path();hole.moveTo(-r,.65);hole.lineTo(-r,spring);hole.absarc(0,spring,r,Math.PI,0,true);hole.lineTo(r,.65);hole.closePath();shape.holes.push(hole);
  b.add(metricUV(new T.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:false,curveSegments:12}),3.8),m.stone,x,y,z);
  const glass=new T.Shape();glass.moveTo(-r,.65);glass.lineTo(r,.65);glass.lineTo(r,spring);glass.absarc(0,spring,r,0,Math.PI,false);glass.closePath();b.add(new T.ShapeGeometry(glass,16),m.glass,x,y,z-.12);
  archRing(b,m,r,.18,.2,x,y+spring,z+.55);
  for(const side of[-1,1]){b.box(.2,spring-.65,.24,x+side*r,y+(spring+.65)/2,z+.57,m.trim);b.box(.065,spring-.7,.10,x+side*r*.48,y+(spring+.65)/2,z+.02,m.bronze);}
  b.box(.09,h*.65,.12,x,y+h*.42,z+.03,m.bronze);
  for(let j=1.45;j<spring;j+=1.25)b.box(r*2,.07,.10,x,y+j,z+.02,m.bronze);
  b.box(r*2+.55,.2,.7,x,y+.51,z+.3,m.trim);
}
export function dome(b:GeometryBatch,m:Materials,x:number,y:number,z:number,r:number){
  b.cylinder(r*1.03,r*1.03,.6,x,y,z,m.trim,48);
  const g=new T.SphereGeometry(r,48,24,0,Math.PI*2,0,Math.PI/2);g.scale(1,.82,1);b.add(g,m.copper,x,y+.3,z);
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2,pts=[];for(let j=0;j<=16;j++){const q=j/16*Math.PI/2;pts.push(vec(x+Math.sin(q)*Math.cos(a)*(r+.05),y+.3+Math.cos(q)*(r*.82+.05),z+Math.sin(q)*Math.sin(a)*(r+.05)));}b.tube(pts,.055,m.bronze,16);}
  b.torus(r,.1,x,y+.35,z,m.gold);
  b.cylinder(.12,.38,2.7,x,y+r*.82+1.1,z,m.gold,12);b.sphere(.22,x,y+r*.82+2.5,z,m.gold);
}
export function urn(b:GeometryBatch,m:Materials,x:number,y:number,z:number,scale=1){
  const p=[[.35,0],[.35,.12],[.2,.18],[.18,.35],[.46,.5],[.64,.85],[.65,1.05],[.74,1.12],[.7,1.23]].map(([r,h])=>new T.Vector2(r*scale,h*scale));
  b.add(new T.LatheGeometry(p,16),m.trim,x,y,z);b.cylinder(.6*scale,.6*scale,.05,x,y+1.12*scale,z,m.soil,16);
}
