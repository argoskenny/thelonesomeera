import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import type { Materials } from './materials';
import type { Obstacle } from '../../shared/types';
import { sign } from './signs';
import { STAIR,stairHeight } from './layout';
function rail(b:GeometryBatch,m:Materials,a:T.Vector3,c:T.Vector3){for(const h of[.18,.62,1.15])b.beam(a.clone().add(vec(0,h,0)),c.clone().add(vec(0,h,0)),h===1.15?.09:.05,.08,m.iron);const n=Math.ceil(a.distanceTo(c)/2.4);for(let i=0;i<=n;i++){const p=a.clone().lerp(c,i/n);b.box(.1,1.22,.1,p.x,p.y+.61,p.z,m.steel);b.box(.25,.05,.25,p.x,p.y+.02,p.z,m.rust);}}
function light(root:T.Object3D,color:number,intensity:number,distance:number,x:number,y:number,z:number){const l=new T.PointLight(color,intensity,distance,2);l.position.set(x,y,z);root.add(l);}
export function buildTerrace(root:T.Object3D,b:GeometryBatch,m:Materials,obstacles:Obstacle[]){
 b.box(32,1.2,34,-36,59.4,74,m.concrete);b.box(32,.1,34,-36,59.95,74,m.floor);
 for(let x=-51;x<-20;x+=2.8)b.box(.025,.012,34,x,60.008,74,m.iron);for(let z=58;z<92;z+=2.8)b.box(32,.012,.025,-36,60.01,z,m.iron);
 for(let z=58;z<90;z+=5){b.box(.8,.025,1.5,-21,60.018,z,m.iron);for(let k=0;k<8;k++)b.box(.6,.03,.035,-21,60.04,z-.6+k*.17,m.steel);}
 for(const [a,c]of[[vec(-52,60,57),vec(-27,60,57)],[vec(-21,60,57),vec(-20,60,57)],[vec(-20,60,57),vec(-20,60,91)],[vec(-20,60,91),vec(-52,60,91)]])rail(b,m,a,c);
 // Load-bearing brackets, pipes and lit underside remain visible when flying below the deck.
 for(let z=58;z<92;z+=5){b.beam(vec(-51,44,z),vec(-21,59,z),.6,.8,m.iron);b.box(32,.4,.5,-36,58.6,z,m.steel);b.box(5,.11,.15,-28,58.8,z,m.amber);}
 b.box(10,60,34,-47,30,74,m.concrete);b.box(.4,8,34,-51.7,64,74,m.iron);
 for(const z of[57.5,90.5])b.box(10,8,.4,-47,64,z,m.iron);
 b.box(10,.3,34,-47,68,74,m.iron);
 // Open storefront: doorway at z=74, actual interior behind the windows.
 for(const z of[61,67,81,87]){b.box(.16,5,4.8,-41.85,63,z,m.glass);b.box(.3,.3,5,-41.8,65.5,z,m.steel);b.box(.3,.3,5,-41.8,60.5,z,m.steel);}
 for(const z of[58.5,63.5,69.5,78.5,83.5,89.5])b.box(.3,7,.2,-41.75,63.5,z,m.steel);
 // Recessed menu boards and bottle shelves add depth behind the warm storefront.
 sign(b,m,-51.05,64,65,4.5,1.8,'醬油拉麵','#f5b16e',false,Math.PI/2,'豚骨 180 · 味噌 200 · 深夜限定');
 for(let z=61;z<89;z+=2.4){b.box(.75,.12,2,-50.4,62.4,z,m.wood);for(let k=0;k<4;k++){b.cylinder(.07,.1,.35,-50.35,62.64,z-.65+k*.4,m.glass,10);b.cylinder(.035,.035,.16,-50.35,62.89,z-.65+k*.4,m.steel,8);}}
 b.box(1.7,1,22,-47,60.5,74,m.wood,.08);b.box(1.9,.12,22,-47,61.06,74,m.steel,.04);
 b.box(.22,3.5,30,-51.3,62,74,m.wood);
 for(let z=59;z<90;z+=.65)b.box(.04,3.5,.035,-51.16,62,z,m.iron);
 b.box(.08,.045,29,-51.1,63.8,74,m.amber);
 for(let z=62;z<88;z+=3.3){b.cylinder(.44,.44,.13,-44.8,60.88,z,m.wood);b.cylinder(.07,.1,.85,-44.8,60.44,z,m.steel);b.cylinder(.34,.38,.08,-44.8,60.04,z,m.iron);b.cylinder(.25,.15,.16,-46.8,61.2,z,m.porcelain,24);b.cylinder(.22,.22,.015,-46.8,61.28,z,m.warm,24);for(const dx of[-.06,.06])b.box(.025,.025,.55,-46.8+dx,61.31,z,m.wood,0,new T.Euler(0,.4,0));}
 for(const z of[62,72,84]){b.cylinder(.3,.36,.8,-43,65.9,z,m.amber,24);for(let y=65.55;y<66.3;y+=.1)b.torus(.34,.012,-43,y,z,m.rust);light(root,0xff9c43,95,14,-44,64,z);}
 sign(b,m,-41.45,64.2,84,5.5,1.8,'深夜食堂','#ffc17b',false,Math.PI/2,'RAMEN · SAKE · OPEN ALL NIGHT');
 sign(b,m,-39.5,65.7,61.5,1.8,3.5,'深夜拉麵','#ff534f',true,0,'MIDNIGHT RAMEN',true);
 light(root,0xff294d,22,19,-37,64,63);light(root,0x178cff,75,28,-27,62,60);
 // Industrial upper floors frame the city, rather than blocking the view.
 b.box(10,27,34,-47,81.5,74,m.iron);
 for(let y=72;y<95;y+=6)for(let z=61;z<90;z+=5){b.plane(3,3,-41.95,y,z,m.window,Math.PI/2);b.box(.5,.2,3.5,-41.6,y-1.6,z,m.steel);}
 for(let z=58;z<90;z+=6){b.box(1.2,.8,1.6,-40.8,70.5,z,m.steel);b.cylinder(.3,.3,.09,-40.13,70.5,z,m.iron,20,new T.Euler(0,0,Math.PI/2));for(let y=70.15;y<70.9;y+=.1)b.box(.03,.025,1.3,-40.12,y,z,m.steel);}
 for(let z=62;z<=83;z+=7){b.box(9,.22,.22,-41,69,z,m.iron);b.beam(vec(-42,72,z),vec(-36.5,69,z),.13,.13,m.steel);b.box(5,.03,4,-40.5,69.15,z,m.iron);b.box(2,.05,.12,-38.5,68.85,z,m.amber);}
 for(let i=0;i<7;i++)b.tube([vec(-42,72+i*.3,59),vec(-37,68+i*.35,68),vec(-30,67.8+i*.4,78),vec(-25,69+i*.2,87)],.035+i*.008,m.iron,32);
 for(let i=0;i<4;i++)b.tube([vec(-41.4,60,59+i*.24),vec(-41.4,67,59+i*.24),vec(-41.4,68,64+i*.24),vec(-41.4,68,89)],.065,m.rust,20);
 for(const z of[67,83]){b.box(.32,1.2,.8,-41.3,62,z,m.steel,.04);for(let k=0;k<4;k++)b.box(.05,.04,.04,-41.1,62.4-k*.22,z-.2,m.cyan);}
 // Continuous ramp-shaped collision surface follows the visible 68 treads.
 for(let i=0;i<STAIR.steps;i++){const z=23+(i+.5)*34/STAIR.steps,y=stairHeight(z);b.box(5,.12,34/STAIR.steps+.03,-24,y-.06,z,m.steel);if(i%4===0)b.box(4.7,.035,.05,-24,y+.02,z-.22,m.amber);}
 for(const x of[-26.5,-21.5]){rail(b,m,vec(x,40,23),vec(x,60,57));b.beam(vec(x,39.5,23),vec(x,59.5,57),.22,.5,m.iron);}
 b.box(48,.8,12,-4,39.6,20,m.concrete);b.box(48,.06,12,-4,39.97,20,m.road);rail(b,m,vec(-28,40,14),vec(20,40,14));rail(b,m,vec(-21,40,26),vec(20,40,26));
 obstacles.push({x:-51.7,z:74,w:.5,d:34,h:95},{x:-47,z:57.5,w:10,d:.5,h:68},{x:-47,z:90.5,w:10,d:.5,h:68},{x:-47,z:74,w:1.9,d:22,h:61.2},{x:-47,z:74,w:10,d:34,minY:68,h:95});
 for(const [z,d]of[[64,13],[84.5,13]])obstacles.push({x:-41.85,z,w:.35,d,h:66});
 return createCat(root,m);
}
function createCat(root:T.Object3D,m:Materials){const group=new T.Group(),b=new GeometryBatch();
 b.sphere(.36,0,.55,0,m.iron,vec(.8,1.5,1));b.sphere(.27,0,1.08,-.12,m.steel,vec(1,1,.9));
 for(const x of[-.18,.18]){b.cylinder(0,.12,.34,x,1.37,-.1,m.iron,3,new T.Euler(.1,0,x>0?-.25:.25));b.sphere(.035,x*.63,1.12,-.354,m.cyan,vec(1,.6,.5));b.sphere(.12,x,.13,-.3,m.iron,vec(1,.7,1.6));b.cylinder(.07,.09,.5,x,.36,-.22,m.steel,8);b.sphere(.15,x,.28,.15,m.iron);}
 b.torus(.22,.035,0,.89,-.07,m.cyan);b.tube([vec(.1,.18,.2),vec(.4,.12,.45),vec(.66,.16,.4),vec(.72,.38,.25)],.055,m.iron,24);b.box(.2,.2,.035,0,.61,-.34,m.steel,.04);b.box(.07,.06,.04,0,.62,-.37,m.cyan);
 b.flush(group);group.position.set(-30,60,62);group.rotation.y=-.25;root.add(group);return group;}
