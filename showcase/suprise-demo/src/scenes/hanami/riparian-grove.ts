import * as T from 'three';
import { Instances, texture, tint } from './promenade-geometry';
import { seededRandom } from '../../shared/geometry';

function atlasPlanes(columns:number,rows:number){
  return Array.from({length:columns*rows},(_,i)=>{
    const g=new T.PlaneGeometry(1,1);g.translate(0,.5,0);
    const u=g.attributes.uv,c=i%columns,row=rows-1-Math.floor(i/columns);
    for(let k=0;k<u.count;k++)u.setXY(k,(c+.004+u.getX(k)*.992)/columns,(row+.004+u.getY(k)*.992)/rows);
    return g;
  });
}

export function addRiparianGrove(pool:Instances) {
  const rand=seededRandom(85923);
  const woody=atlasPlanes(4,2), hedge=atlasPlanes(4,1);
  function cutout(file:string) {
    const m=new T.MeshBasicMaterial({map:texture('hanami/'+file),side:T.DoubleSide,alphaTest:.42});
    m.userData.castShadow=false;return m;
  }
  const trees=cutout('promenade-copse.webp'),shrubs=cutout('promenade-thicket.webp');
  function tree(x:number,y:number,z:number,h:number,species:number) {
    // Crossed, offset crowns preserve parallax when viewed from the flying camera.
    const yaw=rand()*Math.PI,diameter=h*(.73+rand()*.24);
    const tone=tint(.67+rand()*.22);
    for(let j=0;j<2;j++)pool.add(woody[species],trees,x,y-.12,z,diameter*(j===1?.96:1),h,1,yaw+j*Math.PI/2,0,0,tone);
  }
  function bush(x:number,y:number,z:number,w:number,h:number,species:number){
    const angle=rand()*Math.PI, shade=species===1?new T.Color(.31,.19,1.12):tint(.65+rand()*.27);
    for(let j=0;j<3;j++){
      const yaw=angle+j*1.0472;
      pool.add(hedge[species],shrubs,x+Math.cos(yaw)*w*.11,y-h*.13,z+Math.sin(yaw)*w*.11,
        w*(.94+rand()*.1),h*(.89+rand()*.14),1,yaw,0,0,shade);
    }
  }
  // Village boundary trees form small groves separated by driveways and open meadows.
  // Several depths let the nearby bank move independently of the foothills on the skyline.
  for(const side of [-1,1]){
    for(let row=0;row<4;row++){
      for(let z=-213;z<132;z+=(row===0?3.7:6.0)+rand()*5.8){
        const species=[0,2,3,4,5,6,7][Math.floor(rand()*7)];
        const margin=Math.sin(z*.085+.9*row+side)>.51;
        if(row===0&&margin)continue;
        const x=side*(side>0?53:52)+side*(row*12+rand()*10);
        tree(x,-2.12,z,(row===0?3.8:5.8)+rand()*(row===0?6:8),species);
        if(row===0)bush(x-side*3,-1.98,z,4+rand()*3,2.4+rand()*2.4,rand()<.5?2:0);
      }
    }
  }
  // Close woodland and reed belts alternate with revealed garden facades.
  for(let z=-183;z<107;z+=1.8+rand()*2.7){
    const tide=Math.sin(z*.14+1);
    const zz=z+rand()*2;
    bush(-29.8-rand()*4.2,-1.64,zz,2.3+rand()*2.4,1.0+rand()*1.7,rand()<.4?2:0);
    if(tide>.14)tree(-33.4-rand()*3,-1.63,zz,2.9+rand()*2.25,rand()>.4?5:0);
    if(tide<.7)bush(14.4+rand()*2.0,-1.19,z,2.1+rand()*2.3,1.3+rand()*1.7,rand()<.6?0:2);
    if(tide>.61)tree(20+rand()*3,-1.95,z+1.7,3.3+rand()*2.0,rand()>.65?5:6);
  }
  for(let z=-168;z<91;z+=.57+rand()*.64){
    if(Math.sin(z*.11+.68)<-.54||Math.abs(z+104)<3)continue;
    const x=5.55+rand()*1.33;
    const species=Math.sin(z*.050+1)>.2?1:rand()<.4?2:0;
    bush(x,-.16,z,1.20+rand()*.77,.60+rand()*.34,species);
  }
  // Beyond the ends of the walking route, copses screen the field edges.
  for(const base of [-203,121])for(let i=0;i<54;i++){
    const x=-68+rand()*134;
    if(x< -8&&x> -24)continue;
    tree(x,-2,base+(rand()-.5)*15,3.3+rand()*6,Math.floor(rand()*8));
  }
}
