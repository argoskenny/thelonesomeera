import * as T from 'three';
import { GeometryBatch,seededRandom,vec } from '../../shared/geometry';
import type { Obstacle,WalkSurface } from '../../shared/types';
import type { Materials } from './materials';
import { metricUV } from '../../shared/procedural';
import { railSpans } from './walkways';
import { column,railing,cornice,archRing,windowBay,dome,urn } from './architecture';

export function buildCity(scene:T.Scene,m:Materials,mobile:boolean){
  const root=new T.Group();root.name='AERIE · limestone city';scene.add(root);
  const obstacles:Obstacle[]=[],surfaces:WalkSurface[]=[],random=seededRandom(201026);
  const leaves:{p:T.Vector3;s:T.Vector3;r:T.Euler;c:T.Color}[]=[];
  let towers=0,columns=0,bridges=0;
  const bush=(x:number,y:number,z:number,r=1.3,h=1.8,count=90)=>{
    for(let i=0;i<count*1.3;i++){
      const a=random()*Math.PI*2,k=Math.sqrt(random()),yy=random(),radius=r*Math.sin(Math.PI*(.12+yy*.8));
      leaves.push({p:vec(x+Math.cos(a)*k*radius,y+yy*h,z+Math.sin(a)*k*radius),s:vec(.18+random()*.17,.2+random()*.22,1),r:new T.Euler(random()*2,random()*6,random()*6),c:new T.Color().setHSL(.19+random()*.06,.06+random()*.14,.62+random()*.28)});
    }
  };
  function cypress(b:GeometryBatch,x:number,y:number,z:number,h=7){
    b.cylinder(.12,.26,h*.8,x,y+h*.4,z,m.bark,7);
    const crown=new T.IcosahedronGeometry(1,3),p=crown.attributes.position;
    for(let i=0;i<p.count;i++){const yy=p.getY(i),jitter=1+random()*.25;p.setXYZ(i,p.getX(i)*(.7-yy*.25)*jitter,(yy+1)*h*.44+.6,p.getZ(i)*(.7-yy*.25)*jitter);}
    crown.computeVertexNormals();b.add(crown,m.canopy,x,y,z);
    for(let i=0;i<9;i++){const v=i/9; bush(x,y+v*h,z,.9*(1-v)+.12,h*.24,75);}
  }
  function ivy(x:number,y:number,z:number,drop:number,width=3){
    const vines=5;
    for(let v=0;v<vines;v++){const ox=(v/(vines-1)-.5)*width,len=drop*(.65+random()*.35);
      for(let t=0;t<len;t+=.35){bush(x+ox+Math.sin(t*.9+v)*.2,y-t,z+.1,.36,.5,13);}
    }
  }
  function rail(b:GeometryBatch,x1:number,z1:number,x2:number,z2:number,y:number,collision=true){
    railing(b,m,x1,z1,x2,z2,y);
    if(collision)obstacles.push({x:(x1+x2)/2,z:(z1+z2)/2,w:Math.max(.42,Math.abs(x2-x1)),d:Math.max(.42,Math.abs(z2-z1)),minY:y,h:y+1.3});
  }
  function platform(b:GeometryBatch,x:number,z:number,w:number,d:number,y:number,walk=true){
    b.box(w,1.6,d,x,y-.86,z,m.stone);b.box(w+.4,.12,d+.4,x,y-.06,z,m.floor);
    cornice(b,m,w,d,x,y-1.5,z,false);if(walk)surfaces.push({x,z,w,d,y});
  }
  function pier(b:GeometryBatch,x:number,z:number,w:number,d:number,top:number){
    b.box(w*.72,top+52,d*.72,x,(top-52)/2,z,m.base);
    for(let yy=-24;yy<top-6;yy+=14)cornice(b,m,w*.75,d*.75,x,yy,z,false);
    for(const sx of[-1,1])for(const sz of[-1,1]){
      column(b,m,x+sx*w*.38,4,z+sz*d*.38,top-4,Math.min(w,d)*.075);columns++;
    }
    b.box(w,4,d,x,top-2,z,m.stone);
  }
  function palace(x:number,z:number,w:number,d:number,y:number,floors:number,hero=false){
    towers++;const b=new GeometryBatch(true),floorH=8.8;
    pier(b,x,z,w,d,y);
    platform(b,x,z,w+5,d+5,y,hero);
    // Open loggia, with a recessed core and accessible perimeter.
    const coreW=w-8,coreD=d-8;
    b.box(coreW,8,coreD,x,y+4,z,m.stone);
    if(hero)obstacles.push({x,z,w:coreW,d:coreD,minY:y,h:y+floorH});
    for(const side of[-1,1])for(let px=-w/2+1;px<=w/2;px+=4.5){column(b,m,x+px,y,z+side*d/2,8.5,.48);columns++;if(hero)obstacles.push({x:x+px,z:z+side*d/2,w:1.2,d:1.2,minY:y,h:y+8.5});}
    for(const side of[-1,1])for(let pz=-d/2+4.5;pz<d/2-2;pz+=4.5){column(b,m,x+side*w/2,y,z+pz,8.5,.48);columns++;if(hero)obstacles.push({x:x+side*w/2,z:z+pz,w:1.2,d:1.2,minY:y,h:y+8.5});}
    for(let floor=1;floor<=floors;floor++){
      const fy=y+floor*floorH;
      b.box(w,.65,d,x,fy-.3,z,m.stone);cornice(b,m,w,d,x,fy,z,hero);
      for(let side=0;side<4;side++){
        const horizontal=side%2===0?w:d,depth=side%2===0?d:w;
        const n=Math.floor(horizontal/4.5),bay=horizontal/n;
        b.at(x,z,side*Math.PI/2,()=>{
          for(let i=0;i<n;i++)windowBay(b,m,-horizontal/2+(i+.5)*bay,fy+.7,depth/2-.25,bay,floorH-.7);
          if(hero)for(let i=0;i<=n;i++)column(b,m,-horizontal/2+i*bay,fy+.7,depth/2+.4,floorH-.75,.28);
          if(hero&&floor%2===0){
            b.box(horizontal+1,.45,2.4,0,fy+.5,depth/2+.8,m.trim);
            railing(b,m,-horizontal/2,depth/2+1.85,horizontal/2,depth/2+1.85,fy+.75);
            for(let px=-horizontal/2+1;px<horizontal/2;px+=3){b.beam(vec(px,fy-1.5,depth/2),vec(px,fy+.2,depth/2+1.4),.3,.3,m.stone);}
          }
        });
      }
    }
    const roof=y+(floors+1)*floorH;
    b.box(w+.5,.8,d+.5,x,roof,z,m.stone);cornice(b,m,w+.5,d+.5,x,roof+.3,z,hero);
    for(const side of[-1,1]){rail(b,x-w/2,z+side*d/2,x+w/2,z+side*d/2,roof+.7,false);rail(b,x+side*w/2,z-d/2,x+side*w/2,z+d/2,roof+.7,false);}
    if(hero){
      dome(b,m,x,roof+.7,z,Math.min(w,d)*.43);
      for(const side of[-1,1])for(let pz=-d/2;pz<=d/2;pz+=d/2){urn(b,m,x+side*(w/2+1.5),y,z+pz,.9);bush(x+side*(w/2+1.5),y+1,z+pz,1,1.2,70);}
      ivy(x-w/2-2,y,z+d/2+2,14,6);ivy(x+3,roof,z+d/2+.8,8,4);
      for(let f=2;f<=floors;f+=2)for(const offset of[-.3,.3])ivy(x-w/2-1.75,y+f*floorH+1,z+offset*d,6,2);
      // Teal silk standards, bronze rods and a small compass ornament.
      for(const side of[-1,1]){const bx=x+side*w*.31,by=y+15,bz=z+d/2+.85;
        b.box(1.65,5.5,.04,bx,by,bz,m.cloth);b.cylinder(.04,.04,2,bx,by+2.8,bz,m.gold,8,new T.Euler(0,0,Math.PI/2));
        for(let i=0;i<8;i++){const a=i*Math.PI/4;b.beam(vec(bx,by,bz+.04),vec(bx+Math.sin(a)*.47,by+Math.cos(a)*.47,bz+.04),.035,.025,m.gold);}
      }
    }
    b.flush(root);
  }
  function rotunda(x:number,z:number,y:number,r:number,hero=false){
    towers++;const b=new GeometryBatch(true);
    pier(b,x,z,r*1.5,r*1.5,y);
    b.cylinder(r+2,r+2,2,x,y-1.08,z,m.stone,48);b.add(metricUV(new T.CylinderGeometry(r+2,r+2,.12,48),3.8),m.floor,x,y+.01,z);
    if(hero){for(let j=-Math.floor((r+1)/2);j<=Math.floor((r+1)/2);j++){const edge=Math.abs(j*2)+1,w=2*Math.sqrt(Math.max(0,(r+1.65)**2-edge**2));if(w>.5)surfaces.push({x,z:z+j*2,w,d:2.02,y});}}
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
      column(b,m,px,y,pz,10,.5);columns++;
      if(hero)obstacles.push({x:px,z:pz,w:1.1,d:1.1,minY:y,h:y+10});
    }
    b.cylinder(r+1,r+1,1.2,x,y+10.3,z,m.stone,48);b.torus(r+1,.2,x,y+11,z,m.trim);
    b.cylinder(r*.76,r*.76,3,x,y+12.2,z,m.stone,48);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;b.at(x,z,-a,()=>windowBay(b,m,0,y+11.2,r*.76-.2,3.1,3.3));}
    dome(b,m,x,y+13.8,z,r*.82);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,px=x+Math.cos(a)*(r+1.4),pz=z+Math.sin(a)*(r+1.4);urn(b,m,px,y,pz,.7);bush(px,y+.7,pz,.9,1.5,50);}
    if(hero){ivy(x-3,y,z+r+1.7,15,7);ivy(x+r+1.7,y,z,12);}
    b.flush(root);
  }
  function spire(x:number,z:number,y:number,h:number,r=5){
    towers++;const b=new GeometryBatch(true);pier(b,x,z,r*1.7,r*1.7,y);
    b.cylinder(r,r*1.15,h,x,y+h/2,z,m.stone,12);
    for(let yy=0;yy<h;yy+=12){b.cylinder(r*1.2,r*1.2,.7,x,y+yy,z,m.trim,12);for(let i=0;i<8;i++){const a=i*Math.PI/4;b.at(x,z,-a,()=>windowBay(b,m,0,y+yy+1,r-.15,2.8,8));}}
    const top=y+h;for(let i=0;i<8;i++){const a=i*Math.PI/4;column(b,m,x+Math.cos(a)*r*.8,top,z+Math.sin(a)*r*.8,6,.3);}
    b.cylinder(r*.9,r*1.15,.6,x,top+6,z,m.trim,16);b.cylinder(0,r*1.12,h*.48,x,top+6+h*.24,z,m.copper,12);b.sphere(.3,x,top+6+h*.48,z,m.gold);
    b.flush(root);
  }
  // Three connected districts, all bridge decks at the same safe walking elevation.
  const ground=new GeometryBatch(true);
  platform(ground,-19,86,54,40,80);platform(ground,39,38,19,88,80);platform(ground,-39,17,31,38,80);
  rail(ground,-46,106,8,106,80);rail(ground,-46,66,-46,106,80);rail(ground,8,72,8,106,80);
  rail(ground,-46,66,-30,66,80);rail(ground,-16,66,-5,66,80);rail(ground,5,66,8,66,80);
  rail(ground,48.5,-6,48.5,82,80);rail(ground,29.5,30,29.5,82,80);
  for(const p of[[-40,74],[-40,99],[-12,100],[43,70],[43,30],[-51,23],[-50,2]]){urn(ground,m,p[0],80,p[1],1.1);cypress(ground,p[0],81,p[1],7+random()*3);}
  for(let i=0;i<8;i++){const x=-42+i*6;ivy(x,79,106.3,8+random()*14,3);}
  for(const p of[[-40,94],[-29,99]]){ground.box(4.6,.25,1.2,p[0],80.65,p[1],m.trim);for(const s of[-1,1])ground.box(.5,.6,1,p[0]+s*1.7,80.3,p[1],m.stone);obstacles.push({x:p[0],z:p[1],w:4.6,d:1.2,minY:80,h:81});}
  platform(ground,-23,51,14,42,84.8);
  rail(ground,-16,30,-16,72,84.8);rail(ground,-30,30,-30,72,84.8);
  for(const z of[40,58]){urn(ground,m,-28,84.8,z,1.2);cypress(ground,-28,86,z,7);ivy(-15.8,83.8,z,18,3);}
  for(const z of[32,44]){
    urn(ground,m,-16.1,85.95,z,.8);bush(-16.1,86.8,z,1.2,1.1,180);ivy(-15.6,86,z,8,2);
    for(let i=0;i<28;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*.8;ground.sphere(.055,-16.1+Math.cos(a)*r,87.3+random()*.35,z+Math.sin(a)*r,m.flower);}
  }
  pier(ground,-23,50,7,10,83);
  // Two real stair flights join the raised promenade to the lower courts.
  for(let step=1;step<=16;step++)for(const side of[-1,1]){
    const z=side===-1?30-(step-.5)*.5:72+(step-.5)*.5,y=84.8-step*.3;
    ground.box(10,.3,.51,-23,y-.15,z,m.trim);surfaces.push({x:-23,z,w:10,d:.52,y});
  }
  platform(ground,-25,21,13,3,80);

  // Sunken gardens and an armillary fountain give the arrival court a human scale.
  for(const x of[-36,-6]){
    ground.box(5,.5,17,x,80.25,89,m.trim);ground.box(4.5,.08,16.5,x,80.54,89,m.soil);
    for(let z=82;z<97;z+=1.3){bush(x,80.55,z,1.7,.75,85);bush(x+.9,80.55,z,1,.8,40);}
    obstacles.push({x,z:89,w:5,d:17,minY:80,h:81.3});
  }
  const poolX=-21,poolZ=90;
  ground.cylinder(5.8,5.9,.45,poolX,80.22,poolZ,m.stone,64);
  ground.cylinder(5.3,5.3,.08,poolX,80.47,poolZ,m.water,64);
  ground.torus(5.55,.22,poolX,80.55,poolZ,m.trim,new T.Euler(Math.PI/2,0,0),64);
  ground.cylinder(1.2,1.6,.7,poolX,80.8,poolZ,m.trim,24);column(ground,m,poolX,81.1,poolZ,2.5,.45);
  ground.torus(1.7,.065,poolX,85.1,poolZ,m.gold,new T.Euler(.6,0,.3),48);
  ground.torus(1.7,.055,poolX,85.1,poolZ,m.gold,new T.Euler(0,.6,1.5),48);
  ground.sphere(.27,poolX,85.1,poolZ,m.copper);
  for(let j=0;j<8;j++){const a=j*Math.PI/4,pts=[];for(let k=0;k<=24;k++){const t=k/24;pts.push(vec(poolX+Math.cos(a)*t*3.8,83.1+2*t-4.6*t*t,poolZ+Math.sin(a)*t*3.8));}ground.tube(pts,.035,m.water,24);}
  obstacles.push({x:poolX,z:poolZ,w:11.5,d:11.5,minY:80,h:84});
  pier(ground,-35,83,8,20,78);pier(ground,1,83,8,20,78);ground.flush(root);
  function bridge(x:number,z:number,len:number,width:number,y:number,angle=0,walk=true,gaps:number[][]=[]){
    bridges++;const b=new GeometryBatch(true),n=Math.max(2,Math.round(len/15)),span=len/n;
    b.at(x,z,angle,()=>{
      b.box(len,1.4,width,0,y-.76,0,m.stone);b.box(len,.12,width,0,y-.06,0,m.floor);
      for(const side of[-1,1]){for(const [start,end]of railSpans(len,gaps))railing(b,m,start,side*(width/2-.1),end,side*(width/2-.1),y);b.box(len,.25,.4,0,y-1.45,side*width/2,m.trim);}
      for(let i=0;i<=n;i++){const px=-len/2+i*span;column(b,m,px,5,0,y-6,.78);columns++;b.box(2.2,6,width,px,y-4.4,0,m.stone);}
      for(let i=0;i<n;i++){const px=-len/2+(i+.5)*span;archRing(b,m,span*.5-.75,1.15,width-.35,px,y-span*.5-1.5,0);}
    });
    if(walk){const alongZ=Math.abs(Math.sin(angle))>.5;surfaces.push({x,z,w:alongZ?width:len,d:alongZ?len:width,y});
      for(const side of[-1,1]){for(const [start,lo]of railSpans(len,gaps)){const c=(start+lo)/2;obstacles.push({x:x+(alongZ?side*(width/2-.1):c),z:z+(alongZ?-c:side*(width/2-.1)),w:alongZ?.35:lo-start,d:alongZ?lo-start:.35,minY:y,h:y+1.3});}}}
    b.flush(root);
  }
  bridge(0,29,76,8,80,Math.PI/2);bridge(0,-9,80,7,80,0,true,[[-4.5,4.5]]);bridge(19.5,68,25,7,80);
  // Clear openings at intersections; colliders must match the visible bridge openings.
  // Rail gaps are shared by geometry and collision data at the cross bridge.
  palace(43,13,23,30,80,4,true);palace(-49,53,20,22,80,2,true);rotunda(-39,7,80,11,true);
  palace(-49,-67,22,24,68,3,true);rotunda(28,-99,66,10);rotunda(0,-137,112,10,true);
  spire(-69,-22,83,30,4.1);spire(62,-78,72,42,5);spire(-23,-101,62,31,3.5);
  bridge(-18,-63,54,5.5,65,0,false);bridge(21,-144,66,5,92,Math.PI/2,false);
  const distant=[[-99,-136,67,25,4],[-79,-207,58,34,5],[83,-172,67,29,4],[46,-235,70,27,3],[-131,-258,50,38,5],[115,-291,55,33,4],[6,-298,66,40,5],[-32,-366,68,34,4],[-168,-341,60,32,4],[174,-365,57,40,5],[97,-414,60,27,4],[-216,-179,63,36,4],[193,-162,64,30,4]];
  for(let i=0;i<distant.length;i++){const[x,z,y,h,r]=distant[i];if(i%3===0){palace(x,z,18,20,y,2);rotunda(x,z,y+27,7);}else spire(x,z,y,h,r);}
  for(const p of[[-114,-83,61], [113,-106,63],[-18,-225,53],[65,-325,60]]){
    const b=new GeometryBatch(true);pier(b,p[0],p[1],10,10,p[2]);b.cylinder(10,8,2,p[0],p[2],p[1],m.stone,32);b.cylinder(9.4,9.4,.3,p[0],p[2]+1,p[1],m.soil,32);
    for(let j=0;j<7;j++){const a=j*2.4;cypress(b,p[0]+Math.cos(a)*6,p[2]+1.2,p[1]+Math.sin(a)*6,5+random()*4);}b.flush(root);
  }
  // Leaves are individual lit meshes rather than flat green blobs.
  const leafGeo=new T.PlaneGeometry(1,1,1,2),leafPos=leafGeo.attributes.position;
  for(let i=0;i<leafPos.count;i++)leafPos.setZ(i,Math.sin((leafPos.getY(i)+.5)*Math.PI)*.08);leafGeo.computeVertexNormals();
  const density=mobile?2:1,count=Math.ceil(leaves.length/density);
  const foliage=new T.InstancedMesh(leafGeo,m.foliage,count),dummy=new T.Object3D();let index=0;
  for(let i=0;i<leaves.length;i+=density){const l=leaves[i];dummy.position.copy(l.p);dummy.scale.copy(l.s).multiplyScalar(density===2?1.2:1);dummy.rotation.copy(l.r);dummy.updateMatrix();foliage.setMatrixAt(index,dummy.matrix);foliage.setColorAt(index,l.c);index++;}
  foliage.castShadow=true;foliage.receiveShadow=true;root.add(foliage);
  let triangles=0;root.traverse(o=>{if(o instanceof T.Mesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof T.InstancedMesh?o.count:1);});
  return {root,obstacles,surfaces,stats:{towers,bridges,columns,leaves:count,triangles}};
}
