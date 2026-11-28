import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Builder } from './builder';
import { placePerformer } from './performer';
import { eastApron, eastTurn, eastWing, eastWingTip, onStrip, westBridge } from './stage-plan';
import { cutDeck, StageBuilder } from './stage-transform';

type P = [number, number, number];
type Ring = [y: number, x: number, z: number, width: number, depth: number];

function paintedTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function silkTexture() {
  return paintedTexture(512, 512, ctx => {
    const random = seeded(3495);
    ctx.fillStyle = '#28272b';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 2) {
      ctx.fillStyle = y % 4 ? '#302e31' : '#25282a';
      ctx.fillRect(0, y, 512, 1);
    }
    for (let i = 0; i < 20; i++) {
      const x = random() * 510, y = random() * 506;
      const size = 3.5 + random() * 6;
      ctx.strokeStyle = '#ac986b';
      ctx.lineWidth = .9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 4, y - 12, x + 16, y - 16, x + 26, y - 18);
      ctx.stroke();
      for (let j = 0; j < 3; j++) {
        const bx = x + j * 8, by = y - j * 7;
        for (let k = 0; k < 5; k++) {
          const a = k * Math.PI * .4;
          ctx.fillStyle = ['#d1c5ad','#a05945','#bd9a64','#a4a79a'][(i+j)%4];
          ctx.beginPath();
          ctx.ellipse(bx + Math.sin(a)*size*.48, by + Math.cos(a)*size*.48, size*.34, size*.52, -a, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.fillStyle = '#d8b57d';
        ctx.fillRect(bx-1,by-1,2,2);
      }
    }
  });
}

function screenPainting() {
  return paintedTexture(1152, 640, ctx => {
    const random = seeded(782);
    const bg = ctx.createLinearGradient(0, 0, 160, 640);
    bg.addColorStop(0, '#bda365');
    bg.addColorStop(.44, '#e3cf98');
    bg.addColorStop(1, '#bb9557');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,1152,640);
    for (let y = 0; y < 640; y += 48) for (let x = 0; x < 1152; x += 48) {
      ctx.fillStyle = random() < .4 ? 'rgba(255,242,164,.04)' : 'rgba(115,89,52,.03)';
      ctx.fillRect(x+.55,y+.55,47,47);
    }
    for (let i = 0; i < 22000; i++) {
      ctx.fillStyle = random() < .55 ? 'rgba(112,88,54,.12)' : 'rgba(255,244,197,.18)';
      ctx.fillRect(random()*1152, random()*640, random()*2+.6, .8);
    }
    // Low ridgelines recede into bands of gold mist.
    for (let layer=0; layer<3; layer++) {
      ctx.beginPath(); ctx.moveTo(0,640);
      for (let x=0;x<=1164;x+=12) {
        const ridge=Math.sin(x*.007+layer)*34+Math.sin(x*.016+2*layer)*14+Math.sin(x*.0027)*29;
        ctx.lineTo(x,390+layer*70+ridge+random()*3);
      }
      ctx.lineTo(1160,640);ctx.fillStyle=['#aeaa82','#a39c76','#938e6c'][layer];ctx.fill();
    }
    // A leaning pine with needle clusters and fine split-bark brushwork.
    function pine(x:number,y:number,length:number,a:number,width:number,depth:number) {
      const endX=x+Math.cos(a)*length, endY=y+Math.sin(a)*length;
      const bend=(random()-.5)*length*.4;
      const cx=(x+endX)*.5-Math.sin(a)*bend,cy=(y+endY)*.5+Math.cos(a)*bend;
      ctx.beginPath(); ctx.moveTo(x,y);ctx.quadraticCurveTo(cx,cy,endX,endY);
      ctx.strokeStyle=depth>1?'#514535':'#54533d';ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
      if (depth>1) {
        ctx.beginPath();ctx.moveTo(x,y-width*.21);ctx.quadraticCurveTo(cx,cy-width*.21,endX,endY-width*.15);
        ctx.strokeStyle='#988463';ctx.lineWidth=width*.19;ctx.stroke();
      }
      if(depth===0) {
        for(let i=0;i<160;i++) {
          const r=Math.sqrt(random()), t=random()*Math.PI*2, px=endX+Math.cos(t)*r*29,py=endY+Math.sin(t)*r*12;
          ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+(random()-.52)*9,py-random()*7-1);
          ctx.strokeStyle=['#4b5442','#576048','#6e7253','#343e34'][i%4];ctx.lineWidth=1.1;ctx.stroke();
        }
      } else {
        pine(endX,endY,length*(.54+random()*.18),a-.23-random()*.49,width*.56,depth-1);
        pine(endX,endY,length*(.54+random()*.17),a+.27+random()*.53,width*.57,depth-1);
      }
    }
    pine(30,640,151,-1.03,25,5);
    pine(1129,651,118,-2.19,16,4);
    // A small distant flight of cranes gives the central space a sense of scale.
    for (const [x,y,s] of [[688,180,1],[755,157,.72],[805,132,.53]]) {
      ctx.save();ctx.translate(x,y);ctx.scale(s,s);
      ctx.strokeStyle='#443e32';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-18,-8);ctx.quadraticCurveTo(-8,-11,0,0);ctx.quadraticCurveTo(7,-15,23,-16);ctx.stroke();
      ctx.fillStyle='#e4deba';ctx.beginPath();ctx.ellipse(1,-1,7,2.2,-.3,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  });
}

// Elliptical cross sections tailor the skirt, long sleeves, back and hair to the seated pose.
function loft(rows: Ring[], folds = 0, segments = 40) {
  const positions:number[]=[], uvs:number[]=[], indices:number[]=[];
  rows.forEach(([y,x,z,w,d], row) => {
    for (let i=0; i<=segments; i++) {
      const t=i/segments, a=t*Math.PI*2;
      const f=1+folds*(Math.sin(9*a+y*4)*.68+Math.sin(15*a-y*3)*.32);
      positions.push(x+w*f*Math.sin(a),y,z+d*f*Math.cos(a));
      uvs.push(t,row/(rows.length-1));
      if (row>0 && i>0) {
        const h=row*(segments+1)+i;
        indices.push(h-segments-2,h-segments-1,h,h-segments-2,h,h-1);
      }
    }
  });
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();
  return g;
}

function dressFigure(b: Builder) {
  const standard=(color:string,roughness=.7)=>new THREE.MeshStandardMaterial({color,roughness});
  const silk=silkTexture();
  b.material('silk',new THREE.MeshStandardMaterial({map:silk,bumpMap:silk,bumpScale:.0009,roughness:.85,side:THREE.DoubleSide}));
  b.material('pegEbony',standard('#211c19',.42));
  b.material('ivorySilk',standard('#e1d6b9',.82));
  b.material('obi',standard('#705341',.58));
  b.material('obiGold',standard('#ac8b57',.56));
  b.material('zabuton',standard('#4f5b61',.89));
  b.material('shamiHide',standard('#f4e9c8',.74));
  b.material('shamiLacquer',standard('#4c261b',.26));
  const basis=new THREE.Matrix4().makeScale(1.12,1.12,1.12)
    .premultiply(new THREE.Matrix4().makeRotationY(.14)).setPosition(-1.10,2.55,1.57);
  function place(mat:string,g:THREE.BufferGeometry) {b.mesh(mat,g.applyMatrix4(basis));}
  function oval(mat:string,x:number,y:number,z:number,rx:number,ry:number,rz:number,tilt=0,roll=0) {
    const g=new THREE.SphereGeometry(1,22,16).scale(rx,ry,rz);
    g.rotateX(tilt);g.rotateZ(roll);g.translate(x,y,z);place(mat,g);
  }
  function line(mat:string,points:P[],radius:number) {
    const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    place(mat,new THREE.TubeGeometry(c,Math.max(4,points.length*3),radius,6,false));
  }
  function band(mat:string,left:P[],right:P[]) {
    const vs:number[]=[],uv:number[]=[],idx:number[]=[];
    left.forEach((p,i)=>{
      vs.push(...p,...right[i]);uv.push(0,i/(left.length-1),1,i/(left.length-1));
      if(i)idx.push(i*2-2,i*2-1,i*2+1,i*2-2,i*2+1,i*2);
    });
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
    place(mat,g);
  }
  function round(mat:string,x:number,y:number,z:number,w:number,h:number,d:number,r:number,roll=0) {
    place(mat,new RoundedBoxGeometry(w,h,d,3,r).rotateZ(roll).translate(x,y,z));
  }
  round('zabuton',0,.044,.012,.70,.09,.61,.043);
  const cords:[number,number][]=[[-.32,-.27],[.32,-.27],[-.32,.27],[.32,.27]];
  cords.forEach(([x,z])=>line('obiGold',[[x,.046,z],[x*1.05,.038,z*1.06],[x*1.12,.024,z*1.11]],.006));
  place('silk',loft([[.088,0,.02,.28,.25],[.106,0,.03,.335,.28],[.155,0,.07,.344,.28],[.22,0,.075,.308,.245],[.28,0,.03,.265,.21],[.34,0,-.015,.21,.15],[.43,0,-.04,.17,.135]],.055));
  // Overlapping front panel drapes diagonally across the bent knees.
  band('silk',[[-.20,.33,.08],[-.12,.285,.201],[-.02,.23,.30],[.04,.14,.345]],[[.015,.39,.10],[.081,.304,.201],[.148,.23,.26],[.22,.142,.285]]);
  place('silk',loft([[.305,0,-.018,.201,.143],[.39,0,-.018,.176,.145],[.47,-.007,-.023,.155,.13],[.59,-.015,-.014,.169,.146],[.69,-.018,-.008,.190,.133],[.75,-.01,-.009,.197,.124],[.79,-.008,-.012,.143,.101],[.813,0,-.005,.067,.06]],.018));
  place('obi',loft([[.388,0,-.015,.18,.15],[.402,0,-.016,.18,.15],[.484,-.006,-.013,.166,.143],[.515,-.006,-.012,.167,.14]],.013));
  for(const y of [.414,.421,.472,.482]) place('obiGold',loft([[y,0,-.015,.18-(y-.415)*.20,.151-(y-.415)*.1],[y+.004,0,-.015,.18-(y-.415)*.20,.151-(y-.415)*.1]]));
  round('obi',-.01,.445,-.19,.30,.155,.134,.027);

  const v1:P[]=[[-.073,.805,.029],[-.063,.771,.098],[-.027,.707,.128],[.031,.634,.14],[.076,.584,.118]];
  const v2:P[]=[[.063,.811,.03],[.08,.773,.095],[.052,.703,.13],[.002,.629,.143],[-.072,.519,.12]];
  for (const [points,dir] of [[v1,-1],[v2,1]] as const) {
    const outer=points.map(([x,y,z]):P=>[x+.032*dir,y,z-.002]);
    band('silk',points,outer);
    line('ivorySilk',points,.011);
    line('obiGold',outer,.0031);
  }
  // The open sleeve cuffs and full hanging sleeves give the arms their kimono silhouette.
  place('silk',loft([[.286,-.228,.097,.051,.045],[.31,-.227,.085,.101,.083],[.404,-.224,.08,.105,.105],[.515,-.245,.08,.102,.133],[.61,-.230,.040,.101,.12],[.694,-.182,-.002,.089,.108],[.75,-.148,-.011,.067,.077]],.051));
  place('silk',loft([[.358,.271,.074,.058,.05],[.387,.257,.063,.101,.093],[.478,.258,.075,.112,.098],[.578,.259,.048,.103,.117],[.67,.237,.032,.096,.117],[.717,.198,.018,.092,.096],[.752,.153,-.001,.068,.077]],.058));
  function arm(a:P,c:P,rA:number,rC:number,mat:string) {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...c),delta=end.clone().sub(start);
    const g=new THREE.CylinderGeometry(rC,rA,delta.length(),16);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
    const mid=start.lerp(end,.5);place(mat,g.translate(mid.x,mid.y,mid.z));
  }
  arm([-.265,.58,.103],[-.222,.521,.223],.063,.05,'silk');
  arm([-.225,.53,.219],[-.213,.539,.234],.048,.039,'ivorySilk');
  arm([.246,.608,.089],[.321,.749,.162],.068,.044,'silk');
  arm([.317,.738,.158],[.326,.754,.164],.043,.038,'ivorySilk');
  placePerformer(b,basis);
  line('obiGold',[[-.086,.983,-.097],[.024,.979,-.127],[.074,.976,-.138]],.0023);
  oval('obiGold',-.092,.982,-.096,.010,.006,.005);
  // Shamisen body and neck are angled together, so all three strings land on the bridge.
  const bodyX=-.104, bodyY=.449, bodyZ=.275, angle=-.69;
  round('shamiLacquer',bodyX,bodyY,bodyZ,.22,.244,.119,.045,angle);
  round('shamiHide',bodyX,bodyY,bodyZ+.053,.213,.238,.026,.042,angle);
  // Lacquered bridge feet and the silk neo cord remain visible against the stretched skin.
  line('shamiLacquer',[[-.155,.410,.347],[-.127,.376,.347]],.0033);
  line('obiGold',[[-.196,.382,.319],[-.201,.373,.308],[-.18,.353,.298]],.0055);
  line('obi',[[-.202,.386,.309],[-.193,.365,.286],[-.176,.350,.285]],.005);
  round('obi',-.183,.504,bodyZ-.005,.027,.139,.117,.010,angle);

  const neckBase:P=[-.041,.519,.290], neckTip:P=[.495,.919,.172];
  arm(neckBase,neckTip,.022,.015,'shamiLacquer');
  arm(neckTip,[.526,.941,.153],.018,.028,'shamiLacquer');
  for(let i=0;i<3;i++){
    const f=i*.012, s=i%2?1:-1;
    const x=.503+f, y=.925+f*.62;
    arm([x,y,.157],[x-.020*s,y+.024*s,.169],.004,.006,'obiGold');
    oval('pegEbony',x-.028*s,y+.034*s,.169,.012,.019,.011,0,-.59);
  }
  line('obiGold',[[-.143,.413,.342],[-.122,.385,.342]],.004);
  for(let i=-1;i<=1;i++) {
    const ofs=i*.0034;
    line('shamiHide',[[-.186+ofs,.377,.331],[-.14+ofs,.402,.349],[-.039+ofs,.52,.317],[.499+ofs,.923,.193]],.00065);
  }
  const bachi=new THREE.Shape();
  bachi.moveTo(-.012,.026);bachi.lineTo(.009,.019);bachi.lineTo(.006,-.012);bachi.lineTo(.032,-.063);bachi.lineTo(-.039,-.047);bachi.lineTo(-.009,-.009);bachi.closePath();
  const pick=new THREE.ExtrudeGeometry(bachi,{depth:.004,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:1});
  place('shamiHide',pick.scale(.85,.91,1).rotateZ(-.48).translate(-.143,.492,.324));
}

function byobu(b:Builder) {
  const painting = screenPainting();
  const panels = 2, panelWidth=.58, height=1.52, y=2.55+height/2;
  const angles=[-.43,.39];
  let leftX=-1.61, leftZ=.65;
  for (let i=0;i<panels;i++) {
    const a=angles[i], dx=Math.cos(a), dz=-Math.sin(a);
    const x=leftX+dx*panelWidth/2,z=leftZ+dz*panelWidth/2;
    b.box('walnut',x,y,z,panelWidth,.001+height,.043,0,a);
    const image=painting.clone();image.offset.x=i/panels;image.repeat.x=1/panels;image.needsUpdate=true;
    const name='byobuPanel'+i;
    b.material(name,new THREE.MeshStandardMaterial({map:image,metalness:.12,roughness:.78}));
    const sheet=new THREE.PlaneGeometry(panelWidth-.044,height-.056);
    b.mesh(name,sheet,x+Math.sin(a)*.024,y,z+Math.cos(a)*.024,0,a);
    for(const sign of [-1,1]) {
      b.box('brass',x,y+sign*(height/2-.024),z,panelWidth-.015,.006,.052,0,a);
      const edge=sign*(panelWidth/2-.011);
      b.box('lacquer',x+dx*edge,y,z+dz*edge,.021,height,.054,0,a);
      for(const dy of [-.604,0,.604])
        b.box('brass',x+dx*edge,y+dy,z+dz*edge,.023,.036,.055,0,a);
    }
    leftX+=dx*panelWidth;leftZ+=dz*panelWidth;
  }
}

function platform(b:Builder,x:number,y:number,z:number,w:number,d:number) {
  b.box('walnut',x,y-.167,z,w,.288,d);
  b.box('cedar',x,y-.078,z,w+.035,.087,d+.035);
  const count=Math.ceil(d/.22),pitch=d/count;
  for(let i=0;i<count;i++){
    const front=z+d/2-(i+.5)*pitch;
    // Stagger end joints to avoid an uninterrupted slab across large platforms.
    const pieces=Math.max(1,Math.round(w/3.7)),cut=w/(pieces+.4);
    let left=x-w/2;
    for(let j=0;j<pieces;j++) {
      const right=j===pieces-1?x+w/2:x-w/2+cut*(j+(.76+(i*7%9)*.06));
      b.box('floor',(left+right)/2,y-.025,front,right-left-.003,.05,pitch-.004);left=right;
    }
  }
}

function rail(b:Builder,a:P,c:P,height:number,steps:number,subrail:boolean,heavy=false) {
  const at=(t:number,h:number):P=>[a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t+h,a[2]+(c[2]-a[2])*t];
  const w=heavy?.118:.073;
  b.beam(heavy?'redwood':'cedar',at(0,height),at(1,height),w,w*.78);
  b.beam('hinoki',at(0,height+.015),at(1,height+.015),w*.74,w*.62);
  if(subrail) {
    b.beam(heavy?'cedar':'brass',at(0,height*.54),at(1,height*.54),heavy?.082:.028,heavy?.105:.031);
    if(heavy)b.beam('walnut',at(0,.16),at(1,.16),.075,.128);
  }
  for(let i=0;i<=steps;i++) {
    const [x,y,z]=at(i/steps,0);
    const size=heavy?.135:.084;
    b.box(heavy?'redwood':'cedar',x,y+height*.5,z,size,height+.059,size);
    b.box('walnut',x,y+.08,z,size+.032,.133,size+.032);
    b.box('brass',x,y+height-.051,z,size+.012,.016,size+.012);
    b.box('hinoki',x,y+height+.031,z,size+.022,.034,size+.022);
  }
}

function stagePlatform(b:Builder,props:Builder) {
  platform(b,-1,2.5,1.5,5.60,4.20);
  for(const x of [-3.6,-1.05,1.6]) for(const z of [-.35,3.37]) {
    b.box('stone',x,.19,z,.41,.5,.41);
    b.box('cedar',x,1.26,z,.24,2.04,.24);
    for(const s of [-1,1])
      b.beam('walnut',[x,1.55,z],[x+s*.5,2.17,z],.109,.12);
  }
  for(const z of [-.6,3.60]) {
    b.box('cedar',-1,2.288,z,5.74,.297,.152);
    b.box('hinoki',-1,2.413,z,5.77,.065,.17);
    b.box('goldLight',-1,2.137,z+.001,5.46,.015,.13);
  }
  for(const x of [-3.8,1.8]) {
    b.box('cedar',x,2.288,1.5,.147,.297,4.22);
    b.box('hinoki',x,2.413,1.5,.168,.065,4.25);
    b.box('goldLight',x,2.138,1.5,.13,.015,3.95);
  }
  const weave=paintedTexture(256,256,ctx=>{
    const random=seeded(24);
    ctx.fillStyle='#d6ccc0';ctx.fillRect(0,0,256,256);
    for(let i=0;i<256;i+=2){
      ctx.fillStyle=i%4?'#e4dbd0':'#bfb6a8';
      ctx.fillRect(0,i,256,1);
      ctx.fillStyle='rgba(104,93,78,.14)';ctx.fillRect(i,0,1,256);
    }
    for(let i=0;i<1050;i++) {
      ctx.fillStyle=random()<.5?'rgba(255,251,244,.28)':'rgba(99,80,66,.23)';
      ctx.fillRect(random()*256,random()*256,random()*3+1,.7);
    }
  });
  weave.wrapS=weave.wrapT=THREE.RepeatWrapping;
  weave.repeat.set(1.25,1.25);
  for(const [name,color] of [['persimmon','#c84313'],['redSelvedge','#802015'],['vermilion','#b93910']]) {
    b.material(name,new THREE.MeshStandardMaterial({color,map:weave,bumpMap:weave,bumpScale:.0016,roughness:.94}));
  }
  b.box('redSelvedge',-1,2.512,1.5,4.93,.023,3.51);
  b.box('vermilion',-1,2.528,1.5,4.86,.017,3.44);
  for(let i=0;i<4;i++)for(let j=0;j<2;j++) {
    b.box((i+j)%3===0?'persimmon':'vermilion',-1+(i-1.5)*1.105,2.541,1.5+(j-.5)*1.46,1.104,.018,1.455);
  }
  for(const x of [-3.215,1.215]) b.box('obiGold',x,2.543,1.5,.012,.007,2.93);
  const top=2.499;
  rail(b,[-3.66,top,3.46],[1.66,top,3.46],.56,2,false);
  rail(b,[-3.66,top,-.46],[1.66,top,-.46],.56,2,false);
  rail(b,[-3.66,top,2.27],[-3.66,top,3.46],.56,1,false);
  rail(b,[-3.66,top,-.46],[-3.66,top,.30],.56,1,false);
  rail(b,[1.66,top,-.46],[1.66,top,1.10],.56,1,false);
  // Four larger lacquered corner newels and chased brass finials.
  for(const x of [-3.66,1.66])for(const z of [-.46,3.46]){
    b.box('redwood',x,top+.325,z,.134,.65,.134);
    b.cylinder('brass',x,top+.653,z,.069,.079,.023,16);
    b.mesh('brass',new THREE.SphereGeometry(1,16,10).scale(.067,.046,.067),x,top+.689,z);
  }
  const shade=paintedTexture(96,96,ctx=>{
    const grad=ctx.createRadialGradient(48,48,11,48,48,48);
    grad.addColorStop(0,'rgba(57,29,17,.78)');grad.addColorStop(.60,'rgba(62,36,24,.39)');grad.addColorStop(1,'rgba(70,40,23,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,96,96);
  });
  props.material('seatShadow',new THREE.MeshBasicMaterial({map:shade,transparent:true,depthWrite:false}));
  props.mesh('seatShadow',new THREE.PlaneGeometry(1.19,.99),-1.11,2.553,1.55,-Math.PI/2);
  dressFigure(props);
  byobu(props);
}

function stairs(b:Builder,bottom:P,top:P,width:number,count:number,grand:boolean) {
  const dx=top[0]-bottom[0], dz=top[2]-bottom[2], dy=top[1]-bottom[1];
  const length=Math.hypot(dx,dz),run=length/count,rise=dy/count;
  const sx=-dz/length, sz=dx/length, yaw=Math.atan2(dx,dz);
  const at=(t:number,side:number,lift:number):P=>[
    bottom[0]+dx*t+sx*side,bottom[1]+dy*t+lift,bottom[2]+dz*t+sz*side
  ];
  for(let i=0;i<count;i++) {
    const [x,y,z]=at((i+.5)/count,0,rise/2),w=width+.07;
    b.box('cedar',x,y-rise/2-.075,z,w,rise+.15,run+.025,0,yaw);
    b.box('hinoki',x,y-.029,z,w+.023,.058,run+.021,0,yaw);
    // A gently textured warm runner leaves a bright timber margin on either side.
    b.box('stairRunner',x,y+.004,z,w*(grand?.785:.76),.009,run-.026,0,yaw);
    const [nx,ny,nz]=at(i/count,0,rise);
    b.box('walnut',nx,ny-.036,nz,w+.026,.041,.028,0,yaw);
    b.box('hinoki',nx,ny-.011,nz,w+.038,.027,.047,0,yaw);
    // Recessed grazers at the lower outer cheeks, not luminous strips across each tread.
    for(const sign of [-1,1]) {
      const [lx,ly,lz]=at(i/count+.18/count,(width/2-.085)*sign,rise-.082);
      b.box('goldLight',lx,ly,lz,.145,.019,.072,0,yaw);
    }
  }
  for(const side of [-width*.466,width*.466]) {
    b.beam('walnut',at(0,side,-.25),at(1,side,-.25),.157,.33);
    b.beam('cedar',at(0,side,-.12),at(1,side,-.12),.22,.19);
    b.beam('goldLight',at(.015,side+.11*Math.sign(side),-.159),at(.985,side+.11*Math.sign(side),-.159),.02,.022);
    rail(b,at(0,side,0),at(1,side,0),grand?.94:.86,grand?5:3,true,true);
    // Recess the LED into the inner lip of the timber cap.
    const inside=side-Math.sign(side)*.043,cap=grand?.885:.805;
    b.beam('goldLight',at(.002,inside,cap),at(.998,inside,cap),.018,.022);
    for(const frac of grand?[.32,.68]:[.65]) {
      const [px,py,pz]=at(frac,side,-.32);
      b.box('stone',px,.16,pz,.38,.43,.40);
      b.box('walnut',px,(py+.2)/2,pz,.218,py-.2,.258);
    }
  }
}

function galleryLamp(b:Builder,x:number,y:number,z:number) {
  b.box('walnut',x,y+.067,z,.28,.134,.28);
  b.box('cedar',x,y+.37,z,.080,.55,.08);
  b.box('walnut',x,y+.64,z,.232,.07,.232);
  b.box('lantern',x,y+.916,z,.196,.50,.196);
  for(const dx of [-.103,.103])for(const dz of [-.103,.103])
    b.box('walnut',x+dx,y+.91,z+dz,.014,.54,.014);
  for(const dy of [.667,.738,1.085,1.163])b.box('cedar',x,y+dy,z,.222,.017,.222);
  b.box('walnut',x,y+1.20,z,.252,.065,.252);
}

export function buildStage(b:Builder): void {
  const stage = new StageBuilder(b);
  stagePlatform(stage,b);
  platform(stage,-1,2.5,3.84,5.60,.48);
  stage.box('cedar',-1,2.268,4.023,5.65,.345,.151);
  stage.box('hinoki',-1,2.435,4.056,5.70,.091,.159);
  stage.box('goldLight',-1,2.098,4.027,5.32,.015,.109);
  for(const x of [-3.50,-1.02,1.48]) {
    stage.box('cedar',x,2.135,3.68,.19,.22,.88);
    stage.beam('cedar',[x,1.61,3.39],[x,2.13,3.96],.13,.16);
  }
  cutDeck(b,eastApron,10);
  cutDeck(b,eastTurn,3);
  cutDeck(b,eastWing,3);cutDeck(b,eastWingTip,3);
  platform(b,4.85,2.50,2.30,3.00,3.70);
  const at=(strip:typeof westBridge,t:number,side:number):P=>{
    const [x,z]=onStrip(strip,t,side);
    return [x,2.50,z];
  };
  rail(b,at(eastApron,.04,.02),at(eastApron,.94,.02),.82,1,true);
  rail(b,at(eastWing,0,.05),at(eastWing,0,.97),.83,1,true);
  rail(b,[2.37,2.50,4.10],[3.29,2.50,4.10],.83,1,true);
  rail(b,at(eastTurn,0,.02),at(eastTurn,.97,.02),.82,1,true);
  rail(b,[5.94,2.50,4.10],[6.28,2.50,4.10],.83,1,true);
  for(const [x,z] of [[3.34,1.18],[3.48,3.91],[6.12,1.28],[6.12,3.89]])
    b.box('cedar',x,1.09,z,.204,2.14,.204);
  stairs(b,[4.7,2.5,2.8],[10,7.9,-8.2],2.90,32,true);
  stairs(b,[4.6,.2,9.0],[4.6,2.5,4.15],2.50,14,false);
  cutDeck(b,westBridge,42);
  for(const side of [.035,.965])rail(b,at(westBridge,.012,side),at(westBridge,.985,side),.83,4,true);
  for(const t of [.06,.36,.80])for(const side of [.15,.85]){
    const [x,,z]=at(westBridge,t,side);
    b.box('stone',x,.17,z,.33,.43,.33);
    b.box('cedar',x,1.20,z,.185,2.06,.185);
    b.beam('cedar',[x,1.60,z],[x+.42,2.24,z-.14],.087,.12);
  }
  galleryLamp(b,...at(westBridge,.77,.928));
  galleryLamp(b,...at(westBridge,.175,.08));
  galleryLamp(b,...at(eastApron,.20,.09));
  platform(b,.5,6.70,12.75,23,2.5);
  rail(b,[-10.96,6.70,11.53],[11.43,6.70,11.53],.88,10,true);
  b.box('cedar',.5,6.38,11.57,23,.36,.23);
  for(const x of [-10.61,-5.46,.08,5.7,11.68]){
    b.box('stone',x,.16,13.3,.53,.46,.53);
    b.box('walnut',x,3.33,13.30,.31,6.26,.37);
    b.box('cedar',x,6.28,12.65,.37,.29,2.25);
    b.beam('cedar',[x,5.30,13.30],[x,6.22,12.28],.165,.21);
  }
}
