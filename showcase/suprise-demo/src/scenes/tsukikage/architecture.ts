import { CanvasTexture, CatmullRomCurve3, ExtrudeGeometry, LatheGeometry, MeshStandardMaterial, RepeatWrapping, Shape, SphereGeometry, SRGBColorSpace, TubeGeometry, Vector2, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Builder } from './builder';

type Finish = Parameters<Builder['box']>[0];
type Point = [number, number, number];

/** u follows a wall, v points out from that wall into the atrium. */
function wallFrame(b: Builder, x: number, z: number, yaw = 0) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const point = (u: number, y: number, v: number): Point => [x + c * u + s * v, y, z - s * u + c * v];
  const box = (m: Finish, u: number, y: number, v: number, w: number, h: number, d: number) => {
    const [px, py, pz] = point(u, y, v);
    b.box(m, px, py, pz, w, h, d, 0, yaw);
  };
  return { box, point };
}

type Wall = ReturnType<typeof wallFrame>;

function clayFacing(b:Builder,back:Wall,left:Wall) {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!,pix=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
    const fx=x*Math.PI/128,fy=y*Math.PI/128;
    const lime=1.9*Math.sin(fx+fy)+2.4*Math.sin(fy*3-Math.sin(fx*3))+.9*Math.cos(7*fx+fy);
    const grit=5.4*Math.sin(x*2.4+y*1.83)*Math.sin(x*1.12-y*2.7);
    const at=(y*256+x)*4;
    pix.data[at]=192+lime+grit;pix.data[at+1]=153+lime+grit;pix.data[at+2]=102+lime+grit;
    pix.data[at+3]=255;
  }
  ctx.putImageData(pix,0,0);
  const wash=new CanvasTexture(canvas);
  wash.colorSpace=SRGBColorSpace;wash.wrapS=wash.wrapT=RepeatWrapping;
  wash.repeat.set(.73,.73);
  b.material('ochreClay',new MeshStandardMaterial({map:wash,bumpMap:wash,bumpScale:.003,roughness:.98}));

  // Deep, almost uninterrupted lime-plaster face of the rear balcony beam.
  // Its lower sill is well clear of the walking level and projects over the gable.
  const x=2.46, width=14.48;
  b.box('ochreClay',x,7.108,-8.28,width,1.16,.27);
  b.box('cedar',x,7.706,-8.16,width+.15,.15,.40);
  b.box('hinoki',x,7.788,-8.122,width+.21,.052,.48);
  b.box('walnut',x,6.507,-8.27,width+.12,.11,.36);
  b.box('cedar',x,6.447,-8.23,width+.20,.064,.38);
  for(const end of [-1,1])b.box('cedar',x+end*(width/2-.044),7.11,-8.25,.087,1.18,.35);

  // Blind bays between guest rooms contain timber wainscoting and a clay wash.
  // Together these break up the repeated pattern of illuminated shoji.
  function blind(wall:Wall,u:number,floor:number,span:number,height:number) {
    const depth=1.23;
    wall.box('ochreClay',u,floor+height*.55,depth,span,height*.89,.15);
    wall.box('cedar',u,floor+.27,depth+.032,span,.53,.18);
    wall.box('walnut',u,floor+.55,depth+.074,span+.04,.072,.18);
    wall.box('walnut',u,floor+height-.015,depth,span+.04,.092,.23);
    for(const sign of [-1,1])wall.box('redwood',u+sign*(span/2-.048),floor+height/2,depth+.02,.095,height,.21);
  }
  blind(back,-9.78,3.20,4.02,3.60);
  blind(back,6.33,3.20,4.12,3.54);
  blind(back,-10.65,7.91,3.22,3.22);
  blind(left,5.78,3.27,4.83,3.04);
  blind(left,-5.48,3.27,4.72,3.04);
}

function shoji(wall: Wall, u: number, y: number, v: number, width: number, height: number, leaves: number, lit = false) {
  const leaf = width / leaves;
  wall.box('walnut', u, y + .075, v, width + .14, .15, .19);
  wall.box('walnut', u, y + height - .07, v, width + .14, .14, .18);
  for (let i = 0; i < leaves; i++) {
    const center = u - width / 2 + (i + .5) * leaf;
    const track = v + (i % 2) * .028;
    wall.box(lit ? 'paperGlow' : 'paper', center, y + height / 2, track, leaf - .025, height - .13, .031);
    for (const side of [-1, 1]) {
      wall.box('cedar', center + side * (leaf / 2 - .029), y + height / 2, track + .033, .055, height - .13, .068);
    }
    wall.box('cedar', center, y + .19, track + .042, leaf - .05, .21, .062);
    const cols = Math.max(2, Math.round(leaf / .34));
    for (let j = 1; j < cols; j++) {
      wall.box('hinoki', center - leaf / 2 + j * leaf / cols, y + height * .535, track + .028, .020, height * .87, .029);
    }
    const rows = Math.max(4, Math.round(height / .325));
    for (let j = 1; j < rows; j++) {
      wall.box('hinoki', center, y + .23 + j / rows * (height - .27), track + .044, leaf - .06, .022, .026);
    }
    wall.box('dark', center + (i % 2 ? -1 : 1) * (leaf / 2 - .04), y + .91, track + .072, .014, .108, .012);
  }
}

function lantern(b: Builder, x: number, y: number, z: number, size = .39) {
  const h = size * 1.8;
  b.box('walnut', x, y + size * .10, z, size * 1.12, size * .2, size * 1.12);
  b.box('lantern', x, y + h * .56, z, size * .92, h * .86, size * .92);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    b.box('walnut', x + sx * size * .48, y + h * .55, z + sz * size * .48, .025, h * .90, .025);
  }
  for (const f of [.24, .83, .99]) b.box('cedar', x, y + h * f, z, size, f === .99 ? .048 : .021, size);
}

function vase(b: Builder, wall: Wall, u: number, y: number, v: number, tall: number) {
  const profile = [[.10,0],[.17,.05],[.29,.35],[.26,.58],[.13,.78],[.10,.91],[.13,.95],[.13,1],[.095,1],[.095,.93]];
  const [x, base, z] = wall.point(u, y, v);
  const pot = new LatheGeometry(profile.map(([r, h]) => new Vector2(r * tall, h * tall)), 18);
  b.mesh('charcoal', pot, x, base, z);
  for (let k = 0; k < 3; k++) {
    const start = wall.point(u, y + tall * .9, v);
    const tip = wall.point(u + (k - 1) * .44, y + tall + .5 + .07 * k, v + .06 * k);
    b.beam('walnut', start, tip, .016);
    for (const side of [-1, 1]) {
      const end = wall.point(u + (k - 1) * .44 + side * .16, tip[1] + .13, v + .05);
      b.beam('walnut', tip, end, .01);
    }
  }
}

function guestBay(b: Builder, wall: Wall, u: number, y: number, span: number, h: number, variant: number) {
  // Door leaves sit a full step back from the balustrade, with deeper occupied bays between them.
  wall.box('redwood', u - span / 2, y + h / 2, 1.02, .26, h, .30);
  wall.box('cedar', u, y + h - .28, 1.01, span, .26, .33);
  wall.box('plaster', u, y + h - .60, .93, span - .22, .43, .13);
  wall.box('walnut', u, y + h - .86, 1.03, span - .19, .074, .22);
  const doorH = h - .90;
  if (variant % 4 === 0) {
    // Open tokonoma with a stepped timber reveal, an inset scroll and an ikebana vessel.
    wall.box('plaster', u, y + doorH / 2, -.14, span - .23, doorH, .17);
    wall.box('tatami', u, y + .084, .25, span - .22, .12, 1.62);
    wall.box('walnut', u, y + .095, .98, span - .23, .15, .12);
    const screenWidth = span * .34;
    shoji(wall, u - span * .29, y + .1, .94, screenWidth, doorH - .10, 1);
    const scrollU = u + span * .12;
    wall.box('charcoal', scrollU, y + doorH * .57, -.028, .71, doorH * .63, .033);
    wall.box('cream', scrollU, y + doorH * .58, -.002, .60, doorH * .43, .023);
    // Asymmetric ink reeds on the hanging scroll.
    for (let stem = 0; stem < 3; stem++) {
      const bx = scrollU - .17 + .075 * stem;
      b.beam('charcoal', wall.point(bx, y + doorH * .4, .021), wall.point(bx + .075 * (stem - 1), y + doorH * (.59 + .073 * stem), .021), .012);
    }
    wall.box('walnut', scrollU, y + doorH * .25, -.001, .80, .037, .055);
    vase(b, wall, u + span * .34, y + .145, .37, .4);
  } else if (variant % 4 === 2) {
    // A bank of stained cedar storm shutters makes a quiet interval between the luminous paper.
    wall.box('cedar', u, y + doorH / 2, .68, span - .21, doorH, .12);
    const shutters = 5;
    for (let i = 0; i < shutters; i++) {
      const xx = u + span * ((i + .5) / shutters - .5);
      wall.box('walnut', xx - span / shutters * .44, y + doorH / 2, .78, .052, doorH, .075);
      for (let row = 0; row < 7; row++) wall.box('redwood', xx, y + doorH * (.27 + .095 * row), .79, span / shutters * .80, .045, .07);
    }
  } else {
    shoji(wall, u, y + .04, .94, span - .28, doorH - .04, 4, variant % 8 === 1);
  }
}

function balconyRail(wall: Wall, start: number, end: number, y: number, v: number) {
  const length = end - start, u = (start + end) / 2;
  for (const [height, thickness, depth] of [[1.02,.12,.17],[.59,.055,.09],[.25,.058,.095]]) {
    wall.box('cedar', u, y + height, v, length, thickness, depth);
  }
  wall.box('hinoki', u, y + 1.09, v, length + .06, .034, .19);
  const n = Math.ceil(length / 2.45);
  for (let i = 0; i <= n; i++) {
    const at = start + i * length / n;
    wall.box('walnut', at, y + .555, v, .13, 1.11, .13);
    wall.box('brass', at, y + 1.12, v, .143, .028, .143);
  }
}

function gallery(b: Builder, wall: Wall, span: number, y: number, depth: number, height: number, phase: number, openings: [number, number][] = []) {
  const edge = depth - .19;
  wall.box('floor', 0, y - .095, depth / 2, span, .19, depth);
  wall.box('walnut', 0, y - .35, depth - .13, span, .52, .32);
  wall.box('plaster', 0, y - .38, depth - .035, span, .27, .15);
  wall.box('cedar', 0, y - .61, depth - .045, span, .10, .25);
  wall.box('hinoki', 0, y - .11, depth + .008, span, .13, .24);
  wall.box('cedar', 0, y - .36, .61, span, .45, .29);
  let railStart = -span / 2;
  for (const [from, to] of openings) {
    if (from > railStart) balconyRail(wall, railStart, from, y, edge);
    railStart = to;
  }
  if (railStart < span / 2) balconyRail(wall, railStart, span / 2, y, edge);
  const bays = Math.round(span / 4.25);
  const bay = span / bays;
  for (let i = 0; i < bays; i++) {
    const u = -span / 2 + (i + .5) * bay;
    guestBay(b, wall, u, y, bay, height, i + phase);
    wall.box('walnut', u - bay / 2, y - .43, depth / 2, .17, .29, depth + .12);
    if (i % 3 === phase % 3) {
      const [x, yy, z] = wall.point(u - bay * .39, y + .02, depth - .68);
      lantern(b, x, yy, z, .31);
    }
  }
}

function teaRoomFinishes(b: Builder) {
  const woven = (warm: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!, pixels = ctx.createImageData(256,256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const warp = Math.cos(y * Math.PI / 2);
      const weft = Math.cos((x + (Math.floor(y/4) % 2) * 2) * Math.PI / 4);
      const fleck = Math.sin((y + 12.59) * 349.51 + x * 37.2) * 673.42;
      const shade = warp * 12 + weft * 6 + 9 * (fleck - Math.floor(fleck));
      const tone = warm ? [190,178,128] : [102,130,141];
      const at = (y * 256 + x) * 4;
      for (let k = 0; k < 3; k++) pixels.data[at+k] = tone[k] + shade;
      pixels.data[at+3] = 255;
    }
    ctx.putImageData(pixels,0,0);
    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(warm ? 1.9 : 1.2,warm ? 2.9 : 1.2);
    texture.anisotropy = 6;
    texture.colorSpace = SRGBColorSpace;
    return texture;
  };
  const rush = woven(true), cloth = woven(false);
  b.material('rushMat',new MeshStandardMaterial({map:rush,bumpMap:rush,bumpScale:.0007,roughness:.92}));
  b.material('indigoSeat',new MeshStandardMaterial({map:cloth,color:0x789ba1,bumpMap:cloth,bumpScale:.0007,roughness:.98}));
  b.material('brocade',new MeshStandardMaterial({map:cloth,color:0x41575c,roughness:.94}));
  b.material('teaGlaze',new MeshStandardMaterial({color:0xa3a792,roughness:.30,metalness:.10}));
  b.material('tenmoku',new MeshStandardMaterial({color:0x3c413a,roughness:.24,metalness:.17}));
  b.material('teaInfusion',new MeshStandardMaterial({color:0x6c5130,roughness:.14,metalness:.19}));
  b.material('berry',new MeshStandardMaterial({color:0xad4b36,roughness:.56}));
  b.material('teaLeaves',new MeshStandardMaterial({color:0x686e46,roughness:.75}));
}

function teaSetting(b: Builder, x: number, y: number, z: number) {
  type Profile = [radius:number,height:number][];
  const vessel = (m:string, px:number, pz:number, profile:Profile, base=y) => {
    b.mesh(m,new LatheGeometry(profile.map(([r,h])=>new Vector2(r,h)),32),x+px,base,z+pz);
  };
  function curve(m:string, coords:Point[], radius:number) {
    const path = new CatmullRomCurve3(coords.map(([px,py,pz])=>new Vector3(x+px,y+py,z+pz)));
    b.mesh(m,new TubeGeometry(path,Math.max(10,coords.length*4),radius,6,false));
  }
  const berry = new SphereGeometry(1,8,6);
  const leaf = new SphereGeometry(1,10,6).scale(.014,.042,.005).rotateZ(-.68);
  // A round celadon bud vase and a few irregular winter stems.
  vessel('teaGlaze',-.81,-.025,[[.071,0],[.083,.01],[.104,.073],[.103,.147],[.073,.206],[.041,.23],[.039,.267],[.046,.27],[.043,.282],[.031,.281],[.030,.252]]);
  for (let i=0;i<5;i++) {
    const endX=-.85+(i-2)*.086, endY=.51+.14*Math.cos(i*1.7), endZ=-.020+.058*Math.sin(i*.96);
    const bx=-.81+(i-2)*.005;
    const tip:Point=[endX,endY,endZ];
    curve('walnut',[[bx,.25,-.025],[bx+.008,.32,-.03],[(bx+endX)/2,endY-.069,endZ-.013],tip],.0028);
    for(let j=0;j<4;j++) {
      const t=(j+1)/5, tx=endX*(1-t)+bx*t, ty=endY*(1-t)+.26*t;
      const sign=j%2===0?1:-1, lx=tx+.04*sign, ly=ty+.055;
      curve('walnut',[[tx,ty,endZ],[tx+.019*sign,ty+.035,endZ+.013],[lx,ly,endZ+.017]],.0018);
      if((i+j)%3===0) {
        b.mesh('teaLeaves',leaf,x+lx,y+ly+.018,z+endZ+.019,0,.27*i,sign*.60);
      } else {
        const sizes=[.008,.006,.0075];
        for(let k=0;k<3;k++) {
          const r=sizes[k];
          b.mesh('berry',berry.clone().scale(r,r*1.03,r),x+lx+k*.008,y+ly+(k===1?.008:0),z+endZ+.014+(k===1?.008:0));
        }
      }
    }
  }
  const tray = new RoundedBoxGeometry(.91,.036,.47,4,.018);
  b.mesh('lacquer',tray,x+.24,y+.019,z-.015);
  b.mesh('walnut',new RoundedBoxGeometry(.85,.011,.415,3,.005),x+.24,y+.039,z-.015);
  const base=y+.045;
  // Side-handled kyusu: thrown clay body, separate lid, spout and hollow handle end.
  vessel('tenmoku',.13,-.059,[[.067,0],[.074,.008],[.101,.04],[.105,.083],[.092,.12],[.073,.136],[.075,.142],[.059,.142],[.06,.129]],base);
  vessel('tenmoku',.13,-.059,[[.077,.133],[.079,.14],[.060,.154],[.020,.162],[.020,.175],[.028,.18],[.019,.19],[.001,.192]],base);
  const spout = new LatheGeometry([[.038,0],[.035,.037],[.024,.09],[.022,.12],[.016,.12],[.016,.088]].map(([r,h])=>new Vector2(r,h)),18);
  b.mesh('tenmoku',spout.rotateZ(-.74),x+.194,base+.043,z-.058);
  const handle = new LatheGeometry([[.031,0],[.029,.04],[.029,.103],[.032,.124],[.024,.124],[.021,.075]].map(([r,h])=>new Vector2(r,h)),18);
  b.mesh('tenmoku',handle.rotateX(-1.33),x+.118,base+.075,z-.125);
  for(const [cx,cz] of [[.447,.075],[.52,-.107],[-.03,.091]]) {
    vessel('teaGlaze',cx,cz,[[.028,0],[.033,.005],[.034,.015],[.045,.023],[.052,.073],[.051,.081],[.046,.081],[.043,.059],[.034,.026],[.012,.019]],base);
    b.cylinder('teaInfusion',x+cx,base+.060,z+cz,.045,.044,.001,24);
  }
  vessel('lacquer',-.255,.077,[[.052,0],[.057,.005],[.059,.017],[.059,.107],[.064,.113],[.061,.126],[.046,.13],[.001,.13]]);
  vessel('brass',-.255,.077,[[.060,.106],[.060,.109]]);
}

function floorCushion(b: Builder,x:number,y:number,z:number,turn:number) {
  const g = new RoundedBoxGeometry(.66,.128,.56,5,.061);
  const p = g.attributes.position;
  for(let i=0;i<p.count;i++) {
    const px=p.getX(i), py=p.getY(i), pz=p.getZ(i);
    if(py<0)continue;
    const edge=Math.max(0,(1-(px/.34)**2)*(1-(pz/.29)**2));
    const dimple=.028*Math.exp(-45*(px*px+pz*pz));
    p.setY(i,py+edge*.029-dimple);
  }
  g.computeVertexNormals();
  b.mesh('indigoSeat',g,x,y+.064,z,0,turn);
  const outline: Point[]=[[.298,.002,.252],[0,.004,.270],[-.29,.002,.256],[-.319,0,.214],[-.324,-.003,0],[-.316,0,-.232],[-.286,.002,-.254],[0,.004,-.270],[.286,.001,-.254],[.318,0,-.223],[.324,-.002,0],[.319,.002,.212]];
  const rim=new CatmullRomCurve3(outline.map(v=>new Vector3(...v)),true);
  b.mesh('brocade',new TubeGeometry(rim,60,.004,5,true),x,y+.064,z,0,turn);
}

function teaPavilion(b: Builder) {
  const x0 = -11.87, x1 = -5.22, z0 = -6.62, z1 = -1.73;
  const w = x1 - x0, d = z1 - z0, x = (x1 + x0) / 2, z = (z1 + z0) / 2;
  const floor = 2.50, top = 6.03;
  b.box('walnut', x, floor - .16, z, w + .20, .29, d + .18);
  teaRoomFinishes(b);
  b.box('walnut', x, floor - .022, z, w, .038, d);
  const matLength=w/4, matDepth=d/5;
  for(let row=0;row<5;row++) {
    const zz=z0+(row+.5)*matDepth, phase=row%2 ? -.5:0;
    for(let col=0;col<(row%2 ? 5:4);col++) {
      const a=Math.max(x0,x0+(col+phase)*matLength), c=Math.min(x1,x0+(col+phase+1)*matLength);
      b.box('rushMat',(a+c)/2,floor+.002,zz,c-a-.008,.017,matDepth-.012);
      for(const sign of [-1,1]) b.box('brocade',(a+c)/2,floor+.013,zz+sign*(matDepth/2-.016),c-a-.008,.010,.026);
    }
  }
  for (const xx of [x0, x1]) b.box('cedar', xx, floor, z, .19, .11, d + .23);
  for (const zz of [z0, z1]) b.box('cedar', x, floor, zz, w + .22, .11, .17);
  for (const xx of [x0 + .38, x1 - .38]) for (const zz of [z0 + .35, z1 - .35]) {
    b.box('walnut', xx, 1.26, zz, .30, 2.5, .30);
    b.box('stone', xx, .16, zz, .51, .39, .52);
  }
  for (const xx of [x0, x, x1]) for (const zz of [z0, z1]) {
    b.box('hinoki', xx, (floor + top) / 2, zz, .19, top - floor, .19);
    b.box('brass', xx, floor + .21, zz, .195, .035, .195);
  }
  for (const zz of [z0, z1]) {
    b.box('hinoki', x, top, zz, w + .2, .19, .17);
    b.box('cedar', x, floor + .19, zz, w + .19, .12, .14);
  }
  for (const xx of [x0, x1]) {
    b.box('hinoki', xx, top, z, .18, .19, d + .13);
    b.box('cedar', xx, floor + .17, z, .13, .13, d);
  }
  // Fine removable lattice screens with an open return at the back of the east face.
  for (let i = 1; i < 47; i++) {
    const xx = x0 + w * i / 47;
    b.box('hinoki', xx, (floor + top + .07) / 2, z1, .046, top - floor - .23, .067);
  }
  for (let i = 0; i < 21; i++) {
    const zz = z1 - .16 - i * .143;
    b.box('hinoki', x1, (floor + top + .07) / 2, zz, .067, top - floor - .23, .046);
  }
  b.box('cedar', x, floor + .73, z1 - .06, w, .059, .069);
  b.box('cedar', x1 - .06, floor + .73, z1 - 1.56, .069, .059, 2.98);
  b.box('goldLight', x, floor + .12, z1 + .067, w - .25, .035, .025);
  b.box('goldLight', x1 + .071, floor + .12, z1 - 1.58, .024, .036, 2.96);
  for (let i = 0; i < 6; i++) {
    const xx = x0 + i / 5 * w;
    b.box('cedar', xx, top + .013, z, .115, .18, d);
  }
  for (let i = 1; i <= 27; i++) {
    const zz = z0 + i * d / 28;
    b.box('cedar', x, top - .017, zz, w - .12, .068, .054);
  }
  const back = wallFrame(b, x, z0 + .04);
  shoji(back, 0, floor, 0, w - .20, 2.66, 5, true);
  back.box('plaster', 0, top - .43, 0, w, .76, .14);
  const side = wallFrame(b, x0 + .05, z, Math.PI / 2);
  shoji(side, 0, floor, 0, d - .14, 2.66, 4);
  // Low table with its plinth and seat pads visible through the vertical battens.
  b.box('walnut', x + .12, floor + .35, z - .08, 2.52, .10, 1.0);
  for (const xx of [-.92, .92]) for (const zz of [-.34, .34]) {
    b.box('redwood', x + .12 + xx, floor + .16, z - .08 + zz, .098, .32, .09);
  }
  for (const xx of [-.66, .73]) for (const zz of [-.88, .86]) {
    floorCushion(b,x+xx,floor+.013,z+zz,.042*Math.sin(xx*22+zz*26));
  }
  teaSetting(b,x+.12,floor+.401,z-.08);
  for (const xx of [x0 + .44, x1 - .46]) lantern(b, xx, floor + .02, z1 - .52, .46);
}

function gabledReadingRoom(b: Builder) {
  const x = -.82, front = -7.24, floor = 2.5, spring = 5.25, peak = 7.31;
  const half = 4.43, roofFront = front + 1.03, roofBack = -10.05;
  const wall = wallFrame(b, x, front);
  wall.box('plaster', 0, floor + .27, -.10, half * 2 - .40, .56, .21);
  shoji(wall, -.03, floor + .24, -.017, half * 2 - .79, 2.35, 6, true);
  for (const side of [-1,1]) {
    wall.box('redwood', side * (half - .27), floor + 1.38, .04, .23, 2.78, .29);
    wall.box('cedar', side * (half - .30), floor - .23, .43, .21, .45, 1.02);
  }
  wall.box('cedar', 0, spring - .058, .12, half * 2 + .07, .23, .49);
  wall.box('hinoki', 0, spring + .085, .10, half * 2 + .15, .067, .46);
  wall.box('cedar', 0, floor + .21, .11, half * 2 - .32, .108, .35);
  wall.box('hinoki', 0, floor + .09, .27, half * 2 - .24, .11, .55);
  // Triangular plaster infill behind the projecting carved verge and layered soffit.
  const infill = new Shape();
  infill.moveTo(-half + .15,0);
  infill.lineTo(0, peak - spring - .13);
  infill.lineTo(half - .15, 0);
  infill.closePath();
  b.mesh('plaster', new ExtrudeGeometry(infill, { depth: .16, bevelEnabled:false }), x, spring + .015, front - .13);
  for (const sign of [-1, 1]) {
    const ridge: Point = [x,peak,roofFront], edge: Point = [x + sign * (half + .19),spring,roofFront];
    const length = Math.hypot(half + .19, peak - spring);
    const tilt = -sign * Math.atan2(peak - spring, half + .19);
    const roofDepth = roofFront - roofBack;
    b.box('hinoki', (ridge[0] + edge[0]) / 2, (peak + spring) / 2 - .095, (roofFront + roofBack) / 2, length, .145, roofDepth, 0, 0, tilt);
    b.box('roof', (ridge[0] + edge[0]) / 2, (peak + spring) / 2 + .014, (roofFront + roofBack) / 2, length + .072, .085, roofDepth + .095, 0, 0, tilt);
    // Standing seams glint in grazing light and cast shadows on the shallow zinc roof.
    for (let k = 0; k < 14; k++) {
      const zz = roofBack + .06 + k / 13 * (roofDepth - .12);
      b.box('roof', (ridge[0] + edge[0]) / 2, (peak + spring) / 2 + .072, zz, length + .026, .044, .040, 0, 0, tilt);
    }
    for (const [drop, projection, thickness] of [[.15,.04,.17],[.10,.09,.075]]) {
      b.beam('cedar', [ridge[0],peak-drop,roofFront+projection], [edge[0],spring-drop,roofFront+projection], thickness, .115);
    }
    b.beam('hinoki', [ridge[0],peak-.165,roofFront+.159], [edge[0],spring-.165,roofFront+.159], .050, .047);
    b.beam('walnut', [ridge[0],peak-.15,front+.125], [edge[0],spring-.15,front+.125], .088, .13);
    for (let k = 0; k < 12; k++) {
      const t = (k + .4) / 12;
      const xx = x + sign * t * (half + .19);
      const yy = peak - t * (peak - spring);
      b.box('hinoki', xx, yy - .17, roofFront - .45, .072, .095, .94);
    }
  }
  b.box('roof', x, peak + .062, (roofFront + roofBack) / 2, .23, .108, roofFront - roofBack + .18);
  wall.box('cedar', 0, spring + .18, .085, half * 2 - .23, .093, .14);
  wall.box('cedar', 0, spring + .055, .42, half * 2 + .22, .11, .37);
  wall.box('hinoki', 0, spring + .07, .61, half * 2 + .25, .055, .038);
  // The engawa wraps continuously behind the stage and connects the tea pavilion to the stairs.
  // Leave the flush tatami floor of the tea room visible wherever its footprint overlaps the engawa.
  b.box('floor', .3025, floor - .115, -7.33, 27.845, .23, 1.42);
  for (const [start,end] of [[-13.62,-11.87],[-5.22,14.225]]) {
    b.box('floor', (start+end)/2, floor-.115, -6.02, end-start, .23, 1.20);
  }
  b.box('cedar', .60, floor - .33, -5.48, 27.25, .39, .19);
  b.box('hinoki', .60, floor - .075, -5.42, 27.35, .095, .15);
  for (let i = 0; i < 9; i++) {
    const xx = -12.7 + i * 3.29;
    b.box('cedar', xx, 1.13, -5.73, .24, 2.25, .26);
    b.box('stone', xx, .11, -5.73, .43, .28, .45);
    b.box('walnut', xx, 2.19, -6.68, .17, .22, 2.72);
  }
  const railStart = -5.14, railEnd = 14.13, railZ = -5.51;
  for (const [dy,h,d] of [[.85,.087,.11],[.40,.045,.063]]) {
    b.box('cedar', (railStart + railEnd) / 2, floor + dy, railZ, railEnd - railStart, h, d);
  }
  for (let i = 0; i <= 8; i++) {
    const xx = railStart + (railEnd - railStart) * i / 8;
    b.box('redwood', xx, floor + .45, railZ, .088, .90, .089);
    b.box('brass', xx, floor + .907, railZ, .100, .022, .100);
  }
  for (const xx of [-4.87, 3.1]) lantern(b, xx, floor + .01, -6.57, .33);
  // The left bridge turns around the tea room and rejoins the rear gallery.
  const side = wallFrame(b,-13.62,.465,-Math.PI/2);
  b.box('floor', -12.81, floor-.115, .465, 1.62, .23, 11.77);
  b.box('cedar', -13.56, floor-.27, .465, .15, .3, 11.77);
  b.box('cedar', -12.07, floor-.27, .465, .15, .3, 11.77);
  balconyRail(side,-5.82,5.82,floor,-.08);
  balconyRail(side,-5.82,3.89,floor,-1.53);
  for(const z of [-4.97,-1.47,1.9,5.96]) {
    for(const x of [-13.45,-12.17]) b.box('cedar',x,1.10,z,.20,2.23,.20);
    b.box('walnut',-12.81,2.18,z,1.68,.24,.19);
  }
}

function arrivalStair(b: Builder) {
  // The broad sea of floorboards by the arrival view returns in eight shallow steps
  // to the east corridor. The upper landing is contiguous with the corridor deck.
  const near = 11.90, far = 8.70, center = 12.93, width = 1.86;
  const low = 6.70, rise = 1.20, count = 8, run = (near - far) / count;
  b.box('floor', 12.93, low - .095, 12.87, 1.86, .19, 1.94);
  b.box('cedar', 12.93, low - .29, 12.87, 1.86, .20, 1.94);
  for (let i = 0; i < count; i++) {
    const z = near - run * (i + .5), y = low + (i + 1) * rise / count;
    b.box('walnut', center, y - .102, z, width, .20, run);
    b.box('floor', center, y - .043, z + .01, width + .025, .086, run + .02);
    b.box('hinoki', center, y - .054, z + run / 2 + .025, width + .036, .063, .047);
    b.box('goldLight', center, y - .093, z + run / 2 + .012, width - .17, .013, .016);
  }
  for (const side of [-1,1]) {
    const x = center + side * (width / 2 - .042);
    b.beam('walnut', [x,low - .20,near + .06], [x,low + rise - .20,far - .09], .28, .135);
    for (const f of [0,.5,1]) {
      const z = near + (far - near) * f, y = low + rise * f;
      b.box('cedar', x, y + .49, z, .095, 1.10, .11);
      b.box('brass', x, y + 1.056, z, .105, .035, .12);
    }
    for (const y of [.48,1.01]) {
      b.beam('cedar', [x,low+y,near], [x,low+rise+y,far], y > 1 ? .105 : .056, y > 1 ? .117 : .064);
    }
  }
  const recess = wallFrame(b,15.10,10.85,-Math.PI/2);
  guestBay(b,recess,0,7.48,4.28,4.45,8);
}

export function buildArchitecture(b: Builder): void {
  const back = wallFrame(b, 0, -12.08);
  const left = wallFrame(b, -15.1, .45, Math.PI / 2);
  const right = wallFrame(b, 15.1, .45, -Math.PI / 2);
  const arrival = wallFrame(b, 0, 14.15, Math.PI);
  for (const [wall, span] of [[back,30.2],[arrival,30.2],[left,26.3],[right,26.3]] as const) {
    wall.box('plaster', 0, 7.23, -.47, span + .35, 16.0, .43);
    wall.box('walnut', 0, .76, -.19, span, 1.52, .16);
    wall.box('hinoki', 0, 1.54, -.14, span, .075, .14);
  }
  // Back-of-house lower walls and deep doors remain visible from the garden and underneath the bridges.
  for (const [wall, span, phase] of [[back,29.5,2],[left,25.6,1],[right,25.6,2],[arrival,29.5,4]] as const) {
    const bays = 6, bay = span / bays;
    for (let i = 0; i < bays; i++) guestBay(b, wall, -span / 2 + (i + .5) * bay, .04, bay, 3.01, i + phase);
    wall.box('walnut', 0, 3.07, .88, span, .29, .57);
  }
  for (let i = 0; i < 6; i++) {
    const xx = -12.46 + i * 4.97;
    guestBay(b, back, xx, 3.18, 4.97, 4.03, i + 2);
  }
  for (const [wall, phase] of [[left,6],[right,3],[arrival,5]] as const) {
    const width = wall === arrival ? 29.5 : 25.5;
    for (let i = 0; i < 6; i++) guestBay(b, wall, -width / 2 + (i + .5) * width / 6, 3.26, width / 6, 3.57, i + phase);
    wall.box('floor', 0, 3.12, .92, width, .25, 2.00);
    wall.box('cedar', 0, 2.88, 1.8, width, .34, .27);
  }
  gallery(b, back, 29.98, 7.90, 4.08, 4.1, 0, [[-14.4,-12.05],[8.10,14.4]]);
  gallery(b, wallFrame(b,-15.10,1.825,Math.PI/2), 19.65, 7.90, 3.25, 4.10, 3);
  gallery(b, wallFrame(b,15.10,.35,-Math.PI/2), 16.70, 7.90, 3.25, 4.10, 7);
  arrivalStair(b);
  for (let i = 0; i < 7; i++) {
    const xx = -12.85 + i * 4.28;
    guestBay(b, arrival, xx, 6.72, 4.28, 4.37, i + 3);
  }
  // Tier above the camera: continuous corniced walking gallery and translucent guest room screens.
  gallery(b, back, 29.98, 12.0, 3.31, 2.99, 2, [[-14.4,-12.0],[12.0,14.4]]);
  gallery(b, arrival, 29.98, 12.0, 2.23, 2.99, 7, [[-14.4,-12.0],[12.0,14.4]]);
  gallery(b, wallFrame(b,-15.10,1.62,Math.PI/2), 20.80, 12.0, 3.23, 2.99, 3);
  gallery(b, wallFrame(b,15.10,1.62,-Math.PI/2), 20.80, 12.0, 3.23, 2.99, 1);
  // Tall unbroken posts carry the upper floors. Shoulders and timber tusks seat the cross beams.
  for (const xx of [-12.18,12.18]) for (const zz of [-8.72,-3.65,3.65,10.68]) {
    b.box('redwood', xx, 7.45, zz, .46, 14.96, .50);
    b.box('stone', xx, .21, zz, .68, .47, .69);
    for (const yy of [7.29,11.43,14.5]) {
      b.box('cedar', xx, yy, zz, .64, .16, .60);
      b.box('walnut', xx, yy + .15, zz, .83, .14, .62);
      b.box('redwood', xx, yy + .30, zz, 1.07, .19, .67);
    }
  }
  clayFacing(b,back,left);
  teaPavilion(b);
  gabledReadingRoom(b);
  b.box('cedar', 0, 15.16, .91, 30.77, .35, 26.95);
  for (let zz = -10.6; zz < 14; zz += 3.78) {
    b.box('walnut', 0, 14.77, zz, 30.5, .46, .37);
    for (let xx = -13.8; xx < 15; xx += 1.85) b.box('hinoki', xx, 14.94, zz + 1.88, .076, .11, 3.6);
  }
  for (const xx of [-10.7,-4.45,4.45,10.7]) b.box('redwood', xx, 14.57, .87, .34, .34, 26.55);
}
