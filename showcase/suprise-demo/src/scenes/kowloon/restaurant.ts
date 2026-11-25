import * as T from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import { railing,airConditioner,cageLamp,plant } from '../vertigo/props';
import { makeTexture,noise } from '../../shared/procedural';
import { sign,signMaterial } from './signs';
import type { Materials } from './materials';
import type { Obstacle } from '../../shared/types';
function point(root:T.Object3D,color:number,power:number,d:number,x:number,y:number,z:number){const l=new T.PointLight(color,power,d,2);l.position.set(x,y,z);root.add(l);return l;}
function chair(b:GeometryBatch,m:Materials,x:number,y:number,z:number,angle=0){b.at(x,z,angle,()=>{b.box(.44,.08,.43,0,y+.47,0,m.redSeat,.04);for(const xx of[-.18,.18])for(const zz of[-.17,.17])b.cylinder(.02,.028,.45,xx,y+.23,zz,m.aluminum,8);b.box(.4,.3,.045,0,y+.78,.2,m.redSeat,.04);for(const xx of[-.18,.18])b.box(.025,.4,.025,xx,y+.67,.19,m.aluminum);});}
function cup(b:GeometryBatch,m:Materials,x:number,y:number,z:number){b.cylinder(.055,.041,.11,x,y+.055,z,m.enamel,20);b.cylinder(.048,.048,.005,x,y+.113,z,m.wood,20);b.torus(.035,.009,x+.055,y+.065,z,m.enamel,new T.Euler(Math.PI/2,Math.PI/2,0),16);b.cylinder(.085,.085,.012,x,y,z,m.enamel,20);}
function fan(b:GeometryBatch,m:Materials,x:number,y:number,z:number){b.cylinder(.045,.07,.55,x,y-.35,z-.1,m.iron,10);b.cylinder(.27,.27,.10,x,y,z,m.iron,24,new T.Euler(Math.PI/2,0,0));for(let i=0;i<3;i++){const a=i*Math.PI*2/3;b.sphere(.12,x+Math.cos(a)*.13,y+Math.sin(a)*.13,z+.06,m.aluminum,vec(1,.5,.12));}for(const r of[.11,.18,.24,.29])b.torus(r,.006,x,y,z+.09,m.aluminum,new T.Euler(),32);for(let i=0;i<10;i++){const a=i*Math.PI/5;b.beam(vec(x,y,z+.1),vec(x+Math.cos(a)*.29,y+Math.sin(a)*.29,z+.1),.006,.006,m.aluminum);}b.cylinder(.04,.04,.025,x,y,z+.11,m.iron,16,new T.Euler(Math.PI/2,0,0));}
export function restaurant(root:T.Object3D,b:GeometryBatch,m:Materials,obstacles:Obstacle[]){
 b.box(16,.25,7,-18,27.875,8.5,m.concrete);b.box(16,.035,7,-18,28.01,8.5,m.floor);
 b.box(19,.35,13,-16.5,27.825,17.5,m.concrete);b.box(19,.035,13,-16.5,28.01,17.5,m.floor);
 for(const x of[-26.1,-9.9])b.box(.2,3.8,7,x,29.9,8.5,m.walls[2]);b.box(16,3.8,.2,-18,29.9,5,m.walls[0]);b.box(16,.2,7,-18,31.8,8.5,m.walls[2]);
 // Tiled dado, exposed seams and worn timber form the lower half of the room.
 b.box(15.8,1.3,.06,-18,28.65,5.13,m.teal);for(let x=-25.5;x< -10;x+=.27)b.box(.012,1.3,.01,x,28.65,5.17,m.concrete);for(const yy of[28.3,28.65,29])b.box(15.8,.012,.012,-18,yy,5.18,m.concrete);
 b.box(5.8,1.03,1.1,-22.8,28.515,6.9,m.teal);b.box(5.95,.075,1.18,-22.8,29.07,6.9,m.steel,.03);
 b.box(3.1,1.3,.95,-24.15,29.75,6.9,m.windowGlass);for(const x of[-25.7,-22.6])for(const z of[6.45,7.35])b.box(.035,1.4,.035,x,29.8,z,m.aluminum);b.box(3.15,.045,1,-24.15,30.5,6.9,m.steel);
 for(let i=0;i<14;i++){const x=-25.4+(i%7)*.39,z=6.7+Math.floor(i/7)*.35;b.cylinder(.12,.12,.025,x,29.18,z,m.enamel,18);b.sphere(.105,x,29.26,z,m.shade,vec(1,.7,1));}
 for(const x of[-21.9,-21.3,-20.6]){b.cylinder(.19,.19,.36,x,29.29,6.8,m.steel,24);b.torus(.19,.02,x,29.48,6.8,m.iron);b.sphere(.04,x,29.53,6.8,m.wood,vec(1,.4,1));b.torus(.16,.025,x+.16,29.3,6.8,m.iron,new T.Euler(0,0,0));}
 for(let i=0;i<4;i++)cup(b,m,-20.8+i*.25,29.13,7.25);
 for(let x=-25.3;x< -20;x+=1.3){b.cylinder(.23,.23,.08,x,28.56,8.15,m.redSeat,20);for(const dx of[-.15,.15])for(const dz of[-.15,.15])b.cylinder(.017,.024,.54,x+dx,28.27,8.15+dz,m.aluminum,8);}
 // Individual restaurant tables, crockery and diner stools remain true 3D props.
 for(const [x,z]of[[-21,10.3],[-15.6,8],[-13,10.4],[-19,16],[-24,16.4]]){const yy=28;b.box(1.15,.07,.8,x,yy+.78,z,m.enamel,.035);for(const dx of[-.46,.46])for(const dz of[-.29,.29])b.cylinder(.026,.031,.74,x+dx,yy+.38,z+dz,m.aluminum,8);
 chair(b,m,x-.85,yy,z,-Math.PI/2);chair(b,m,x+.85,yy,z,Math.PI/2);cup(b,m,x-.3,yy+.82,z+.13);cup(b,m,x+.3,yy+.82,z-.14);b.cylinder(.13,.13,.018,x,yy+.82,z,m.enamel,24);b.box(.12,.17,.1,x+.36,yy+.9,z+.26,m.wood,.02);for(let k=0;k<5;k++)b.box(.008,.19,.008,x+.33+k*.015,yy+1.02,z+.26,m.wood);obstacles.push({x,z,w:1.15,d:.8,minY:28,h:28.82});}
 b.box(3,.42,.65,-12.1,28.21,5.7,m.redSeat,.09);b.box(3,.75,.13,-12.1,28.72,5.4,m.redSeat,.08);
 for(const x of[-24,-18,-12]){b.cylinder(.012,.012,.35,x,31.55,8.8,m.iron,8);b.cylinder(.12,.34,.18,x,31.27,8.8,m.paintedMetal[3],32);b.sphere(.09,x,31.18,8.8,m.bulb);point(root,0xffbd71,45,11,x,31.05,8.8);}
 fan(b,m,-17,30.6,5.55);fan(b,m,-25.2,30.7,5.55);
 // Shelves, bottles, clock, extractor hood and menu prices ground the restaurant in everyday scale.
 for(const y of[29.9,30.55]){b.box(5.2,.06,.4,-22.5,y,5.38,m.wood);for(let i=0;i<17;i++){const x=-24.8+i*.29;b.cylinder(.045,.054,.22,x,y+.14,5.4,m.paintedMetal[i%4],10);b.cylinder(.02,.024,.08,x,y+.28,5.4,m.iron,8);}}
 b.box(2.6,.5,1.3,-20.5,31.25,6.5,m.steel);b.cylinder(.2,.2,2,-20.5,32.4,6.3,m.steel,20);
 const clockMap=document.createElement('canvas');clockMap.width=clockMap.height=256;const cx=clockMap.getContext('2d')!;cx.fillStyle='#c4b89d';cx.fillRect(0,0,256,256);cx.strokeStyle='#322b22';cx.lineWidth=7;cx.beginPath();cx.arc(128,128,114,0,Math.PI*2);cx.stroke();cx.font='20px serif';cx.textAlign='center';cx.textBaseline='middle';for(let i=1;i<=12;i++)cx.fillText(String(i),128+Math.sin(i*Math.PI/6)*91,128-Math.cos(i*Math.PI/6)*91);cx.beginPath();cx.moveTo(128,128);cx.lineTo(95,102);cx.moveTo(128,128);cx.lineTo(171,75);cx.stroke();const cm=new T.CanvasTexture(clockMap);cm.colorSpace=T.SRGBColorSpace;b.plane(.65,.65,-14.8,30.7,5.2,new T.MeshStandardMaterial({map:cm,roughness:.8}));
 sign(b,m,-17,30.6,5.2,3.3,.7,'奶茶 · 菠蘿油',false,false,0,'絲襪奶茶 18　叉燒飯 38　乾炒牛河 48');
 // Recessed threshold, sliding frames and a rusted illuminated enamel shop sign.
 for(const x of[-26,-10])b.box(.15,3.8,.25,x,29.9,12,m.wood);b.box(16,.12,.3,-18,31.68,12,m.wood);
 b.box(10.2,3.46,.22,-18,33.46,12.25,m.iron,.02);b.plane(10,3.33,-18,33.46,12.38,m.signMat);
 for(const x of[-22,-14]){b.tube([vec(x,35.3,12),vec(x,35.55,12.6),vec(x,35.15,13.1)],.025,m.rust,12);b.cylinder(.13,.2,.15,x,35.1,13.1,m.iron,16);b.sphere(.07,x,34.99,13.1,m.bulb);const l=new T.SpotLight(0xffd497,34,9,.75,.6,2);l.position.set(x,35,13);l.target.position.set(x,33.2,12.3);root.add(l,l.target);}
 sign(b,m,-24.9,29.95,12.4,1.6,2.6,'茶餐廳',true,false);sign(b,m,-8.8,36.4,14.2,1.5,4.7,'大昌押',true,true);
 point(root,0xff6426,32,9,-8.5,34,13);
 cageLamp(b,m,-10,30.2,12.2);airConditioner(b,m,-11.2,36.8,12.4,3);
 for(const x of[-25.9,-10.2]){b.cylinder(.09,.09,10,x,33,12.55,m.rust,12);for(let yy=28.2;yy<38;yy+=.7)b.torus(.10,.021,x,yy,12.55,m.iron);}
 b.tube([vec(-27,35.5,12.7),vec(-20,35.5,12.7),vec(-10.3,35.5,12.7),vec(-8.6,34.5,12.7),vec(-8.6,31.5,12.7)],.14,m.red,40);
 for(let i=0;i<7;i++)b.tube([vec(-27,37+i*.04,12.6),vec(-19,36.7+i*.1,13.1),vec(-10,37.1+i*.05,12.8),vec(-8,36.3+i*.07,13.3)],.018,m.black,24);
 for(const z of[13,20,23])plant(b,m,-7.6,28,z,Math.round(z*91));plant(b,m,-25,28,21,51);plant(b,m,-22,28,22.9,48);
 for(const z of[11.3,16,21.8])b.beam(vec(-26,24,z),vec(-7.2,27.7,z),.25,.3,m.iron);
 const rail=(a:T.Vector3,c:T.Vector3)=>{railing(b,m,a,c,1.05);obstacles.push({x:(a.x+c.x)/2,z:(a.z+c.z)/2,w:Math.abs(a.x-c.x)+.06,d:Math.abs(a.z-c.z)+.06,minY:28,h:29.1});};
 rail(vec(-7,28,11),vec(-7,28,24));rail(vec(-26,28,24),vec(-11.65,28,24));rail(vec(-8.35,28,24),vec(-7,28,24));rail(vec(-26,28,12),vec(-26,28,24));
 b.box(.5,1.12,.55,-7.25,28.56,14.3,m.concrete);const cat=createCat(m);cat.position.set(-7.25,29.12,14.3);cat.rotation.y=-.6;root.add(cat);
 return {cat};
}
function createCat(m:Materials){const b=new GeometryBatch(),root=new T.Group(),fur=makeTexture(256,(x,y)=>{const stripes=Math.sin(y*.13+noise(x*.07,y*.05)*5)>.55,n=noise(x*.6,y*.6);return stripes?[58+n*25,43+n*18,28+n*12]:[149+n*35,104+n*26,55+n*21];}),coat=new T.MeshStandardMaterial({map:fur,roughness:.93,bumpMap:fur,bumpScale:.003}),eye=new T.MeshStandardMaterial({color:0x9aa348,roughness:.18});
 b.sphere(.24,0,.36,0,coat,vec(.85,1.55,1));b.sphere(.19,0,.76,-.045,coat,vec(1,.9,.9));for(const side of[-1,1]){b.cylinder(0,.09,.22,side*.12,.94,-.03,coat,3,new T.Euler(0,0,-side*.2));b.sphere(.035,side*.09,.79,-.2,eye,vec(1,.65,.35));b.sphere(.013,side*.09,.79,-.211,m.black,vec(.5,1,.2));b.sphere(.055,side*.1,.055,-.17,coat,vec(1,.7,1.5));b.cylinder(.043,.055,.35,side*.1,.22,-.13,coat,10);b.sphere(.095,side*.14,.17,.1,coat,vec(1,1.5,1.1));}b.sphere(.045,0,.69,-.18,m.linen,vec(1,.6,1));b.sphere(.018,0,.72,-.221,m.black);b.tube([vec(0,.12,.18),vec(.25,.04,.35),vec(.45,.06,.18),vec(.41,.1,0)],.035,coat,24);b.flush(root);return root;}
