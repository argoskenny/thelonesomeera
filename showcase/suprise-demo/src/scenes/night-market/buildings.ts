import * as THREE from 'three';
import { GeometryBatch,vec } from './geometry';
import { signMaterial,type NightMaterials } from './materials';
import { bottle,stool } from './props';
import type { BuildingSpec } from './district';
import { storefront,landmarkArchitecture } from './storefronts';

export const signPalette=[{bg:'#e9d4a1',ink:'#532419'},{bg:'#b8d8d3',ink:'#13424c'},{bg:'#852e24',ink:'#f7dcaa'},{bg:'#174451',ink:'#d6edf1'},{bg:'#dbbc83',ink:'#a02b1c'},{bg:'#2e4235',ink:'#ecddb8'}];
/** Local frontage faces +Z. The shop recess, arcade and upper floors are real volumes. */
export function building(b:GeometryBatch,d:GeometryBatch,m:NightMaterials,s:BuildingSpec,signs:THREE.MeshStandardMaterial[]){
  const {id,width:w,depth:depth,floors,facade:f,windows,roof}=s,h=3.25+(floors-1)*2.95,front=depth/2;
  const wall=f===2||f===7||[42,45,50,57].includes(id)?m.brick:m.tile[(id*5+Math.floor(id/7))%m.tile.length];
  const trim=f===2||f===7?m.concrete:m.tile[(id+3)%m.tile.length];
  // Ground-floor arcade: rear wall, dividing walls, a sheltered shop floor.
  b.box(w,h-3.2,depth,0,(h+3.2)/2,0,wall);
  b.box(w,.19,depth+2,0,.07,1,m.concrete,.02);
  b.box(w,3.2,.20,0,1.6,-1.9,wall);
  for(const x of[-w/2+.1,w/2-.1])b.box(.19,3.2,depth,x,1.6,0,wall);
  for(const x of[-w/2+.3,w/2-.3])b.box(.35,3.4,.4,x,1.7,front+.3,trim,.02);
  b.box(w+.3,.22,depth+.4,0,h+.05,0,trim);
  for(const x of[-w/2+.15,w/2-.15])b.box(.12,h-3.2,.19,x,(h+3.2)/2,front+.06,trim);
  const cols=windows===3?2:3,spacing=(w-1.5)/cols;
  for(let floor=1;floor<floors;floor++){
    const y=3.2+(floor-.5)*2.95,balcony=f===1||f===4||f===8;
    b.box(w,.13,.20,0,y-1.08,front+.10,trim);
    if(f===0||f===5)for(let q=-1;q<=1;q++)b.box(.16,2.8,.35,q*w*.31,y,front+.18,trim);
    if(f===4&&floor%2===0)b.box(w*.72,.17,.9,w*.08,y-1.08,front+.43,m.concrete);
    for(let c=0;c<cols;c++){
      const x=(c-(cols-1)/2)*spacing,ww=windows===3?2.25:windows===4?1.22:1.62,wh=windows===1?1.9:windows===5?.9:1.48;
      const wz=front+(f===3?.31:.025),lit=(id*7+c+floor*3)%11<2;
      b.box(ww+.18,wh+.15,.12,x,y,wz,m.black);
      b.box(ww,wh,.075,x,y,wz+.07,lit?m.windowLit:m.darkGlass);
      for(const dx of[-ww/2,0,ww/2])b.box(.045,wh+.14,.09,x+dx,y,wz+.12,windows===6?m.bamboo:m.aluminum);
      for(const dy of[-wh/2,wh/2])b.box(ww+.08,.045,.09,x,y+dy,wz+.12,m.aluminum);
      if(windows===0||windows===2)b.box(ww,.035,.09,x,y-.05,wz+.12,m.aluminum);
      if(windows===5)for(let q=-3;q<=3;q++)b.box(ww,.06,.14,x,y+q*.13,wz+.17,m.shutter,0,new THREE.Euler(.28,0,0));
      if(windows===6){
        const curve=new THREE.EllipseCurve(0,0,ww/2,ww/2,0,Math.PI,false,0),points=curve.getPoints(14).map(p=>vec(p.x+x,p.y+y+wh/2,wz+.11));
        b.tube(points,.075,m.concrete,16);b.box(.12,.5,.12,x-ww/2,y+wh/2-.25,wz+.1,m.concrete);b.box(.12,.5,.12,x+ww/2,y+wh/2-.25,wz+.1,m.concrete);
      }
      if(balcony){
        b.box(ww+.5,.13,1.03,x,y-wh/2-.07,wz+.43,m.concrete);
        for(let q=-4;q<=4;q++)b.box(.025,.92,.025,x+q*(ww+.3)/8,y-wh/2+.45,wz+.9,m.iron);
        for(const dy of[0,.85])b.box(ww+.4,.033,.035,x,y-wh/2+dy,wz+.9,m.aluminum);
        if((c+id+floor)%4===0){b.cylinder(.15,.11,.24,x+.42,y-wh/2+.15,wz+.55,m.gateRed,12);for(let q=0;q<7;q++)b.sphere(.16,x+.42+Math.sin(q)*.12,y-wh/2+.45+q*.026,wz+.55+Math.cos(q)*.12,m.greens,vec(1,.6,1));}
      }else if((c+floor+id)%3!==0){
        b.box(ww+.21,.06,.48,x,y-wh/2-.09,wz+.28,m.iron);
        for(let q=-4;q<=4;q++)b.box(.023,wh+.25,.023,x+q*ww/8,y,wz+.51,m.iron);
        for(const dy of[-wh/2-.08,0,wh/2+.09])b.box(ww+.15,.027,.025,x,y+dy,wz+.51,m.iron);
      }
      if((floor+c+id)%4===0){
        const ax=x+ww*.47,ay=y-wh*.6;
        b.box(.85,.55,.47,ax,ay,wz+.48,m.concrete,.035);
        b.cylinder(.2,.2,.018,ax-.12,ay,wz+.73,m.iron,20,new THREE.Euler(Math.PI/2,0,0));
        for(let q=-3;q<=3;q++)b.box(.37,.022,.02,ax+.23,ay+q*.063,wz+.728,m.aluminum);
        b.tube([vec(ax+.4,ay,wz+.55),vec(ax+.5,ay-.55,wz+.24),vec(ax+.5,ay-1.5,wz+.23)],.023,m.rust,5);
      }
    }
  }
  // Side and rear windows remain modelled for aerial and courtyard exploration.
  for(const side of[-1,1])for(let floor=1;floor<floors;floor++)for(const z of[-2,1]){
    b.box(.035,1.2,1.1,side*(w/2+.02),4.3+(floor-1)*2.95,z,(id+floor)%6===0?m.windowLit:m.darkGlass);
    b.box(.06,1.32,.06,side*(w/2+.04),4.3+(floor-1)*2.95,z,m.aluminum);
  }
  for(let floor=1;floor<floors;floor++)for(const x of[-w*.3,0,w*.3])b.box(1.2,1.35,.04,x,4.4+(floor-1)*2.95,-front-.025,m.darkGlass);
  for(const x of[-w/2+.35,w/2-.38]){b.cylinder(.042,.042,h,x,h/2,front+.22,m.rust,7);for(let y=1;y<h;y+=2)b.box(.16,.025,.1,x,y,front+.22,m.iron);}
  // Eight roof treatments: tank terrace, tile roof, stair core, pergola, metal shed,
  // stepped gable, water-tank tower and planted terrace.
  for(const x of[-w/2,w/2])b.box(.14,.65,depth,x,h+.43,0,trim);
  if(roof===1||roof===4){
    for(const side of[-1,1])b.box(w+.38,.12,depth*.55,0,h+.67,side*depth*.245,roof===1?m.roof:m.shutter,0,new THREE.Euler(side*.24,0,0));
    for(let x=-w/2;x<w/2;x+=.25)for(const side of[-1,1])b.box(.035,.055,depth*.55,x,h+.74,side*depth*.245,m.rust,0,new THREE.Euler(side*.24,0,0));
  }else if(roof===2){b.box(w*.35,2.4,3,-w*.25,h+1.2,-1,m.concrete);b.box(.75,1.8,.03,-w*.25,h+.9,.52,m.iron);}
  else if(roof===3||roof===7){
    for(const x of[-w*.35,w*.35])for(const z of[-2.6,2.6])b.box(.08,2,.08,x,h+1,z,m.iron);
    for(let z=-2.6;z<=2.6;z+=.55)b.box(w*.8,.08,.12,0,h+2,z,m.bamboo);
    for(let q=0;q<5;q++){b.box(.6,.4,.6,-w*.3+q*w*.15,h+.3,-2,m.gateRed);b.sphere(.46,-w*.3+q*w*.15,h+.78,-2,m.greens,vec(1,.5,1));}
  }else if(roof===5){for(let q=0;q<3;q++)b.box(w*(.95-q*.23),.35,.25,0,h+.4+q*.33,front,m.concrete);}
  if(roof===0||roof===6||id%3===0){
    const y=h+(roof===6?2:.2);if(roof===6)for(const x of[-.65,.65])for(const z of[-.65,.65])b.box(.08,2,.08,x,y-1,z,m.iron);
    b.cylinder(.75,.75,1.4,0,y+.72,0,m.aluminum,24);b.sphere(.75,0,y+1.43,0,m.aluminum,vec(1,.18,1));
    for(const yy of[.12,.55,.97,1.35])b.torus(.754,.018,0,y+yy,0,m.steel);
    b.tube([vec(.7,y+.1,0),vec(1.15,y+.1,0),vec(1.15,h-.3,0)],.045,m.rust,5);
  }
  b.cylinder(.02,.02,3.2,w*.32,h+1.6,-2,m.iron,7);for(let q=0;q<5;q++)b.box(1.1-q*.13,.016,.016,w*.32,h+2+q*.17,-2,m.aluminum);
  // Individual shop fitting styles and a mixture of open shops and roller shutters.
  if(id%9===7){
    d.box(w-.9,2.65,.07,0,1.42,front,m.shutter);
    for(let y=.18;y<2.8;y+=.11)d.box(w-.9,.015,.036,0,y,front+.05,m.aluminum);
  }else{
    d.box(w-.65,.04,.04,0,2.87,1.5,id%3?m.warmBulb:m.coolBulb);
    for(let q=0;q<4;q++){
      d.box(w-.6,.055,.55,0,.5+q*.53,-1.45,m.bamboo);
      for(let k=0;k<12;k++){
        const x=-w*.4+k*w*.073;
        if(id%6===0)bottle(d,m,x,.53+q*.53,-1.44,[m.plasticRed,m.plasticGreen,m.porcelain][k%3]);
        else d.box(.19+(k%3)*.05,.19+(k%4)*.035,.21,x,.64+q*.53,-1.44,[m.bamboo,m.plasticGreen,m.plasticBlue,m.porcelain,m.gateRed][(k+id)%5]);
      }
    }
    if(id%10===9){ // actual washing-machine drums, doors, payment panel
      for(const x of[-2.8,-1.35,.1,1.55]){
        d.box(1.2,1.38,1.0,x,.79,.0,m.porcelain,.035);
        d.cylinder(.42,.42,.06,x,.72,.53,m.iron,24,new THREE.Euler(Math.PI/2,0,0));d.torus(.37,.04,x,.72,.58,m.aluminum,new THREE.Euler(),24);
        d.cylinder(.29,.29,.03,x,.72,.59,m.darkGlass,24,new THREE.Euler(Math.PI/2,0,0));d.box(.46,.13,.018,x,1.32,.52,m.darkGlass);
      }
    }else if(id%4===0){
      for(const x of[-w*.29,w*.29]){d.box(1.5,.075,1.0,x,.83,1.0,m.bamboo,.015);for(const dx of[-.6,.6])for(const z of[.6,1.4])d.box(.045,.77,.045,x+dx,.43,z,m.iron);stool(d,m,x-.6,2.0);}
    }
  }
  storefront(d,m,s);landmarkArchitecture(b,m,s);
  const palette=signPalette[id%signPalette.length];
  const sign=signMaterial({text:s.name,...palette,sub:id<36?'在地日常　・　SINCE 1982':'台灣街角　・　夜市未眠',glow:.65});signs.push(sign);
  d.box(w-.5,.73,.24,0,3.04,front+.23,m.iron,.02);d.plane(w-.66,.61,0,3.04,front+.36,sign);
  const vertical=signMaterial({text:s.name,...palette,vertical:true,glow:.78});signs.push(vertical);
  const sx=-w*.35,sz=front+1.5,sy=5.4+(id%3)*.4,sh=2.8+(id%3)*.28;
  d.box(.18,sh+.12,1.05,sx,sy,sz,m.aluminum,.02);
  d.plane(.96,sh,sx+.1,sy,sz,vertical,Math.PI/2);d.plane(.96,sh,sx-.1,sy,sz,vertical,-Math.PI/2);
  for(const dy of[-1,1])d.box(.06,.055,1.7,sx,sy+dy,front+.8,m.iron);
  for(let q=0;q<2;q++){
    d.box(.27,.38,.15,w*.43-q*.36,1.8,front+.15,m.shutter,.012);
    d.cylinder(.065,.065,.022,w*.43-q*.36,1.84,front+.24,m.porcelain,12,new THREE.Euler(Math.PI/2,0,0));
  }
  // Alternating canvas awnings with physical sag and scalloped edges.
  const depthA=2.05,aw=new THREE.PlaneGeometry(w-.3,depthA,28,8),p=aw.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),u=(p.getY(i)+depthA/2)/depthA;p.setXYZ(i,x,3.43-u*.62-Math.sin(u*Math.PI)*.10+Math.sin(x*8+id)*.018,front+u*depthA);}
  aw.computeVertexNormals();d.add(aw,m.cloth[id%4]);
  const edge=new THREE.PlaneGeometry(w-.3,.26,32,1),ep=edge.attributes.position;
  for(let i=0;i<ep.count;i++){const x=ep.getX(i);ep.setXYZ(i,x,2.81+(ep.getY(i)<0?-.25+Math.cos(x*11)*.035:0),front+depthA);}
  edge.computeVertexNormals();d.add(edge,m.cloth[id%4]);
  for(const x of[-w/2+.17,w/2-.17])d.tube([vec(x,3.4,front),vec(x,2.78,front+depthA)],.022,m.iron,2);
  d.box(w-.3,.035,.035,0,2.79,front+depthA,m.iron);
  d.box(w*.7,.024,.032,0,2.95,front+1.3,id%4?m.warmBulb:m.coolBulb);
}
