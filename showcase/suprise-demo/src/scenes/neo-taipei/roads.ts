import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import type { Materials } from './materials';
export function buildRoad(b:GeometryBatch,m:Materials,points:T.Vector3[],width:number){
 const pos:number[]=[],uv:number[]=[],idx:number[]=[];let length=0;
 for(let i=0;i<points.length;i++){const p=points[i],t=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(i-1,0)]).normalize(),n=vec(t.z,0,-t.x).normalize();if(i)length+=p.distanceTo(points[i-1]);for(const side of[-1,1]){const v=p.clone().addScaledVector(n,side*width/2);pos.push(v.x,v.y,v.z);uv.push(side===-1?0:width/3,length/3);}if(i){const k=i*2;idx.push(k-2,k,k-1,k-1,k,k+1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();b.add(g,m.road);
 for(let i=0;i<points.length-1;i++){const p=points[i],q=points[i+1],t=q.clone().sub(p).normalize(),n=vec(t.z,0,-t.x).normalize();const mid=p.clone().lerp(q,.5),delta=q.clone().sub(p);b.box(width,1.3,delta.length()+.02,mid.x,mid.y-.65,mid.z,m.iron,0,new T.Euler(-Math.atan2(delta.y,Math.hypot(delta.x,delta.z)),Math.atan2(delta.x,delta.z),0,'YXZ'));
 for(const side of[-1,1]){const a=p.clone().addScaledVector(n,side*width/2),c=q.clone().addScaledVector(n,side*width/2);b.beam(a.clone().add(vec(0,.6,0)),c.clone().add(vec(0,.6,0)),.15,.22,m.steel);b.beam(a.clone().add(vec(0,.3,0)),c.clone().add(vec(0,.3,0)),.07,.07,side===1?m.cyan:m.amber);if(i%4===0)b.box(.13,1.1,.13,a.x,a.y+.55,a.z,m.iron);}
 if(i%3===0)b.beam(p.clone().add(vec(0,.018,0)),q.clone().add(vec(0,.018,0)),.09,.025,m.warm);
 if(i%18===0){b.box(2.2,p.y-2,3,p.x,(p.y-2)/2,p.z,m.concrete);for(const s of[-1,1])b.beam(vec(p.x,Math.max(1,p.y-13),p.z),p.clone().addScaledVector(n,s*width*.45).add(vec(0,-1,0)),.6,.6,m.steel);}}
}
