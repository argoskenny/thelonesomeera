import * as T from 'three';
import { GeometryBatch,seededRandom,vec } from '../../shared/geometry';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Materials } from './materials';
export function createGardens(m:Materials,mobile:boolean){
  const random=seededRandom(55291),leaves:{p:T.Vector3;s:number;r:T.Euler;c:T.Color}[]=[],flowers:{p:T.Vector3;s:number;c:T.Color}[]=[],b=new GeometryBatch();
  function bush(x:number,y:number,z:number,r=1,h=1,count=170,bloom=false){
    for(let i=0;i<count;i++){const a=random()*Math.PI*2,k=Math.cbrt(random()),yy=random(),rad=Math.sin(Math.PI*(.15+yy*.7))*r*k;
      const p=vec(x+Math.cos(a)*rad,y+yy*h,z+Math.sin(a)*rad);leaves.push({p,s:.15+random()*.18,r:new T.Euler(random()*5,random()*6,random()*6),c:new T.Color().setHSL(.18+random()*.07,.12+random()*.2,.66+random()*.3)});
      if(bloom&&i%5===0)flowers.push({p:p.clone().add(vec(0,.12,0)),s:.08+random()*.065,c:new T.Color().setHSL(.73+random()*.06,.4+random()*.25,.45+random()*.30)});
    }
  }
  function ivy(x:number,y:number,z:number,drop:number,width=2,flower=true){
    for(let j=0;j<6;j++){const xx=x+(j/5-.5)*width,len=drop*(.55+random()*.45),pts=[];
      for(let d=0;d<len;d+=.32){const px=xx+Math.sin(d*1.9+j)*.18;pts.push(vec(px,y-d,z+.12));bush(px,y-d-.2,z+.16,.3,.45,18,false);
        if(flower&&j%2===0&&d%1.28<.33){for(let k=0;k<9;k++){const a=k*2.4;flowers.push({p:vec(px+Math.sin(a)*(.15-k*.012),y-d-k*.09,z+.2+Math.cos(a)*(.15-k*.012)),s:.075-k*.003,c:new T.Color().setHSL(.74+random()*.045,.45,.5+random()*.2)});}}
      }if(pts.length>1)b.tube(pts,.025,m.bark,12);
    }
  }
  function cypress(x:number,y:number,z:number,h=8){
    b.cylinder(.07,.22,h*.85,x,y+h*.42,z,m.bark,8);
    for(let j=0;j<13;j++){const t=j/13,r=(1-t)*.9+.12;bush(x,y+t*h,z,r,h*.23,110,false);}
  }
  function tree(x:number,y:number,z:number,h=6){
    b.cylinder(.09,.3,h*.65,x,y+h*.32,z,m.bark,8);
    for(let j=0;j<6;j++){const a=j*2.4,xx=x+Math.cos(a)*h*.22,zz=z+Math.sin(a)*h*.22,yy=y+h*(.65+random()*.2);b.beam(vec(x,y+h*.36,z),vec(xx,yy,zz),.1,.1,m.bark);bush(xx,yy-.9,zz,h*.24,h*.3,460);}
  }
  function flush(root:T.Object3D){
    b.flush(root);const g=new T.PlaneGeometry(1,1,1,2),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin((p.getY(i)+.5)*Math.PI)*.12);g.computeVertexNormals();
    const stride=mobile?2:1,dummy=new T.Object3D(),mesh=new T.InstancedMesh(g,m.foliage,Math.ceil(leaves.length/stride));let n=0;
    for(let i=0;i<leaves.length;i+=stride){const l=leaves[i];dummy.position.copy(l.p);dummy.rotation.copy(l.r);dummy.scale.set(l.s*(mobile?1.2:1),l.s*(mobile?1.3:1.1),l.s);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);mesh.setColorAt(n++,l.c);}mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
    const petals=[];for(let j=0;j<5;j++){const a=j*Math.PI*2/5,petal=new T.SphereGeometry(1,6,4);petal.scale(.49,.15,.3);petal.rotateY(a);petal.translate(Math.cos(a)*.39,0,Math.sin(a)*.39);petals.push(petal);}const flowerGeo=mergeGeometries(petals);petals.forEach(g=>g.dispose());
    const fm=new T.InstancedMesh(flowerGeo,m.flower,flowers.length);for(let i=0;i<flowers.length;i++){const f=flowers[i];dummy.position.copy(f.p);dummy.rotation.set(random()*4,random()*6,random()*3);dummy.scale.setScalar(f.s);dummy.updateMatrix();fm.setMatrixAt(i,dummy.matrix);fm.setColorAt(i,f.c);}fm.castShadow=true;fm.receiveShadow=true;root.add(fm);return {leaves:n,flowers:flowers.length};
  }
  return {bush,ivy,cypress,tree,flush};
}
