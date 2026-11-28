import { BufferGeometry, Euler, Float32BufferAttribute, Quaternion, Vector3 } from 'three';
import { Builder } from './builder';
import { onStrip, stageLengthScale, stagePoint, stageYaw, type DeckStrip, type FloorPoint } from './stage-plan';

type Point = [number,number,number];
const stageRotation=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),stageYaw);

export class StageBuilder extends Builder {
  constructor(private output:Builder,private lengthScale=stageLengthScale){super();}
  private point(x:number,y:number,z:number):Point {
    const [px,pz]=stagePoint(x,z,this.lengthScale);
    return [px,y,pz];
  }
  private orientation(rx:number,ry:number,rz:number):Point {
    const q=new Quaternion().setFromEuler(new Euler(rx,ry,rz)).premultiply(stageRotation);
    const e=new Euler().setFromQuaternion(q);
    return [e.x,e.y,e.z];
  }
  override material(...args:Parameters<Builder['material']>){this.output.material(...args);}
  override box(m:string,x:number,y:number,z:number,w:number,h:number,d:number,rx=0,ry=0,rz=0){
    this.output.box(m,...this.point(x,y,z),w*this.lengthScale,h,d,...this.orientation(rx,ry,rz));
  }
  override beam(m:string,a:Point,b:Point,w:number,d=w){this.output.beam(m,this.point(...a),this.point(...b),w,d);}
  override cylinder(m:string,x:number,y:number,z:number,rt:number,rb:number,h:number,n=20){
    this.output.cylinder(m,...this.point(x,y,z),rt,rb,h,n);
  }
  override mesh(m:string,g:BufferGeometry,x=0,y=0,z=0,rx=0,ry=0,rz=0){
    this.output.mesh(m,g,...this.point(x,y,z),...this.orientation(rx,ry,rz));
  }
}

function board(a:FloorPoint,b:FloorPoint,c:FloorPoint,d:FloorPoint,top:number,thick:number,u0:number) {
  const corners=[a,b,d,c],positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  const topV=corners.map(([x,z])=>new Vector3(x,top,z));
  const bottomV=topV.map(v=>v.clone().setY(top-thick));
  function face(p:Vector3,q:Vector3,r:Vector3,s:Vector3) {
    const i=positions.length/3;
    for(const v of [p,q,r,s])positions.push(v.x,v.y,v.z);
    const w=p.distanceTo(q),h=p.distanceTo(s);
    uvs.push(u0,0,u0+w,0,u0+w,h,u0,h);
    indices.push(i,i+1,i+2,i,i+2,i+3);
  }
  face(topV[0],topV[1],topV[2],topV[3]);
  face(bottomV[3],bottomV[2],bottomV[1],bottomV[0]);
  for(let i=0;i<4;i++){const j=(i+1)%4;face(topV[j],topV[i],bottomV[i],bottomV[j]);}
  const g=new BufferGeometry();
  g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();return g;
}

export function cutDeck(b:Builder,strip:DeckStrip,count:number) {
  b.mesh('walnut',board(...strip,2.453,.23,.86));
  for(let i=0;i<count;i++) {
    const t0=(i+.009)/count,t1=(i+.991)/count;
    b.mesh('floor',board(onStrip(strip,t0,0),onStrip(strip,t0,1),onStrip(strip,t1,0),onStrip(strip,t1,1),2.50,.05,i*.131));
  }
  for(const side of [0,1]) {
    const [ax,az]=onStrip(strip,0,side),[cx,cz]=onStrip(strip,1,side);
    b.beam('cedar',[ax,2.31,az],[cx,2.31,cz],.22,.105);
    b.beam('hinoki',[ax,2.43,az],[cx,2.43,cz],.055,.12);
  }
}
