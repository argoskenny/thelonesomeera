import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import type { Materials } from './materials';

export function createSkyships(scene:T.Scene,m:Materials){
  const ships:T.Group[]=[];
  for(let i=0;i<3;i++){
    const root=new T.Group(),b=new GeometryBatch();
    // Carved hull with ribbing and two fully modelled curved canvas sails.
    const hull=new T.SphereGeometry(1,32,16);hull.scale(2.1,.9,7);b.add(hull,m.bronze,0,0,0);
    b.box(3.3,.18,9,0,.6,0,m.trim);
    for(let j=-4;j<=4;j+=1)b.tube([vec(-1.4,.5,j),vec(-1.9,-.1,j),vec(0,-1,j),vec(1.9,-.1,j),vec(1.4,.5,j)],.055,m.gold,12);
    b.cylinder(.08,.13,10,0,5,0,m.gold,10);
    b.beam(vec(0,1,-6),vec(0,8,0),.08,.08,m.bronze);b.beam(vec(0,1,6),vec(0,9,0),.08,.08,m.bronze);
    for(const side of[-1,1]){
      const g=new T.PlaneGeometry(1,1,16,20),p=g.attributes.position;
      for(let n=0;n<p.count;n++){const u=p.getX(n)+.5,v=p.getY(n)+.5;p.setXYZ(n,side*(.1+u*(1-v)*5),1+v*7,Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*1.6+side*.3);}
      g.computeVertexNormals();b.add(g,m.sail);
      b.beam(vec(side*.1,1,side*.3),vec(side*5.1,1,side*.3),.08,.08,m.gold);
      b.tube([vec(side*5.1,1,side*.3),vec(side*2.7,4.5,.8),vec(side*.1,8,side*.3)],.045,m.gold,16);
    }
    for(const side of[-1,1])b.tube([vec(side*1.5,.7,-4),vec(side*1.6,1.6,0),vec(side*1.5,.7,4)],.06,m.gold,12);
    b.flush(root);const s=i===0?1.1:i===1?.7:.5;root.scale.setScalar(s);scene.add(root);ships.push(root);
  }
  return {ships,update(t:number){ships.forEach((s,i)=>{const a=t*(.006+i*.001)+i*2.1;s.position.set(Math.sin(a)*(75+i*65),128+i*24+Math.sin(t*.12+i)*1.2,-85-i*110+Math.cos(a)*25);s.rotation.set(Math.sin(t*.16+i)*.015,a+Math.PI/2,Math.cos(t*.13+i)*.035);});}};
}
