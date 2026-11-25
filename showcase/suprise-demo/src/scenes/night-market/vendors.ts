import * as THREE from 'three';
import { GeometryBatch,vec } from './geometry';
import { signMaterial,menuMaterial,type NightMaterials } from './materials';
import { pot,steamer,bottle,crate } from './props';
import { vendorTypes,type VendorFamily } from './district';
import { signPalette } from './buildings';

export function vendorMaterials(){
  const menus:Partial<Record<VendorFamily,string[]>>={
    flowers:['季節小花束　150','玫瑰一束　200','多肉盆栽　120','香草小盆　80','包裝服務　20'],
    accessories:['透明保護殼　150','充電傳輸線　100','玻璃保護貼　200','手機支架　80','耳機收納袋　60'],
    clothes:['純棉短襪　50','三雙優惠　120','素色長襪　80','運動毛巾　100','棉麻手帕　60'],
    bags:['手工零錢包　200','鑰匙小掛件　80','真皮卡夾　350','帆布小袋　150','皮件保養　50'],
    games:['彈珠一局　30','連玩四局　100','集點兌換小禮物','請勿用力敲打','夜市的童年回憶'],
    tea:['青草茶　35','冬瓜茶　30','烏梅汁　40','洛神花茶　40','自備杯折五元'],
    drinks:['珍珠奶茶　55','蜂蜜檸檬　50','古早味紅茶　30','鮮奶茶　60','甜度冰量可調整'],
    soup:['招牌排骨湯　90','四神湯　60','冬瓜肉湯　50','湯麵　70','加麵　20'],
    fruit:['當季水果　60','綜合水果盒　100','現切芭樂　50','鮮榨果汁　60','新鮮現切・不加糖'],
  };
  return vendorTypes.map(([name,family],i)=>({sign:signMaterial({text:name,...signPalette[i%6],sub:['clothes','flowers','accessories','games','bags'].includes(family)?'老街好物　・　歡迎光臨':['手工現做　・　每日新鮮','炭火慢烤　・　在地滋味'][i%2],glow:.68}),menu:menuMaterial(menus[family]??['招牌推薦　60','經典原味　50','綜合分享　100','加料升級　20','冰涼飲品　30'],name)}));
}
/** Every vendor has a real cart, equipment and goods; no photographic facade cards. */
export function vendor(b:GeometryBatch,m:NightMaterials,index:number,materials:ReturnType<typeof vendorMaterials>){
  const [name,family]=vendorTypes[index%vendorTypes.length],mat=materials[index%vendorTypes.length];
  const nonFood=['clothes','flowers','accessories','games','bags'].includes(family);
  b.box(2.82,.88,1.26,0,.69,0,nonFood?m.bamboo:m.steel,.025);
  b.box(2.98,.07,1.39,0,1.17,0,nonFood?m.bamboo:m.steel,.015);
  for(const x of[-1.23,1.23])for(const z of[-.48,.48]){
    b.box(.04,.25,.04,x,.21,z,m.iron);b.cylinder(.105,.105,.08,x,.11,z,m.black,10,new THREE.Euler(0,0,Math.PI/2));
  }
  for(const x of[-.91,0,.91]){b.box(.016,.72,.014,x,.71,.64,m.iron);b.box(.19,.025,.04,x+.28,.93,.66,m.aluminum,.008);}
  if(!nonFood){
    for(let q=0;q<3;q++)bottle(b,m,1.04-q*.17,1.22,.42,[m.plasticRed,m.bamboo,m.black][q]);
    for(let q=0;q<5;q++)b.cylinder(.09,.061,.052,-1.13,1.24+q*.047,.36,m.porcelain,12);
    b.cylinder(.18,.17,.49,-1.69,.32,-.22,m.plasticGreen,16);b.sphere(.175,-1.69,.57,-.22,m.plasticGreen,vec(1,.37,1));b.torus(.086,.014,-1.69,.69,-.22,m.iron);
    b.tube([vec(-1.69,.66,-.22),vec(-1.47,.31,-.4),vec(-.95,.2,-.45),vec(-.82,1.12,-.44)],.012,m.black,7);
  }
  contents(b,m,family,index);
  // Glass front, extruded frame and shaded menu sheet.
  if(['fried','braised','seafood','pastry','dumplings','fruit'].includes(family)){
    for(const x of[-1.3,1.3])b.box(.026,.71,.026,x,1.55,.54,m.aluminum);
    b.box(2.64,.028,.032,0,1.91,.54,m.aluminum);b.box(2.56,.64,.008,0,1.57,.55,m.glass);
    b.box(2.6,.007,1.1,0,1.91,0,m.glass);
  }
  b.box(2.91,.44,.09,0,2.49,.72,m.iron,.015);b.plane(2.84,.38,0,2.49,.775,mat.sign);
  for(const x of[-1.36,1.36])b.box(.022,1.2,.022,x,1.86,.67,m.aluminum);
  b.plane(.42,.63,1.18,1.72,.59,mat.menu);
  if(index%3===0)crate(b,m,1.74,.12,-.17,index%2?m.plasticRed:m.plasticGreen);
  return {name,steaming:['soup','steamer','dumplings','noodles','griddle'].includes(family)};
}
function tray(b:GeometryBatch,m:NightMaterials,x:number,z:number,w=.65,d=.7){
  b.box(w,.055,d,x,1.24,z,m.aluminum,.025);
  for(const dx of[-w/2,w/2])b.box(.022,.075,d,x+dx,1.28,z,m.steel);
  for(const dz of[-d/2,d/2])b.box(w,.075,.022,x,1.28,z+dz,m.steel);
}
function contents(b:GeometryBatch,m:NightMaterials,f:VendorFamily,id:number){
  if(f==='soup'||f==='noodles'){pot(b,m,-.68,1.22,-.06,.37);pot(b,m,.22,1.22,-.08,.31);b.box(.43,.04,.51,.90,1.23,-.14,m.bamboo);for(let i=0;i<8;i++)b.tube([vec(.72+i*.035,1.27,-.3),vec(.73+i*.035,1.3,-.1),vec(.7+i*.035,1.28,.02)],.009,m.porcelain,4);}
  else if(f==='steamer'||f==='dumplings'){
    steamer(b,m,-.68,1.22,-.04,4);steamer(b,m,.14,1.22,-.1,3);tray(b,m,.91,-.09,.54,.7);
    for(let q=0;q<6;q++)b.sphere(.081,.75+(q%2)*.19,1.35,-.29+Math.floor(q/2)*.19,m.porcelain,vec(1,.72,.85));
  }else if(f==='oven'){
    b.cylinder(.46,.43,.83,-.50,1.59,-.04,m.gateRed,24);b.torus(.44,.055,-.5,2.01,-.04,m.iron);b.cylinder(.36,.36,.014,-.5,1.995,-.04,m.black,24);
    for(let q=0;q<10;q++){const a=q/10*Math.PI*2;b.sphere(.10,-.5+Math.sin(a)*.31,1.99,-.04+Math.cos(a)*.31,m.fried,vec(1,.48,1));}
    tray(b,m,.6,-.10,.78,.8);for(let q=0;q<6;q++)b.sphere(.115,.37+q%2*.29,1.36,-.36+Math.floor(q/2)*.25,m.fried,vec(1,.55,1));
  }else if(f==='grill'||f==='corn'){
    b.box(2.1,.19,.79,0,1.32,-.09,m.iron,.025);
    for(let q=0;q<21;q++)b.box(.024,.027,.76,-1+q*.1,1.44,-.09,m.steel);
    for(let q=0;q<9;q++){
      const x=-.83+q*.2;b.box(.013,.013,.66,x,1.50,-.03,m.bamboo);
      if(f==='corn'){b.add(new THREE.CapsuleGeometry(.065,.27,3,10),m.fried,x,1.51,-.1,new THREE.Euler(Math.PI/2,0,0));for(let r=0;r<6;r++)b.torus(.071,.008,x,1.51,-.23+r*.052,m.bamboo,new THREE.Euler(),10);}
      else for(let r=0;r<3;r++)b.sphere(.079,x,1.50,-.25+r*.15,(q+id)%2?m.sausage:m.fried,vec(.8,.75,1));
    }
  }else if(f==='griddle'||f==='takoyaki'){
    b.box(2.14,.13,.89,0,1.3,-.1,m.iron,.025);b.box(2.12,.025,.82,0,1.38,-.1,m.black);
    if(f==='takoyaki')for(let x=0;x<9;x++)for(let z=0;z<3;z++){b.torus(.068,.014,-.88+x*.215,1.4,-.36+z*.24,m.iron);b.sphere(.063,-.88+x*.215,1.42,-.36+z*.24,m.fried,vec(1,.7,1));}
    else for(let q=0;q<4;q++){b.cylinder(.19,.20,.025,-.78+q*.50,1.41,-.1,id%2?m.fried:m.porcelain,18);for(let j=0;j<4;j++)b.sphere(.025,-.87+q*.50+j*.055,1.43,-.1,m.greens,vec(1,.3,2));}
    b.box(.11,.018,.22,.90,1.46,.18,m.steel);b.box(.035,.03,.25,.90,1.46,.4,m.bamboo);
  }else if(f==='drinks'||f==='tea'){
    for(let q=0;q<3;q++){b.cylinder(.21,.21,.59,-.86+q*.59,1.53,-.13,f==='tea'?m.steel:m.plasticBlue,20);b.cylinder(.23,.23,.04,-.86+q*.59,1.84,-.13,m.black,20);b.box(.07,.075,.1,-.86+q*.59,1.31,.11,m.black);}
    for(let q=0;q<6;q++){b.cylinder(.055,.038,.14,.85+(q%2)*.16,1.29+Math.floor(q/2)*.12,.04,m.porcelain,12);b.cylinder(.003,.003,.18,.85+(q%2)*.16,1.45+Math.floor(q/2)*.12,.04,m.plasticRed,5);}
    b.box(.30,.34,.28,.85,1.42,-.36,m.steel,.025);b.cylinder(.11,.085,.32,.85,1.73,-.36,m.glass,16);b.cylinder(.12,.12,.035,.85,1.90,-.36,m.black,16);
  }else if(f==='fruit'){
    for(let q=0;q<3;q++){tray(b,m,-.85+q*.83,-.05,.76,.82);for(let k=0;k<9;k++)b.sphere(.108,-1.08+q*.83+k%3*.215,1.39+Math.floor(k/6)*.06,-.28+Math.floor(k/3)*.215,[m.greens,m.fried,m.plasticRed][q],vec(1,q===1?1.4:1,1));}
  }else if(f==='ice'||f==='tofu'){
    for(let q=0;q<3;q++){pot(b,m,-.8+q*.7,1.22,-.08,.26);b.cylinder(.23,.23,.012,-.8+q*.7,1.59,-.08,f==='tofu'?m.porcelain:m.plasticRed,20);}
    if(f==='ice'){b.box(.43,.53,.40,.97,1.5,-.04,m.plasticGreen,.025);b.cylinder(.14,.14,.19,.97,1.87,-.04,m.aluminum,16);b.box(.08,.4,.075,1.25,1.79,-.04,m.steel);}
  }else if(f==='fried'||f==='braised'||f==='pastry'||f==='seafood'){
    for(let q=0;q<3;q++){tray(b,m,-.87+q*.81,-.08,.75,.82);for(let k=0;k<9;k++){
      const x=-1.08+q*.81+k%3*.21,z=-.32+Math.floor(k/3)*.23;
      if(f==='seafood'){b.sphere(.10,x,1.33,z,m.aluminum,vec(.65,.40,1.4));b.box(.10,.014,.045,x,1.33,z+.15,m.aluminum,0,new THREE.Euler(0,.7,0));}
      else b.box(.17,.08,.17,x,1.34,z,f==='braised'?m.sausage:f==='pastry'&&id%2?m.porcelain:m.fried,.027,new THREE.Euler(0,k*.23,0));
    }}
  }else if(f==='candy'){
    b.box(2.2,.20,.5,0,1.31,-.1,m.bamboo);
    for(let q=0;q<13;q++){const x=-1.01+q*.167;b.cylinder(.005,.005,.55,x,1.63,-.1,m.bamboo,5);for(let k=0;k<4;k++)b.sphere(.053,x,1.58+k*.09,-.1,m.plasticRed);}
  }else if(f==='flowers'){
    for(let q=0;q<8;q++){const x=-1.1+q%4*.71,z=-.25+Math.floor(q/4)*.47;b.cylinder(.14,.10,.27,x,1.34,z,m.gateRed,12);for(let k=0;k<5;k++){b.cylinder(.006,.006,.46,x+Math.sin(k)*.08,1.66,z+Math.cos(k)*.08,m.greens,5);const fx=x+Math.sin(k)*.10,fz=z+Math.cos(k)*.10,fy=1.88+k*.018;
      b.sphere(.026,fx,fy,fz,m.fried);
      for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5;b.sphere(.037,fx+Math.cos(a)*.045,fy-.004,fz+Math.sin(a)*.045,k%2?m.porcelain:m.blossom,vec(1,.32,1.3));}
      b.sphere(.04,fx,fy-.2,fz+.034,m.greens,vec(.45,.16,1.8));}}
  }else if(f==='clothes'||f==='bags'||f==='accessories'){
    b.box(2.5,1.02,.055,0,1.75,-.45,m.bamboo);
    for(let q=0;q<12;q++){const x=-1.04+q%6*.42,y=1.5+Math.floor(q/6)*.45,col=[m.plasticRed,m.plasticGreen,m.plasticBlue,m.porcelain][q%4];
      if(f==='bags'){b.box(.28,.31,.17,x,y,-.35,col,.035);b.torus(.085,.013,x,y+.2,-.35,m.bamboo,new THREE.Euler(),12);}
      else if(f==='accessories'){b.box(.20,.32,.04,x,y,-.41,m.porcelain,.025);b.box(.14,.23,.02,x,y,-.378,col,.014);}
      else{b.box(.20,.26,.025,x,y,-.41,col);b.box(.29,.1,.04,x+.035,y-.17,-.40,col,.025);}
    }
  }else if(f==='games'){
    b.box(2.35,.16,.89,0,1.31,-.02,m.plasticGreen,.025);
    for(let q=0;q<36;q++){const x=-1.03+q%12*.187,z=-.30+Math.floor(q/12)*.27;b.cylinder(.03,.025,.065,x,1.44,z,m.gold,8);}
    b.sphere(.055,.28,1.49,.09,m.aluminum);b.box(.13,.12,.62,1.03,1.45,-.04,m.bamboo);
  }
}
