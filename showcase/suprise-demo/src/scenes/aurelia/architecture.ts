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
  if(r>.45)for(let j=0;j<12;j++){
    const a=j*Math.PI/6,xx=Math.cos(a),zz=Math.sin(a);
    b.tube([vec(x+xx*r*.75,y+h-1.05,z+zz*r*.75),vec(x+xx*r*1.05,y+h-.68,z+zz*r*1.05),vec(x+xx*r*1.32,y+h-.57,z+zz*r*1.32)],.055,m.trim,8);
    b.sphere(.095,x+xx*r*1.26,y+h-.57,z+zz*r*1.26,m.trim,vec(1,1.8,1));
  }
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
  const glass=new T.Shape();glass.moveTo(-r,.65);glass.lineTo(r,.65);glass.lineTo(r,spring);glass.absarc(0,spring,r,0,Math.PI,false);glass.closePath();const glassGeo=new T.ShapeGeometry(glass,16),glassUV=glassGeo.attributes.uv,glassP=glassGeo.attributes.position;for(let i=0;i<glassP.count;i++)glassUV.setXY(i,(glassP.getX(i)+r)/(r*2),(glassP.getY(i)-.65)/(spring+r-.65));b.add(glassGeo,m.glass,x,y,z-.12);
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

export function hipRoof(b:GeometryBatch,m:Materials,x:number,y:number,z:number,w:number,d:number,rise=3){
  const a=w/2+.55,c=d/2+.55,ridge=Math.max(0,(w-d)*.5);
  const v=[[-a,0,-c],[a,0,-c],[a,0,c],[-a,0,c],[-ridge,rise,0],[ridge,rise,0]];
  const tris=[0,4,5,0,5,1,1,5,2,2,5,4,2,4,3,3,4,0],pos=tris.flatMap(i=>v[i]),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(tris.flatMap(i=>[v[i][0]/3,v[i][2]/3+v[i][1]/3]),2));g.computeVertexNormals();b.add(g,m.roof,x,y,z);
  for(const s of[-1,1])b.box(w+1.2,.22,.18,x,y,z+s*c,m.trim);
  b.beam(vec(x-ridge,y+rise+.05,z),vec(x+ridge+.01,y+rise+.05,z),.22,.22,m.roof);
}
export function palazzo(b:GeometryBatch,m:Materials,x:number,y:number,z:number,w:number,d:number,floors:number,variant=0,detailed=false){
  const stone=m.stoneVariants[variant%m.stoneVariants.length],local={...m,stone},floorH=5.1,h=floors*floorH;
  b.box(w-1.3,h,d-1.3,x,y+h/2,z,m.shadow);b.box(w+1,1.8,d+1,x,y-.9,z,m.base);
  for(let f=0;f<floors;f++){
    const fy=y+f*floorH;
    for(let side=0;side<4;side++){
      const width=side%2?d:w,depth=side%2?w:d,n=Math.max(2,Math.round(width/4)),bay=width/n;
      b.at(x,z,side*Math.PI/2,()=>{for(let i=0;i<n;i++)windowBay(b,local,-width/2+(i+.5)*bay,fy,depth/2-.5,bay,floorH-.12);});
    }
    b.box(w+.45,.3,d+.45,x,fy-.04,z,m.trim);if(detailed)cornice(b,local,w,d,x,fy+floorH-.5,z,false);
  }
  cornice(b,local,w+.1,d+.1,x,y+h-.5,z,detailed);hipRoof(b,m,x,y+h+.25,z,w,d,Math.min(3,d*.25));
  for(const s of[-1,1]){b.box(.65,h,.65,x+s*w/2,y+h/2,z+d/2-.2,m.trim);b.box(.65,h,.65,x+s*w/2,y+h/2,z-d/2+.2,m.trim);}
  if(detailed)for(const zz of[-d*.25,d*.25]){b.box(1.2,2.6,1.2,x+w*.25,y+h+1.1,z+zz,m.stone);b.box(1.5,.3,1.5,x+w*.25,y+h+2.4,z+zz,m.trim);}
}
export function campanile(b:GeometryBatch,m:Materials,x:number,y:number,z:number,h:number,w=5,gothic=false){
  const shaft=h-9;b.box(w,shaft,w,x,y+shaft/2,z,m.stone);
  for(let yy=7;yy<shaft-3;yy+=8){cornice(b,m,w,w,x,y+yy,z,false);for(let s=0;s<4;s++)b.at(x,z,s*Math.PI/2,()=>{b.plane(w*.34,3,0,y+yy-3,w/2+.02,m.shadow);b.box(.15,3.3,.15,-w*.2,y+yy-3,w/2+.1,m.trim);b.box(.15,3.3,.15,w*.2,y+yy-3,w/2+.1,m.trim);});}
  for(const sx of[-1,1])for(const sz of[-1,1])column(b,m,x+sx*w*.42,y+shaft,z+sz*w*.42,5.2,.22);
  for(let side=0;side<4;side++)b.at(x,z,side*Math.PI/2,()=>archRing(b,m,w*.31,.22,.4,0,y+shaft+3.1,w*.42));
  cornice(b,m,w+.3,w+.3,x,y+shaft+5.1,z,false);
  if(gothic){b.cylinder(0,w*.84,11,x,y+shaft+11,z,m.bronze,8);b.cylinder(.045,.07,3,x,y+shaft+17,z,m.gold,8);}
  else hipRoof(b,m,x,y+shaft+5.8,z,w+.8,w+.8,3.1);
}
export function cathedral(b:GeometryBatch,m:Materials,x:number,y:number,z:number){
  palazzo(b,m,x,y,z,32,48,4,2,true);
  const drum=y+21,r=17.5;
  b.cylinder(r,r,7,x,drum+3.5,z-5,m.trim,8);
  for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4;b.at(x,z-5,a,()=>{b.torus(1.5,.2,0,drum+3.7,r*.93,m.trim,new T.Euler(),32);b.cylinder(1.3,1.3,.08,0,drum+3.7,r*.93,m.glass,32,new T.Euler(Math.PI/2,0,0));});}
  const dy=drum+7,profile=[[r,0],[r*.99,3],[r*.88,11],[r*.67,21],[r*.35,29],[r*.13,32]];
  const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p as [number,number])),64);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const a=Math.atan2(p.getX(i),p.getZ(i)),q=((a%(Math.PI/4))+Math.PI/4)%(Math.PI/4)-Math.PI/8,k=Math.cos(Math.PI/8)/Math.cos(q);p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);}g.computeVertexNormals();b.add(metricUV(g,3.8),m.roof,x,dy,z-5);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,pts=profile.map(([rr,yy])=>vec(x+Math.sin(a)*rr,dy+yy,z-5+Math.cos(a)*rr));b.tube(pts,.23,m.trim,36);}
  b.cylinder(2.5,2.5,.5,x,dy+32.2,z-5,m.trim,8);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;column(b,m,x+Math.sin(a)*1.9,dy+32.4,z-5+Math.cos(a)*1.9,4,.15);}
  b.cylinder(0,2.8,4,x,dy+38,z-5,m.trim,8);b.cylinder(.06,.09,2.8,x,dy+41,z-5,m.gold,8);b.sphere(.25,x,dy+42.5,z-5,m.gold);
  // Marble frontispiece with an oversized rose window and layered portal.
  const front=z+24.6;
  b.box(32,.9,1.1,x,y+21,front,m.trim);
  for(const sx of[-1,1])for(let i=0;i<3;i++)column(b,m,x+sx*(5.2+i*.6),y,front,10.5,.22);
  archRing(b,m,4.6,.55,1.3,x,y+5.8,front);b.plane(8.5,5.8,x,y+2.9,front-.1,m.bronze);
  b.torus(3.3,.3,x,y+15,front,m.trim,new T.Euler(),48);b.cylinder(3,3,.1,x,y+15,front-.05,m.glass,48,new T.Euler(Math.PI/2,0,0));
  for(let i=0;i<16;i++){const a=i*Math.PI/8;b.beam(vec(x,y+15,front+.15),vec(x+Math.cos(a)*3,y+15+Math.sin(a)*3,front+.15),.08,.1,m.trim);}
  campanile(b,m,x-25,y,z+8,46,5.5);
}

/** Tall lancets, open tracery and external buttresses around the upper hall. */
export function gothicHall(b:GeometryBatch,m:Materials,x:number,y:number,z:number,w:number,d:number){
  const h=43,stone=m.trim;
  b.box(w-1.4,h,d-1.4,x,y+h/2,z,m.shadow);
  for(let side=0;side<4;side++){
    const span=side%2?d:w,depth=side%2?w:d,n=Math.round(span/5.5),bay=span/n;
    b.at(x,z,side*Math.PI/2,()=>{
      for(let i=0;i<n;i++){
        const xx=-span/2+(i+.5)*bay,zz=depth/2,r=bay*.3;
        for(let floor=0;floor<2;floor++){
          const yy=y+floor*21.5;
          b.box(bay,3.8,.8,xx,yy+1.9,zz,stone);
          b.box(bay,4,.8,xx,yy+19.5,zz,stone);
          for(const s of[-1,1]){b.box(bay*.18,18,.9,xx+s*bay*.41,yy+10,zz,stone);b.box(.16,12,.25,xx+s*r,yy+9.8,zz+.5,stone);}
          const shape=new T.Shape();shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,10);shape.quadraticCurveTo(r*.8,13,0,15);shape.quadraticCurveTo(-r*.8,13,-r,10);shape.closePath();
          const gg=new T.ShapeGeometry(shape),gp=gg.attributes.position,guv=gg.attributes.uv;for(let j=0;j<gp.count;j++)guv.setXY(j,(gp.getX(j)+r)/(2*r),gp.getY(j)/15);b.add(gg,m.glass,xx,yy+3.4,zz-.2);
          for(const sign of[-1,1]){const pts=[vec(xx+sign*r,yy+13.4,zz+.5),vec(xx+sign*r*.7,yy+16.4,zz+.5),vec(xx,yy+18.4,zz+.5)];b.tube(pts,.13,stone,16);}
          b.box(.11,11.2,.16,xx,yy+9,zz+.4,stone);b.torus(r*.45,.09,xx,yy+15.6,zz+.4,stone,new T.Euler(),24);
        }
        b.box(.65,h+3,1.5,xx-bay/2,y+h/2,zz+.6,stone);
        b.cylinder(0,.65,6,xx-bay/2,y+h+5,zz+.6,m.bronze,8);
        b.beam(vec(xx-bay/2,y+30,zz),vec(xx-bay/2,y+7,zz+6),.55,.8,stone);
        b.box(.85,12,.9,xx-bay/2,y+6,zz+6,stone);b.cylinder(0,.6,3,xx-bay/2,y+13.5,zz+6,stone,8);
      }
    });
  }
  cornice(b,m,w,d,x,y+21,z,true);cornice(b,m,w,d,x,y+h,z,true);
  hipRoof(b,{...m,roof:m.bronze},x,y+h+.8,z,w,d,11);
}
