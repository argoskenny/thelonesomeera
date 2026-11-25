import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import type { Materials } from './materials';
export function buildRocket(m:Materials){
  const group=new T.Group();group.name='Launch vehicle';group.position.y=15;
  const b=new GeometryBatch();
  b.cylinder(4.5,4.5,69,0,34.5,0,m.steel,96);
  b.cylinder(4.5,4.5,33,0,85.5,0,m.steel,96);
  const profile=[];for(let i=0;i<=32;i++){const t=i/32;profile.push(new T.Vector2(4.5*Math.pow(Math.cos(t*Math.PI/2),.82),102+t*17));}
  b.add(new T.LatheGeometry(profile,96),m.steel);
  b.add(new T.CylinderGeometry(4.58,4.58,33,64,1,true,-Math.PI/2,Math.PI),m.dark,0,85.5,0);
  b.add(new T.LatheGeometry(profile.map(v=>new T.Vector2(v.x+.08,v.y)),64,-Math.PI/2,Math.PI),m.dark);
  for(let y=1;y<102;y+=1.8)b.torus(4.56,.018,0,y,0,m.alloy,undefined,96);
  for(let a=0;a<12;a++){const angle=a*Math.PI/6;b.box(.022,68,.035,Math.sin(angle)*4.51,34,Math.cos(angle)*4.51,m.alloy);}
  for(const y of[1,66.6,68.8]){b.cylinder(4.57,4.57,.22,0,y,0,m.frame,96);}
  for(let i=0;i<33;i++){
    const ring=i<20?3.25:i<30?2.0:.68,a=i*Math.PI*2/(i<20?20:i<30?10:3),x=Math.sin(a)*ring,z=Math.cos(a)*ring;
    b.cylinder(.30,.54,1.5,x,-.65,z,m.frame,16);b.cylinder(.40,.47,.10,x,-1.4,z,m.black,16);b.torus(.53,.025,x,-1.37,z,m.alloy);
  }
  // Shaped flaps and hinges are part of the flying vehicle, not the tower.
  for(const side of[-1,1])for(const upper of[false,true]){
    const y=upper?105:72,h=upper?9.2:13.5,w=upper?3.6:4.2;
    const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(w,0);shape.lineTo(w*.91,h*.55);shape.lineTo(.1,h);shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:1,steps:1});
    g.scale(side,1,1);if(side<0){g.scale(-1,1,1);g.rotateY(Math.PI);}b.add(g,m.dark,side*4.25,y,1.1);
    b.cylinder(.16,.16,h,side*4.25,y+h/2,1.05,m.alloy,12);
  }
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;b.at(Math.sin(a)*4.6,Math.cos(a)*4.6,-a,()=>{
      b.box(2.9,.32,2.1,0,64,1,m.frame);
      for(let q=-4;q<=4;q++){b.box(.045,.4,2.05,q*.29,64,1,m.alloy);b.box(2.9,.4,.045,0,64,1+q*.21,m.alloy);}
    });
  }
  // Feed lines, cable races, frost bands, vents, access doors and lifting points.
  for(const x of[-1.1,1.1]){b.cylinder(.11,.11,62,x,32,-4.39,m.alloy,12);for(let y=5;y<65;y+=4)b.torus(.16,.025,x,y,-4.39,m.frame);}
  for(let y=9;y<65;y+=13){b.box(.7,.9,.07,2.1,y,4.0,m.alloy,.09);for(const dx of[-.26,.26])b.sphere(.035,2.1+dx,y+.3,4.06,m.black);}
  b.flush(group);return group;
}
