import * as THREE from 'three';
import { GeometryBatch,vec } from './geometry';
import type { NightMaterials } from './materials';
import type { BuildingSpec } from './district';
/** Distinct trade-specific fixtures supplement the everyday shelving. */
export function storefront(b:GeometryBatch,m:NightMaterials,s:BuildingSpec){
  const {id,width:w}=s;
  if(id===0){ // neighbourhood convenience store: stripe fascia, glass door, fridges
    for(let q=0;q<3;q++)b.box(w-.7,.12,.12,0,2.63-q*.13,3.58,[m.plasticGreen,m.porcelain,m.plasticRed][q]);
    for(const x of[-2.5,-.95]){
      b.box(1.42,2.25,.8,x,1.24,-1.1,m.porcelain,.025);b.box(1.29,2.03,.035,x,1.27,-.68,m.darkGlass);
      for(let row=0;row<5;row++){b.box(1.19,.024,.05,x,.40+row*.36,-.61,m.aluminum);for(let k=0;k<6;k++)b.cylinder(.04,.046,.20,x-.49+k*.19,.52+row*.36,-.62,[m.plasticBlue,m.plasticRed,m.plasticGreen][k%3],10);}
      b.box(.015,1.96,.02,x-.61,1.25,-.62,m.coolBulb);b.box(.025,.32,.033,x+.55,1.2,-.58,m.aluminum);
    }
  }else if(id===2){
    b.box(.16,.77,.10,3.4,2.15,.3,m.coolBulb);b.box(.60,.17,.10,3.4,2.15,.3,m.coolBulb);
    b.box(2.6,.86,.65,0,.54,1.2,m.porcelain,.025);b.box(.46,.36,.20,0,1.13,1.2,m.black,.02);
  }else if(id===16||id===27){ // workshop with spare tyres, tool silhouettes and lift
    for(let q=0;q<6;q++)b.torus(.27,.065,-2.8+q*.53,1.75,-1.71,m.black,new THREE.Euler(),22);
    b.box(2.8,.2,1.1,0,.26,1,m.iron);b.box(2.8,.05,1.1,0,.40,1,m.aluminum);
    for(let q=0;q<11;q++){b.box(.032,.35,.02,-1.1+q*.21,2.25,-1.74,m.aluminum);b.torus(.051,.012,-1.1+q*.21,2.44,-1.74,m.aluminum,new THREE.Euler(),8);}
    b.box(.67,.72,.48,2.05,.55,-.3,m.plasticRed,.025);for(let q=0;q<5;q++)b.box(.58,.025,.04,2.05,.35+q*.105,-.04,m.aluminum);
  }else if(id===12){
    for(let q=0;q<3;q++){
      const x=-2.6+q*2.4;b.box(2.1,.70,.9,x,1.00,-.4,m.black);b.box(2.02,.83,.88,x,1.77,-.4,m.glass);b.box(1.99,.03,.81,x,1.43,-.4,m.plasticBlue);
      b.box(1.9,.018,.018,x,2.17,.02,m.coolBulb);for(let k=0;k<5;k++)b.sphere(.055,x-.73+k*.36,1.68+(k%2)*.13,-.25,m.gold,vec(1.6,.8,.4));
      for(let k=0;k<4;k++)b.tube([vec(x-.8+k*.5,1.47,-.65),vec(x-.7+k*.5,1.7,-.65),vec(x-.8+k*.5,1.94,-.65)],.016,m.greens,5);
    }
  }else if(id===6||id===22||id===32||id===46){
    for(let row=0;row<4;row++)for(let q=0;q<22;q++){
      const x=-w*.41+q*w*.037;
      b.box(.095+(q%3)*.025,.28+(q%4)*.035,.25,x,.69+row*.53,-1.03,[m.gateRed,m.plasticBlue,m.bamboo,m.porcelain,m.plasticGreen][q%5],0,new THREE.Euler(0,0,q%8===0?.12:0));
      b.box(.055,.01,.015,x,.63+row*.53,-.89,m.gold);
    }
  }else if(id===35||id===29){
    b.box(3.6,1.0,.85,0,.61,0,m.bamboo,.018);b.box(3.72,.065,.93,0,1.15,0,m.steel);
    b.box(.98,.44,.42,-.4,1.41,-.03,m.aluminum,.025);b.box(.9,.11,.05,-.4,1.45,.21,m.iron);for(const x of[-.65,-.21]){b.cylinder(.034,.034,.12,x,1.29,.2,m.gold,10);b.cylinder(.066,.057,.095,x,1.23,.21,m.porcelain,12);}
    b.cylinder(.11,.11,.25,.48,1.42,-.08,m.iron,16);b.cylinder(.13,.08,.19,.48,1.63,-.08,m.glass,16);
  }else if(id===7||id===25){
    for(const x of[-2.5,0,2.5]){
      b.box(.95,1.40,.035,x,1.82,-1.73,m.aluminum,.035);b.box(.79,1.23,.015,x,1.82,-1.70,m.darkGlass);
      b.box(.53,.13,.58,x,.74,-.30,m.black,.06);b.box(.53,.69,.1,x,1.09,-.53,m.black,.055);b.cylinder(.07,.07,.54,x,.4,-.3,m.aluminum,12);b.cylinder(.28,.28,.05,x,.15,-.3,m.aluminum,18);
    }
  }
}
export function landmarkArchitecture(b:GeometryBatch,m:NightMaterials,s:BuildingSpec){
  const h=3.25+(s.floors-1)*2.95,w=s.width,front=s.depth/2;
  if([42,45,50].includes(s.id)){
    // Red-brick house: real sloping tile eaves, ridge tiles and timber lattice.
    for(const side of[-1,1]){
      b.box(w+.55,.12,s.depth*.57,0,h+.67,side*s.depth*.25,m.roof,0,new THREE.Euler(side*.28,0,0));
      for(let x=-w/2;x<w/2;x+=.19)b.box(.07,.06,s.depth*.57,x,h+.75,side*s.depth*.25,m.gateRed,0,new THREE.Euler(side*.28,0,0));
    }
    b.box(w+.7,.15,.22,0,h+1.27,0,m.gateRed);b.box(w,.31,.22,0,3.38,front+.15,m.bamboo);
    for(const x of[-2.6,0,2.6])for(let q=-3;q<=3;q++)b.box(.035,1.68,.07,x+q*.20,h-1.6,front+.22,m.bamboo);
  }else if(s.id===39||s.id===57){
    for(const x of[-w*.40,-w*.22,w*.22,w*.40]){
      b.cylinder(.17,.21,h-3.1,x,(h+3.1)/2,front+.25,m.concrete,16);
      for(const y of[3.35,h-.18])b.box(.54,.20,.54,x,y,front+.25,m.concrete);
    }
    const shape=new THREE.Shape();shape.moveTo(-w*.43,0);shape.lineTo(w*.43,0);shape.lineTo(0,1.65);shape.closePath();
    b.add(new THREE.ExtrudeGeometry(shape,{depth:.23,bevelEnabled:false}),m.concrete,0,h+.2,front);
    b.box(w+.25,.25,.55,0,h+.16,front+.1,m.concrete);
    b.cylinder(.43,.43,.055,0,h+.75,front+.25,m.iron,28,new THREE.Euler(Math.PI/2,0,0));
    b.cylinder(.37,.37,.06,0,h+.75,front+.28,m.porcelain,28,new THREE.Euler(Math.PI/2,0,0));
    b.box(.025,.23,.015,0,h+.85,front+.32,m.black);b.box(.17,.025,.015,.075,h+.75,front+.32,m.black);
  }
}
