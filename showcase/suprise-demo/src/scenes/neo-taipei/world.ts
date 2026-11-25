import * as T from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import type { Materials } from './materials';
import type { Obstacle } from '../../shared/types';
import { buildTerrace } from './props';
import { tower,buildCitadel } from './architecture';
import { buildLandscape,islands } from './landscape';
import { buildRoad } from './roads';
import { ringPoints,linkPoints,pathHeight,walkSurfaces,citadelObstacles } from './layout';
import { sign } from './signs';
export function buildWorld(scene:T.Scene,m:Materials,mobile:boolean){
 const root=new T.Group();scene.add(root);const b=new GeometryBatch(),obstacles:Obstacle[]=[...citadelObstacles];const cat=buildTerrace(root,b,m,obstacles);buildRoad(b,m,ringPoints,9);buildRoad(b,m,linkPoints,7);const trees=buildLandscape(root,b,m,mobile);buildCitadel(b,m);for(let x=78;x<197;x+=12)obstacles.push({x,z:-263,w:6,d:12,minY:130,h:138});
 tower(b,m,-59,-62,25,24,157,13);tower(b,m,-101,-68,29,29,195,4);
 sign(b,m,-101,112,-52.8,9.5,58,'新台北','#71ddff',true,0,'NEO TAIPEI · 2089');
 const portrait=new T.MeshStandardMaterial({map:m.portrait,emissiveMap:m.portrait,emissive:0xffffff,emissiveIntensity:1.55,roughness:.3,metalness:.1});b.box(23,55,.55,-59,111,-49.3,m.steel);b.plane(22,54,-59,111,-48.98,portrait);sign(b,m,-59,143,-48.8,22,5,'NEXUS','#81dcff',false,0,'MEMORIES BEYOND TOMORROW');
 sign(b,m,182,68,-109,12,20,'晶核','#ff61df',true,0,'AI CORE · 2089');
 const rand=seededRandom(2089);let buildings=10;
 for(let i=0;i<160;i++){const x=-270+rand()*560,z=-530+rand()*625,w=12+rand()*18,d=12+rand()*18;
 if(z>0&&x<80&&x>-70)continue;if(Math.hypot(x+59,z+62)<35||Math.hypot(x+101,z+68)<35)continue;
 if(pathHeight(ringPoints,Math.max(w,d)+17,x,z)!==undefined||pathHeight(linkPoints,Math.max(w,d)+14,x,z)!==undefined)continue;
 if(islands.some(c=>Math.hypot((x-c.x)/(c.rx+w*.6),(z-c.z)/(c.rz+d*.6))<1.16))continue;
 const corridor=x> -20&&x<140&&z> -270;const h=corridor?24+rand()*38:35+rand()*115+(z< -250?rand()*100:0);tower(b,m,x,z,w,d,h,i+27);buildings++;obstacles.push({x,z,w,d,h});}
 // Far skyline, smaller towers behind the central silhouette.
 for(let i=0;i<24;i++){const x=-330+i*29,z=-570-rand()*55,h=70+rand()*170;tower(b,m,x,z,14+rand()*8,18,h,i+300);buildings++;}
 b.flush(root);
 const gardenLight=new T.PointLight(0xff5db4,320,70,2);gardenLight.position.set(164,62,-104);scene.add(gardenLight);
 return{root,obstacles,surfaces:walkSurfaces,stats:{buildings,trees,roads:2},update(t:number){cat.rotation.y=-.25+Math.sin(t*.25)*.08;}};
}
