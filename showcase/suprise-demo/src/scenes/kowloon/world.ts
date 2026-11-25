import * as T from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import { awning,laundry,plant,cageLamp } from '../vertigo/props';
import { building,type Building } from './architecture';
import { restaurant } from './restaurant';
import { circulation } from './circulation';
import { sign } from './signs';
import { makeSurfaces,shopObstacles,LEVELS } from './layout';
import type { Materials } from './materials';
export function buildWorld(scene:T.Scene,m:Materials,mobile:boolean){const root=new T.Group();scene.add(root);const b=new GeometryBatch(true),obstacles=[...shopObstacles],surfaces=makeSurfaces(),rand=seededRandom(1989),specs:Building[]=[];
 specs.push({x:-18,z:12,w:18,d:14,floors:27,angle:0,seed:12,hero:true});
 for(let i=0;i<6;i++)specs.push({x:-14-(i%3===2?.7:0),z:-8-i*20.5,w:20.5,d:15+(i%2)*3,floors:[29,31,25,30,28,33][i],angle:Math.PI/2,seed:33+i});
 for(let i=0;i<7;i++)specs.push({x:16+(i%3===2?.8:0),z:17-i*21,w:21,d:17+(i%2)*2,floors:[28,30,27,32,31,29,33][i],angle:-Math.PI/2,seed:67+i});
 specs.push({x:1,z:-128,w:56,d:17,floors:34,angle:0,seed:91});
 for(const side of[-1,1])for(let i=0;i<4;i++)specs.push({x:side*49,z:14-i*37,w:31,d:20,floors:28+Math.floor(rand()*9),angle:-side*Math.PI/2,seed:130+i+(side+1)*8,far:true});
 const built=specs.map(t=>building(t,m,root,obstacles));circulation(b,m,obstacles);const shop=restaurant(root,b,m,obstacles);
 // The lower lane is a complete service alley, with shutters, ducts, bins and stacked crates.
 b.box(230,.3,270,0,-.25,-44,m.concrete);
 b.box(25,.45,146,1,-.225,-44,m.concrete);b.box(24,.04,144,1,.01,-44,m.floor);
 for(const side of[-1,1])for(let i=0;i<14;i++){const x=side===-1?-10.5:11.5,z=17-i*9;
 b.at(x,z,side===-1?Math.PI/2:-Math.PI/2,()=>{b.box(3.2,2.7,.5,0,1.35,-.2,m.paintedMetal[i%4]);for(let y=.15;y<2.7;y+=.1)b.box(3.15,.025,.06,0,y,.08,m.iron);awning(b,m,0,3.1,0,3.8,1.2,i);if(i%3===0){b.box(.8,.9,.7,-1.2,.45,.9,m.wood);b.box(.72,.6,.63,-1.1,1.2,.9,m.wood);for(let k=0;k<4;k++)b.box(.025,.7,.025,-1.55+k*.23,.5,1.27,m.iron);}if(i%4===0)b.cylinder(.32,.27,.8,1.2,.4,1,m.paintedMetal[2],16);});}
 // A second tea room and aged signboards make individual landings legible.
 sign(b,m,15.35,45.8,6,5.2,1.2,'祥興冰室',false,true,-Math.PI/2);sign(b,m,15.45,58.5,18,2.6,10.5,'萬興五金',true,false,-Math.PI/2);sign(b,m,-13.6,46,-45,1.6,5,'永安藥房',true,false,Math.PI/2);sign(b,m,15.4,23,-58,4,1.3,'理髮',false,true,-Math.PI/2);
 for(const y of LEVELS)for(const side of[-1,1])for(let i=0;i<8;i++){const x=side===-1?-13.8:15.8,z=14-i*17;b.at(x,z,side===-1?Math.PI/2:-Math.PI/2,()=>{if(i%3===0){cageLamp(b,m,0,y+2.05,.25);plant(b,m,1,y+.02,1.2,i+y);}if(i%4===1){b.box(.4,.65,.13,.5,y+1.3,.13,m.paintedMetal[2]);b.box(.24,.16,.03,.5,y+1.4,.22,m.glass);}if(i%2===0)laundry(b,m,0,y+2.4,1.6,i+y);});}
 for(const side of[-1,1])for(let i=0;i<12;i++){const x=side===-1?-13.5:15.5,z=(side===-1?-1:20)-i*12;b.tube([vec(x,2,z),vec(x,17,z),vec(x-side*.3,20,z+.4),vec(x-side*.3,44,z+.4),vec(x,47,z),vec(x,98,z)],.065+i%3*.023,i%4===0?m.red:m.rust,32);for(let y=4;y<98;y+=7)b.torus(.09,.022,x,y,z,m.iron);}
 // Cables and laundry hang at irregular depths instead of one repeated screen-wide grid.
 for(let i=0;i<22;i++){const z=17-i*6.4,y=36+(i%6)*9;for(let k=0;k<3;k++)b.tube([vec(-15,y+k*.06,z),vec(-5,y-2.5+k*.08,z-1),vec(5,y-3+k*.09,z-.3),vec(17,y+k*.07,z-1.7)],.013+k*.006,m.black,26);if(i%4===0){b.tube([vec(-14,y-2,z),vec(0,y-3.7,z),vec(16,y-2.5,z)],.009,m.black,28);for(let j=0;j<8;j++)laundry(b,m,-10+j*3.3,y-3-Math.sin(j/8*Math.PI)*.6,z,i+j);}}
 for(const y of[12.4,26.5,40.5,68.5]){b.tube([vec(-14,y,1),vec(-13.4,y,-10),vec(-13.4,y,-75),vec(-14,y,-120)],.18,m.rust,40);b.tube([vec(16,y-1,26),vec(15.4,y-1,-20),vec(15.4,y-1,-90),vec(16,y-1,-125)],.16,m.red,40);}
 // Broken overhead steel, roof rails and a bright opening admit the cold sky.
 for(let z=-15;z> -110;z-=13){b.box(31,.22,.2,1,102+(z%3),z,m.iron);b.beam(vec(-14,95,z),vec(-7,102,z),.12,.15,m.rust);b.beam(vec(16,97,z),vec(8,102,z),.12,.15,m.rust);}
 for(let x=-12;x<15;x+=4)b.box(.1,.12,94,x,102.2,-60,m.rust);
 b.flush(root);
 const candidates:T.Vector3[]=[];for(const y of LEVELS)for(const x of[-12.9,14.9])for(let z=12;z> -112;z-=17)candidates.push(vec(x,y+2,z));
 const lights=Array.from({length:mobile?3:5},()=>{const l=new T.PointLight(0xffbc78,22,10,2);scene.add(l);return l;});let last=-10;
 return{root,obstacles,surfaces,stats:{buildings:specs.length,windows:built.reduce((n,v)=>n+v.windows,0),bridges:5,levels:5},update(t:number,camera:T.Camera){shop.cat.rotation.y=-.6+Math.sin(t*.23)*.04;if(t-last>.5){last=t;const nearest=candidates.map(p=>({p,d:p.distanceToSquared(camera.position)})).sort((a,b)=>a.d-b.d);lights.forEach((l,i)=>l.position.copy(nearest[i].p));built.forEach(v=>v.props.visible=v.center.distanceTo(camera.position)<(mobile?75:120));}}};
}
