import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { metricUV } from './procedural';

export class GeometryBatch {
  constructor(private worldUV=false){}
  private groups=new Map<THREE.Material,THREE.BufferGeometry[]>();
  private transform=new THREE.Matrix4();
  at(x:number,z:number,angle:number,build:()=>void,y=0){
    const previous=this.transform;
    this.transform=previous.clone().multiply(new THREE.Matrix4().makeTranslation(x,y,z)).multiply(new THREE.Matrix4().makeRotationY(angle));
    try{build();}finally{this.transform=previous;}
  }
  add(g:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0,rotation?:THREE.Euler){
    const metric=!!g.userData.metricUV;
    if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}
    if(rotation)g.applyQuaternion(new THREE.Quaternion().setFromEuler(rotation));g.translate(x,y,z);g.applyMatrix4(this.transform);if(this.worldUV&&metric)metricUV(g,3.8);
    const list=this.groups.get(mat)||[];list.push(g);this.groups.set(mat,list);
  }
  box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,r=0,rotation?:THREE.Euler){
    const g=r?new RoundedBoxGeometry(w,h,d,1,r):new THREE.BoxGeometry(w,h,d);
    g.userData.metricUV=true;
    this.add(metricUV(g,2.8),mat,x,y,z,rotation);
  }
  cylinder(rt:number,rb:number,h:number,x:number,y:number,z:number,mat:THREE.Material,segments=16,rotation?:THREE.Euler){this.add(new THREE.CylinderGeometry(rt,rb,h,segments),mat,x,y,z,rotation);}
  sphere(r:number,x:number,y:number,z:number,mat:THREE.Material,scale=new THREE.Vector3(1,1,1)){
    const g=new THREE.SphereGeometry(r,12,9);g.scale(scale.x,scale.y,scale.z);this.add(g,mat,x,y,z);
  }
  torus(radius:number,tube:number,x:number,y:number,z:number,mat:THREE.Material,rotation=new THREE.Euler(Math.PI/2,0,0),segments=24){
    this.add(new THREE.TorusGeometry(radius,tube,6,segments),mat,x,y,z,rotation);
  }
  tube(points:THREE.Vector3[],radius:number,mat:THREE.Material,segments=24){this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,radius,5,false),mat);}
  plane(w:number,h:number,x:number,y:number,z:number,mat:THREE.Material,ry=0){this.add(new THREE.PlaneGeometry(w,h),mat,x,y,z,new THREE.Euler(0,ry,0));}
  beam(a:THREE.Vector3,c:THREE.Vector3,width:number,depth:number,mat:THREE.Material){
    const delta=c.clone().sub(a),mid=a.clone().add(c).multiplyScalar(.5);
    this.box(width,delta.length(),depth,mid.x,mid.y,mid.z,mat,0,new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(vec(0,1,0),delta.normalize())));
  }
  flush(scene:THREE.Object3D){
    let count=0;
    for(const [mat,geometries]of this.groups){
      const mesh=new THREE.Mesh(mergeGeometries(geometries),mat);mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;scene.add(mesh);geometries.forEach(g=>g.dispose());count++;
    }this.groups.clear();return count;
  }
}
export const vec=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
export function seededRandom(initial=4891){let seed=initial;return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
