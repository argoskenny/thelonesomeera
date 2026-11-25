import * as T from 'three';
import { GeometryBatch,seededRandom,vec } from '../../shared/geometry';
import { metricUV } from '../../shared/procedural';
import type { Obstacle } from '../../shared/types';
import type { Materials } from './materials';
import { terrainHeight,shoreX } from './layout';
export function vegetation(root:T.Object3D,m:Materials,mobile:boolean,obstacles:Obstacle[]){
  const r=seededRandom(454),b=new GeometryBatch(),leaves:{p:T.Vector3;s:number;rotation:T.Euler;color:T.Color}[]=[];
  const bush=(x:number,y:number,z:number,radius:number,count:number)=>{
    for(let i=0;i<count;i++){const a=r()*Math.PI*2,u=r()*2-1,k=Math.cbrt(r()),rad=radius*Math.sqrt(1-u*u)*k;leaves.push({p:vec(x+Math.cos(a)*rad,y+u*radius*.7*k,z+Math.sin(a)*rad),s:.19+r()*.22,rotation:new T.Euler(r()*6,r()*6,r()*6),color:new T.Color().setHSL(.18+r()*.065,.15+r()*.23,.68+r()*.3)});}
  };
  function tree(x:number,z:number,size:number,near=false){if(obstacles.some(o=>o.w>2&&Math.abs(x-o.x)<o.w/2+2&&Math.abs(z-o.z)<o.d/2+2))return;const y=terrainHeight(x,z);b.cylinder(.08,.19*size,3.4*size,x,y+1.7*size,z,m.trunk,7);
    for(let j=0;j<5;j++){const a=j*2.4,k=1.2*size,px=x+Math.cos(a)*k,pz=z+Math.sin(a)*k,py=y+(3.4+r()*1.2)*size;b.beam(vec(x,y+2*size,z),vec(px,py,pz),.08*size,.08*size,m.trunk);bush(px,py,pz,1.35*size,near?Math.ceil(400*size*size):95);}
  }
  // Broad-leaved salt-tolerant shrubs overhang the roadside retaining walls.
  for(let z=-6;z<220;z+=3){bush(-7.6,terrainHeight(-7.6,z)+.65,z,1.2,370);if(z<30&&z%18===0)tree(-11,z,.65,true);}
  tree(-8.5,154,2.2,true);
  for(let z=0;z<205;z+=17){tree(9,z,1.2,true);bush(8,terrainHeight(8,z)+.8,z+4,1.6,180);}
  for(let i=0;i<350;i++){const z=-720+r()*920,x=shoreX(z)+55+r()*420;if(Math.abs(x)<10||Math.abs(z+32)<10)continue;tree(x,z,.8+r()*1.4,Math.hypot(x,z-130)<80);}
  function palm(x:number,z:number,h:number){const y=4.15,pts=[];for(let j=0;j<=8;j++){const t=j/8;pts.push(vec(x+Math.sin(t)*.6,y+t*h,z+t*t*.7));}b.tube(pts,.14,m.trunk,10);
    for(let j=0;j<14;j++){const t=j/14;b.torus(.145,.018,x+Math.sin(t)*.6,y+t*h,z+t*t*.7,m.wood,new T.Euler(Math.PI/2,0,0),7);}
    for(let j=0;j<9;j++){const a=j*Math.PI*2/9,points=[];for(let k=0;k<12;k++){const t=k/11;points.push(vec(x+.5+Math.cos(a)*t*3.6,y+h+Math.sin(t*Math.PI)*1.3-t*.9,z+.7+Math.sin(a)*t*3.6));}b.tube(points,.025,m.palm,12);
      // Feathered palm fronds made of tapered, curved leaflets.
      for(let k=1;k<11;k++){const t=k/11,p=points[k],len=Math.sin(t*Math.PI)*.85;for(const side of[-1,1]){const tip=p.clone().add(vec(Math.cos(a+side*1.1)*len,-.14,Math.sin(a+side*1.1)*len));const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...p.toArray(),...p.clone().add(vec(Math.cos(a)*.16,.02,Math.sin(a)*.16)).toArray(),...tip.toArray()],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));g.computeVertexNormals();b.add(g,m.palm);}}
    }
  }
  for(let z=-580;z<180;z+=26)palm(shoreX(z)+27,z,6+r()*2.5);
  // Distant crown volumes keep the wooded ridgeline three dimensional.
  const crown=new T.IcosahedronGeometry(1,2),cp=crown.attributes.position;
  for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),n=1+.19*Math.sin(x*7+z*3)*Math.cos(z*8-y*4);cp.setXYZ(i,x*n,y*n,z*n);}
  crown.computeVertexNormals();metricUV(crown,.9);
  const forestCount=mobile?2500:6400,forest=new T.InstancedMesh(crown,m.canopy,forestCount),crownDummy=new T.Object3D();
  for(let i=0;i<forestCount;i++){const z=-800+r()*1030,x=shoreX(z)+173+r()*550,size=.8+r()*1.1;crownDummy.position.set(x,terrainHeight(x,z)-size*.08,z);crownDummy.scale.set(size,size*.6,size*.9);crownDummy.rotation.set(r()*.3,r()*6,r()*.3);crownDummy.updateMatrix();forest.setMatrixAt(i,crownDummy.matrix);forest.setColorAt(i,new T.Color().setHSL(.18+r()*.07,.1+r()*.15,.60+r()*.32));}
  forest.receiveShadow=true;root.add(forest);
  b.flush(root);
  const geo=new T.PlaneGeometry(1,1,1,2),p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin((p.getY(i)+.5)*Math.PI)*.1);geo.computeVertexNormals();
  const step=mobile?3:1,mesh=new T.InstancedMesh(geo,m.foliage,Math.ceil(leaves.length/step)),dummy=new T.Object3D();let index=0;
  for(let i=0;i<leaves.length;i+=step){const l=leaves[i];dummy.position.copy(l.p);dummy.scale.setScalar(l.s*(mobile?1.4:1));dummy.rotation.copy(l.rotation);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,l.color);index++;}
  mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return index;
}
