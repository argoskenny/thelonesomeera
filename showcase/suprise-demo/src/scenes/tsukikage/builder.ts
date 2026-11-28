import * as T from 'three';
import { HallOcclusion } from './occlusion';

type Point = [number, number, number];
type Buffer = { position:number[]; normal:number[]; uv:number[]; color:number[]; indices:number[]; hasColor:boolean };

// Give large timber members a small real chamfer. The slats use six faces
// since their bevel would be smaller than a pixel at normal viewing distances.
function timberShape(beveled:boolean) {
  const faces: Point[][] = [];
  const signs = [-1, 1];
  for (let axis=0;axis<3;axis++) for (const sign of signs) {
    const a=(axis+1)%3, b=(axis+2)%3;
    faces.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{
      const p:Point=[0,0,0];p[axis]=sign*2;p[a]=u;p[b]=v;return p;
    }));
  }
  if(beveled){
    for(let axis=0;axis<3;axis++) for(const u of signs) for(const v of signs){
      const a=(axis+1)%3,b=(axis+2)%3;
      faces.push([[-1,0],[-1,1],[1,1],[1,0]].map(([w,side])=>{
        const p:Point=[0,0,0];p[axis]=w;p[a]=u*(side?1:2);p[b]=v*(side?2:1);return p;
      }));
    }
    for(const x of signs) for(const y of signs) for(const z of signs)
      faces.push([[2*x,y,z],[x,2*y,z],[x,y,2*z]]);
  }
  return faces.map(points=>{
    const vectors=points.map(p=>new T.Vector3(...p));
    // Evaluate at a nonzero bevel to determine the outward winding once.
    const n=vectors[1].clone().sub(vectors[0]).cross(vectors[2].clone().sub(vectors[0])).normalize();
    if(n.dot(vectors[0])<0){points.reverse();n.negate();}
    return {points,n};
  });
}
const plain=timberShape(false),chamfer=timberShape(true);
const up=new T.Vector3(0,1,0),pos=new T.Vector3(),normal=new T.Vector3();
const rotation=new T.Quaternion(),angles=new T.Euler(),axisX=new T.Vector3(),axisY=new T.Vector3(),axisZ=new T.Vector3(),basis=new T.Matrix4();

export class Builder {
  readonly occlusion=new HallOcclusion();
  private readonly materials=new Map<string,T.Material>();
  private readonly buffers=new Map<string,Buffer>();

  material(name:string,material:T.Material){this.materials.set(name,material);}
  private buffer(name:string){
    let b=this.buffers.get(name);
    if(!b){b={position:[],normal:[],uv:[],color:[],indices:[],hasColor:false};this.buffers.set(name,b);}
    return b;
  }
  box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,rx=0,ry=0,rz=0){
    rotation.setFromEuler(angles.set(rx,ry,rz));
    this.timber(name,x,y,z,w,h,d,rotation);
  }
  beam(name:string,start:Point,end:Point,width:number,depth=width){
    const [x,y,z]=start;
    axisX.set(end[0]-x,end[1]-y,end[2]-z);
    const length=axisX.length();if(length<.00001)return;
    axisX.divideScalar(length);
    axisZ.crossVectors(axisX,up);
    if(axisZ.lengthSq()<.000001)axisZ.set(0,0,1);else axisZ.normalize();
    axisY.crossVectors(axisZ,axisX).normalize();
    rotation.setFromRotationMatrix(basis.makeBasis(axisX,axisY,axisZ));
    this.timber(name,(x+end[0])/2,(y+end[1])/2,(z+end[2])/2,length,width,depth,rotation);
  }
  private timber(name:string,x:number,y:number,z:number,w:number,h:number,d:number,q:T.Quaternion){
    const b=this.buffer(name),half=[w/2,h/2,d/2],short=Math.min(w,h,d);
    if(short<=0)return;
    this.occlusion.add(x,y,z,w,h,d,q);
    const bevel=short>.065?Math.min(short*.07,.013):0;
    const grain=w>=h && w>=d?0:h>=d?1:2;
    const u0=Math.sin(x*23.7+y*13.1+z*4.7)*.71,v0=Math.sin(z*6.872+x*16.253+y*.771)*.91;
    for(const face of bevel?chamfer:plain){
      const start=b.position.length/3;
      normal.copy(face.n).applyQuaternion(q);
      const abs=[Math.abs(face.n.x),Math.abs(face.n.y),Math.abs(face.n.z)];
      const major=abs.indexOf(Math.max(...abs));
      const along=major===grain?(grain+1)%3:grain;
      const across=3-major-along;
      for(const spec of face.points){
        const p=spec.map((v,i)=>Math.sign(v)*(half[i]-(Math.abs(v)===1?bevel:0)));
        pos.set(p[0],p[1],p[2]).applyQuaternion(q);
        b.position.push(x+pos.x,y+pos.y,z+pos.z);b.normal.push(normal.x,normal.y,normal.z);
        b.uv.push(p[along]+u0,p[across]+v0);b.color.push(1,1,1);
      }
      for(let i=1;i<face.points.length-1;i++)b.indices.push(start,start+i,start+i+1);
    }
  }
  cylinder(name:string,x:number,y:number,z:number,rt:number,rb:number,h:number,segments=20){
    const geometry=new T.CylinderGeometry(rt,rb,h,segments);
    this.mesh(name,geometry,x,y,z);geometry.dispose();
  }
  mesh(name:string,g:T.BufferGeometry,x=0,y=0,z=0,rx=0,ry=0,rz=0){
    const b=this.buffer(name),start=b.position.length/3;
    if(!g.getAttribute('normal'))g.computeVertexNormals();
    const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv'),c=g.getAttribute('color');
    rotation.setFromEuler(angles.set(rx,ry,rz));
    for(let i=0;i<p.count;i++){
      pos.fromBufferAttribute(p,i).applyQuaternion(rotation);
      normal.fromBufferAttribute(n,i).applyQuaternion(rotation);
      b.position.push(x+pos.x,y+pos.y,z+pos.z);b.normal.push(normal.x,normal.y,normal.z);
      b.uv.push(uv?uv.getX(i):pos.x,uv?uv.getY(i):pos.z);
      b.color.push(c?c.getX(i):1,c?c.getY(i):1,c?c.getZ(i):1);
    }
    if(c)b.hasColor=true;
    if(g.index) for(let i=0;i<g.index.count;i++)b.indices.push(start+g.index.getX(i));
    else for(let i=0;i<p.count;i++)b.indices.push(start+i);
  }
  finish(scene:T.Scene){
    for(const [name,b] of this.buffers){
      const mat=this.materials.get(name);
      if(!mat)throw new Error('Missing scene material '+name);
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(b.position,3));
      geometry.setAttribute('normal',new T.Float32BufferAttribute(b.normal,3));
      geometry.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));
      if(b.hasColor){geometry.setAttribute('color',new T.Float32BufferAttribute(b.color,3));mat.vertexColors=true;}
      geometry.setIndex(b.indices);geometry.computeBoundingSphere();
      const mesh=new T.Mesh(geometry,mat);mesh.name=name;
      mesh.castShadow=!mat.transparent && !(mat instanceof T.MeshBasicMaterial);
      mesh.receiveShadow=true;scene.add(mesh);
    }
    this.buffers.clear();
  }
}
