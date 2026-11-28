import * as THREE from 'three';
import { GeometryBatch, seededRandom, vec } from '../../shared/geometry';
import { metricUV } from '../../shared/procedural';
import { assetUrl } from '../../shared/assets';

export const bridgeStart = new THREE.Vector3(-5,27,-90);
export const bridgeEnd = new THREE.Vector3(26,27,-75);

function surfaceTexture(kind: 'steel' | 'masonry' | 'sleeper') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(kind === 'steel' ? 742 : kind === 'masonry' ? 423 : 231);
  const image = ctx.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 213 + rand() * 39;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  for (let i = 0; i < 950; i++) {
    const x = rand() * 256, y = rand() * 256;
    ctx.fillStyle = kind === 'steel' ? 'rgba(78,38,24,0.17)' : 'rgba(38,37,30,0.24)';
    const w = rand() * (kind === 'sleeper' ? 18 : 2.1) + .4;
    const h = kind === 'sleeper' ? .6 : 1 + Math.pow(rand(), 4) * 19;
    ctx.fillRect(x, y, w, h);
  }
  if (kind === 'masonry') {
    for (let row = 0; row < 8; row++) {
      for (let col = -1; col < 5; col++) {
        const x = col * 64 + row % 2 * 32, y = row * 32;
        ctx.fillStyle = 'rgba(15,25,21,' + (rand() * .135) + ')';
        ctx.fillRect(x, y, 64, 32);
        ctx.fillStyle = 'rgba(35,37,32,.57)';
        ctx.fillRect(x, y + 31, 64, 1.4);
        ctx.fillRect(x, y, 1, 32);
        ctx.fillStyle = 'rgba(255,251,231,.31)';
        ctx.fillRect(x + 1, y + 1, 63, 1.1);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function bridgeMaterials() {
  const steel = surfaceTexture('steel');
  const masonry = surfaceTexture('masonry');
  const sleeper = surfaceTexture('sleeper');
  const loader = new THREE.TextureLoader();
  const concrete = loader.load(assetUrl('shared','concrete-color.jpg'));
  concrete.colorSpace = THREE.SRGBColorSpace;
  concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping;
  concrete.anisotropy = 4;
  const paint = (color: number) => new THREE.MeshStandardMaterial({
    color, map: steel, metalness: .22, roughness: .76,
  });
  return {
    steel: paint(0xa45451),
    face: paint(0xb65e59),
    dark: paint(0x783c37),
    railing: paint(0xa36a60),
    rail: new THREE.MeshStandardMaterial({ color: 0x706c63, roughness: .41, metalness: .69 }),
    block: new THREE.MeshStandardMaterial({ color: 0x918e81, map: masonry, roughness: 1, bumpMap: masonry, bumpScale: .085 }),
    coping: new THREE.MeshStandardMaterial({ color: 0xd1cbbb, map: concrete, roughness: .96 }),
    lining: new THREE.MeshStandardMaterial({ color: 0x554f48, map: masonry, roughness: 1, side: THREE.DoubleSide }),
    gloom: new THREE.MeshBasicMaterial({ color: 0x121610 }),
    sleeper: new THREE.MeshStandardMaterial({ color: 0x514033, roughness: .97, map: sleeper }),
  };
}
type Materials = ReturnType<typeof bridgeMaterials>;

function walkway(b: GeometryBatch, m: Materials, start: number, end: number, deck: number, detailed = true) {
  const length = end - start, middle = (start + end) / 2;
  for (const side of [-1, 1]) {
    // Plate girder with separate top and bottom flanges. Height is below rail level.
    const z = side * 1.45;
    b.box(length, .70, .13, middle, deck - .65, z, m.steel);
    for (const y of [deck - 1, deck - .30]) b.box(length, .095, .36, middle, y, z, m.face);
    b.box(length, .10, .17, middle, deck + .03, side * .42, m.rail);
    b.box(length, .09, .075, middle, deck + .115, side * .42, m.rail);
    for (const height of [.52, 1.08]) b.box(length, .065, .075, middle, deck + height, side * 1.85, m.railing);
    const panels = Math.ceil(length / 2.15);
    for (let i = 0; i <= panels; i++) {
      const x = start + i * length / panels;
      b.box(.075, 1.37, .08, x, deck + .43, side * 1.85, m.railing);
      b.box(.105, .62, .20, x, deck - .63, z, m.face);
    }
  }
  b.box(length, .12, .52, middle, deck - .08, 1.54, m.sleeper);
  b.box(length, .12, .35, middle, deck - .08, -1.54, m.sleeper);
  for (let x = start + .20; x < end; x += detailed ? .65 : .9) {
    b.box(.19, .16, 3.33, x, deck - .12, 0, m.sleeper);
  }
}

function bearing(b: GeometryBatch, m: Materials, x: number, y: number, z: number) {
  b.box(1.34, .18, .96, x, y, z, m.dark);
  b.cylinder(.26, .26, .74, x, y+.22, z, m.rail, 12, new THREE.Euler(Math.PI/2,0,0));
  b.box(1.08, .16, .87, x, y+.49, z, m.steel);
}

function arch(b: GeometryBatch, m: Materials, length: number, deck: number) {
  const inset = 1.65, span = length - inset * 2, panels = 10;
  const yAt = (t: number) => deck - 2.4 - 8.45 * (2*t - 1)**2;
  const xAt = (t: number) => inset + t * span;
  for (const side of [-1, 1]) {
    const z = side * 1.48;
    const at = (t: number, yOffset = 0) => vec(xAt(t), yAt(t) + yOffset, z);
    for (let i = 0; i < panels; i++) {
      const t = i / panels, next = (i + 1) / panels;
      // The two arch chords enclose a laced web. Spandrel braces share pinned joints.
      for (const vertical of [-.39, .39]) {
        b.beam(at(t,vertical), at(next,vertical), .21, .41, m.face);
      }
      for (let j = 0; j < 4; j++) {
        const q = (i + j / 4) / panels, r = (i + (j + 1) / 4) / panels;
        b.beam(at(q, j % 2 ? .31 : -.31), at(r, j % 2 ? -.31 : .31), .10, .15, m.steel);
      }
      const top = vec(xAt(t), deck - .91, z);
      b.beam(at(t,.25), top, .23, .26, m.steel);
      const farHalf = i < panels/2;
      b.beam(farHalf ? at(t, .32) : at(next,.32),
        vec(xAt(farHalf ? next : t), deck - .87, z), .21, .26, m.face);
      b.box(.62,.61,.39,top.x,top.y-.20,z,m.steel);
      b.box(.56,.77,.51,xAt(t),yAt(t),z,m.steel);
      for (const offset of [-.18,.18]) {
        for (const level of [-.23,.23]) {
          b.cylinder(.053,.062,.036,xAt(t)+offset,yAt(t)+level,z+side*.262,m.dark,6,new THREE.Euler(Math.PI/2,0,0));
          b.cylinder(.052,.062,.036,top.x+offset,top.y-.2+level,z+side*.199,m.dark,6,new THREE.Euler(Math.PI/2,0,0));
        }
      }
      if (side === 1) {
        b.beam(vec(xAt(t),deck-.79,-1.5), top, .23,.24,m.dark);
        b.beam(vec(xAt(t),deck-.92,-1.4), vec(xAt(next),deck-.92,1.4),.115,.15,m.dark);
        b.beam(vec(xAt(t),yAt(t),-1.47), at(t),.23,.24,m.dark);
        b.beam(vec(xAt(t),yAt(t),-1.47), at(next),.14,.14,m.dark);
      }
    }
    b.beam(at(1,.3), vec(xAt(1),deck-.85,z),.31,.33,m.steel);
  }
  for (const x of [inset,length-inset]) {
    const spring = yAt(0) - .7;
    b.box(2.45,1.9,4.6,x,spring-.95,0,m.block);
    b.box(2.55,.34,4.75,x,spring-.14,0,m.coping);
    for (const s of [-1,1]) bearing(b,m,x,spring+.12,s*1.48);
  }
}

// All portals are open at rail height. A vaulted lining recedes to an unlit back wall.
function portal(b: GeometryBatch, m: Materials, faceX: number, deck: number, direction: -1 | 1) {
  b.at(faceX,0,direction === -1 ? 0 : Math.PI,()=>{
    const radius = 1.83, spring = 2.23, wallTop = 5.00, half = 3.10;
    const tunnelLength = direction === 1 ? 6.4 : 14;
    const face = new THREE.Shape();
    face.moveTo(-half, -.42);
    face.lineTo(-radius, -.42); face.lineTo(-radius,spring);
    face.absarc(0,spring,radius,Math.PI,0,true);
    face.lineTo(radius,-.42); face.lineTo(half,-.42);
    face.lineTo(half,wallTop); face.lineTo(-half,wallTop); face.closePath();
    // Shape XY uses X across the portal. Extrusion becomes local longitudinal X.
    const geometry = new THREE.ExtrudeGeometry(face,{ depth: 1.45, bevelEnabled: false, curveSegments: 28 });
    geometry.rotateY(Math.PI/2);
    b.add(metricUV(geometry,3.2),m.block,-1.45,0,0);
    b.box(1.68,.24,half*2+.34,-.64,wallTop+.015,0,m.coping);
    b.box(.44,.25,half*2+.16,.07,wallTop-.43,0,m.coping);
    for (const side of [-1,1]) {
      b.box(1.7,spring,.43,-.72,spring/2,side*(radius+.19),m.coping);
      b.box(1.84,.19,.60,-.67,spring-.02,side*(radius+.19),m.coping);
      b.box(tunnelLength,spring+.26,.26,-tunnelLength/2,spring*.5-.12,side*(radius+.01),m.lining);
      b.box(5,1.7,.72,1.9,.52,side*(half-.33),m.block);
      b.box(5.16,.15,.88,1.9,1.42,side*(half-.33),m.coping);
    }
    for (let i = 0; i < 19; i++) {
      const a = Math.PI*i/19+.004, d=Math.PI*(i+1)/19-.004;
      const stone = new THREE.Shape();
      stone.absarc(0,spring,radius+.40,a,d,false);
      stone.absarc(0,spring,radius,d,a,true);
      stone.closePath();
      const g = new THREE.ExtrudeGeometry(stone,{depth:.28,bevelEnabled:false,curveSegments:5});
      g.rotateY(Math.PI/2); b.add(metricUV(g,2),m.coping,-.13,0,0);
    }
    const vault = new THREE.CylinderGeometry(radius,radius,tunnelLength,30,1,true,-Math.PI/2,Math.PI);
    vault.rotateZ(Math.PI/2); vault.rotateX(-Math.PI/2);
    b.add(vault,m.lining,-tunnelLength/2,spring,0);
    b.box(.12,wallTop,half*1.65,-tunnelLength,wallTop/2-.1,0,m.gloom);
    b.box(tunnelLength,.2,radius*2,-tunnelLength/2,-.2,0,m.sleeper);
  },deck);
}

function trestle(b: GeometryBatch, m: Materials, start: number, end: number, y: number, depth: number) {
  walkway(b,m,start,end,y,false);
  const count = Math.max(2,Math.ceil((end-start)/9));
  for (let i=0;i<=count;i++) {
    const x=start+(end-start)*i/count;
    if(i===0 || i===count) {
      b.box(2.1,2.7,4.15,x,y-2.52,0,m.block);
      b.box(2.24,.31,4.32,x,y-1.27,0,m.coping);
      continue;
    }
    for(const side of [-1,1]) {
      const top=vec(x,y-.84,side*1.45),foot=vec(x,y-depth,side*2.02);
      b.beam(foot,top,.40,.45,m.steel);
      b.beam(vec(x,y-depth,-side*2.02),top,.21,.22,m.dark);
      b.box(1.32,3.2,1.34,foot.x,foot.y-1.49,foot.z,m.block);
      const next=start+(end-start)*(i+1)/count;
      b.beam(foot,vec(next,y-.89,side*1.44),.25,.29,m.face);
    }
  }
}

export function buildBridges(scene: THREE.Scene): void {
  const b = new GeometryBatch(), materials = bridgeMaterials();
  const dx = bridgeEnd.x - bridgeStart.x, dz = bridgeEnd.z - bridgeStart.z;
  const length = Math.hypot(dx,dz), angle = -Math.atan2(dz,dx), deck = bridgeStart.y;
  b.at(bridgeStart.x,bridgeStart.z,angle,()=>{
    walkway(b,materials,-8.5,length+6,deck);
    arch(b,materials,length,deck);
    // The arch springs directly from stone ledges. Only the bearing course is exposed.
    for (const x of [-.72,length+.72]) {
      b.box(2.3,2.05,4.15,x,deck-2.15,0,materials.block);
      b.box(2.4,.28,4.35,x,deck-1.23,0,materials.coping);
    }
    portal(b,materials,-7,deck,-1);
  });
  const approachLength = Math.hypot(30,3);
  b.at(-50,-97,-Math.atan2(3,30),()=>{
    trestle(b,materials,0,approachLength,26.4,7.1);
  });
  b.at(65,-129,Math.atan2(8,30),()=>{
    trestle(b,materials,0,Math.hypot(30,8),40,9.2);
  });
  const group = new THREE.Group();
  group.name = 'Riveted gorge arch and approach viaducts';
  b.flush(group);
  scene.add(group);
}
