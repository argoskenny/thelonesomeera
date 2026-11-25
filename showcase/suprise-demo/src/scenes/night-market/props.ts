import * as THREE from 'three';
import { GeometryBatch,vec } from './geometry';
import type { NightMaterials } from './materials';

export function pot(b:GeometryBatch,m:NightMaterials,x:number,y:number,z:number,r=.25){
  b.cylinder(r,r*.94,.37,x,y+.185,z,m.steel,28);
  b.torus(r,.018,x,y+.37,z,m.aluminum);
  b.cylinder(r*.88,r*.88,.012,x,y+.357,z,m.broth,24);
  for(const side of[-1,1])b.torus(.075,.017,x+side*r*1.11,y+.27,z,m.iron,new THREE.Euler(0,Math.PI/2,0),12);
  b.cylinder(r*.86,r*.86,.055,x,y-.025,z,m.black,20);
}
export function steamer(b:GeometryBatch,m:NightMaterials,x:number,y:number,z:number,count=3){
  for(let i=0;i<count;i++){
    b.cylinder(.32,.31,.13,x,y+.065+i*.145,z,m.bamboo,24);
    b.torus(.318,.016,x,y+.13+i*.145,z,m.bamboo);
    b.torus(.313,.008,x,y+.024+i*.145,z,m.iron);
    for(let q=0;q<16;q++){const a=q/16*Math.PI*2;b.box(.017,.12,.018,x+Math.cos(a)*.315,y+.067+i*.145,z+Math.sin(a)*.315,m.bamboo);}
  }
  const top=y+count*.145;b.cylinder(.325,.325,.035,x,top,z,m.bamboo,24);
  for(let q=-4;q<=4;q++){const dx=q*.06,d=Math.sqrt(.29*.29-dx*dx)*2;b.box(.022,.015,d,x+dx,top+.025,z,m.bamboo);}
  b.torus(.055,.017,x,top+.085,z,m.bamboo,new THREE.Euler(0,0,0),12);
}
export function bottle(b:GeometryBatch,m:NightMaterials,x:number,y:number,z:number,color:THREE.Material){
  b.cylinder(.045,.05,.18,x,y+.09,z,color,12);
  b.cylinder(.018,.043,.055,x,y+.208,z,color,12);
  b.cylinder(.02,.02,.06,x,y+.262,z,m.plasticRed,10);
  b.cylinder(.010,.020,.055,x,y+.319,z,m.plasticRed,8);
  b.cylinder(.051,.051,.065,x,y+.10,z,m.porcelain,12);
}
export function crate(b:GeometryBatch,m:NightMaterials,x:number,y:number,z:number,material=m.plasticGreen){
  b.box(.54,.055,.4,x,y+.028,z,material,.01);
  for(const sx of[-1,1])for(const sz of[-1,1])b.box(.035,.34,.035,x+sx*.255,y+.17,z+sz*.185,material);
  for(let k=0;k<3;k++){
    for(const sz of[-1,1])b.box(.54,.033,.025,x,y+.09+k*.103,z+sz*.19,material);
    for(const sx of[-1,1])b.box(.025,.033,.4,x+sx*.26,y+.09+k*.103,z,material);
  }
  for(let k=-2;k<=2;k++)for(const sz of[-1,1])b.box(.018,.30,.018,x+k*.095,y+.18,z+sz*.19,material);
}
export function stool(b:GeometryBatch,m:NightMaterials,x:number,z:number,ry=0){
  b.box(.39,.07,.39,x,.47,z,m.plasticRed,.03,new THREE.Euler(0,ry,0));
  for(const a of[-1,1])for(const c of[-1,1])b.box(.065,.43,.065,x+a*.15,.245,z+c*.15,m.plasticRed,.018,new THREE.Euler(c*.09,ry,-a*.09));
  b.box(.31,.045,.04,x,.16,z+.16,m.plasticRed);b.box(.31,.045,.04,x,.16,z-.16,m.plasticRed);
}
export function umbrella(b:GeometryBatch,m:NightMaterials,x:number,z:number,index:number){
  const radius=1.37,y=3.01;
  b.cylinder(.022,.028,2.9,x,1.5,z,m.aluminum,12);
  b.cylinder(.045,.025,.19,x,y+.12,z,m.iron,12);
  for(let panel=0;panel<8;panel++){
    const pos:number[]=[],uv:number[]=[];
    const point=(r:number,a:number)=>[x+Math.cos(a)*r,y-Math.pow(r/radius,.62)*.53,z+Math.sin(a)*r];
    for(let j=0;j<7;j++)for(let k=0;k<4;k++){
      const r0=j/7*radius,r1=(j+1)/7*radius,a0=(panel+k/4)/8*Math.PI*2,a1=(panel+(k+1)/4)/8*Math.PI*2;
      for(const[r,a]of[[r0,a0],[r1,a0],[r1,a1],[r0,a0],[r1,a1],[r0,a1]]){pos.push(...point(r,a));uv.push(r/radius,a/Math.PI);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();b.add(g,m.cloth[(panel%2+index)%2]);
    const a=panel/8*Math.PI*2;
    b.tube([vec(x,y-.04,z),vec(x+Math.cos(a)*radius*.5,y-.4,z+Math.sin(a)*radius*.5),vec(x+Math.cos(a)*radius,y-.55,z+Math.sin(a)*radius)],.009,m.iron,12);
  }
}
