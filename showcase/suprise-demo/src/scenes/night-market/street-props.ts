import * as THREE from 'three';
import { GeometryBatch,vec } from './geometry';
import { signMaterial,type NightMaterials } from './materials';
import { bottle } from './props';

export function vendingMaterials(){
  return ['島嶼冷飲','夜市咖啡','冰涼茶屋'].map((name,i)=>({
    header:signMaterial({text:name,bg:['#264e48','#782b26','#d4c6a1'][i],ink:['#f5ead1','#f5ead1','#23433f'][i],sub:'COLD DRINKS · 24H',glow:.84}),
    prices:signMaterial({text:'25　30　25　35',bg:'#1b2424',ink:'#e7d8ad',sub:'冰涼　冰涼　冰涼　冰涼',glow:.62}),
    panel:signMaterial({text:'30',bg:'#0f2926',ink:'#a8d8a7',sub:'請投入硬幣',glow:.8}),
  }));
}
export function vendingMachine(b:GeometryBatch,m:NightMaterials,index:number,mats:ReturnType<typeof vendingMaterials>){
  const style=index%3,paint=[m.plasticGreen,m.plasticRed,m.porcelain][style],matsFor=mats[style];
  b.box(1.20,2.09,.80,0,1.115,0,paint,.045);b.box(1.05,1.40,.04,-.03,1.30,.421,m.black,.025);
  for(const x of[-.48,.48])for(const z of[-.29,.29])b.box(.12,.11,.12,x,.06,z,m.iron);
  b.box(.87,1.21,.028,-.11,1.32,.45,m.porcelain);
  for(let row=0;row<3;row++){
    for(let col=0;col<4;col++){
      const x=-.435+col*.215,y=.80+row*.36;
      bottle(b,m,x,y,.515,[m.plasticRed,m.plasticGreen,m.plasticBlue,m.bamboo][(col+row+style)%4]);
      b.cylinder(.035,.035,.025,x,y-.07,.62,m.coolBulb,10,new THREE.Euler(Math.PI/2,0,0));
    }
    b.box(.87,.025,.17,-.11,.79+row*.36,.49,m.aluminum);
    b.plane(.84,.075,-.11,.72+row*.36,.61,matsFor.prices);
  }
  b.box(.018,1.12,.025,-.55,1.31,.62,m.coolBulb);b.box(.018,1.12,.025,.32,1.31,.62,m.coolBulb);
  b.box(.89,1.15,.007,-.11,1.34,.645,m.glass);
  b.box(.15,.55,.032,.48,1.35,.46,m.iron,.02);b.plane(.13,.16,.48,1.50,.481,matsFor.panel);
  b.box(.09,.014,.022,.48,1.31,.491,m.black);b.cylinder(.037,.037,.024,.48,1.16,.49,m.gold,12,new THREE.Euler(Math.PI/2,0,0));
  b.box(.62,.24,.05,-.11,.40,.43,m.black,.035);b.box(.58,.04,.095,-.11,.3,.49,m.aluminum);
  b.box(.22,.07,.04,.45,.7,.44,m.black,.01);b.box(.028,.30,.02,.568,.92,.46,m.aluminum);
  b.plane(1.04,.25,0,2.0,.421,matsFor.header);
  // Side graphics on both sides, a vent and a plugged-in power cable.
  b.plane(.64,.50,.61,1.4,0,matsFor.header,Math.PI/2);b.plane(.64,.50,-.61,1.4,0,matsFor.header,-Math.PI/2);
  for(let q=0;q<7;q++)b.box(.32,.014,.03,.29,.30+q*.037,-.42,m.iron);
  b.tube([vec(.42,.12,-.4),vec(.55,.03,-.6),vec(.66,.06,-.72),vec(.66,.39,-.80)],.015,m.black,5);
}
export function planter(b:GeometryBatch,m:NightMaterials,x:number,z:number,index:number){
  b.cylinder(.26,.18,.41,x,.3,z,m.gateRed,16);
  for(let q=0;q<13;q++){
    const a=q*2.4,r=.16+(q%4)*.05,y=.6+(q%5)*.12;
    b.tube([vec(x,.48,z),vec(x+Math.cos(a)*r*.5,y*.9,z+Math.sin(a)*r*.5),vec(x+Math.cos(a)*r,y,z+Math.sin(a)*r)],.007,m.bamboo,4);
    b.sphere(.13,x+Math.cos(a)*r,y,z+Math.sin(a)*r,m.greens,vec(1,.17,1.8));
  }
  if(index%2===0)b.cylinder(.29,.29,.026,x,.11,z,m.plasticGreen,16);
}
export function lanternString(b:GeometryBatch,m:NightMaterials,points:THREE.Vector3[],count:number){
  const curve=new THREE.CatmullRomCurve3(points);b.tube(points,.012,m.black,32);
  for(let i=0;i<count;i++){
    const p=curve.getPoint((i+.35)/count);b.cylinder(.009,.009,.28,p.x,p.y-.14,p.z,m.black,6);
    const g=new THREE.SphereGeometry(.255,20,24),pos=g.attributes.position;
    for(let j=0;j<pos.count;j++){const x=pos.getX(j),z=pos.getZ(j),y=pos.getY(j),rib=1+.015*Math.cos(Math.acos(THREE.MathUtils.clamp(y/.255,-1,1))*36);pos.setXYZ(j,x*rib,y*1.36,z*rib);}g.computeVertexNormals();
    b.add(g,m.lantern,p.x,p.y-.55,p.z);
    for(const y of[-.90,-.22])b.cylinder(.105,.105,.045,p.x,p.y+y,p.z,m.gold,12);
    b.cylinder(.031,.065,.19,p.x,p.y-1.03,p.z,m.gateRed,8);
  }
}
