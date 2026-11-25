import * as T from 'three';
import { GeometryBatch, vec } from '../../shared/geometry';

const assetRoot = new URL('../assets/raohe/gate/', document.baseURI).href;
const front = 1;
const back = -1;

function finish(color: string, metalness: number, roughness: number, emission: string) {
  return new T.MeshStandardMaterial({ color, metalness, roughness, emissive: emission });
}

function facadePanel(
  batch: GeometryBatch, material: T.Material, rect: [number, number, number, number],
  width: number, height: number, x: number, y: number, z: number, face: number,
) {
  const plane = new T.PlaneGeometry(width, height);
  const uv = plane.attributes.uv;
  const [left, top, w, h] = rect;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (left + uv.getX(i) * w) / 1024, 1 - (top + (1 - uv.getY(i)) * h) / 512);
  }
  batch.add(plane, material, x, y, z, new T.Euler(0, face === front ? 0 : Math.PI, 0));
}

// A single contiguous folded sheet forms the main roof under the individual glazed rolls.
function roofSkin(
  width: number, depth: number, heightAt: (x: number, z: number) => number, centerX: number,
) {
  const geo = new T.PlaneGeometry(width, depth, Math.ceil(width * 8), 8);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setXYZ(i, centerX + x, heightAt(x, pos.getZ(i)), pos.getZ(i));
  }
  geo.computeVertexNormals();
  return geo;
}

function lanternSkin() {
  const g = new T.SphereGeometry(1, 96, 24);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const longitude = uv.getX(i) * Math.PI * 24;
    const bulge = 1 - .011 * ((1 + Math.cos(longitude)) * .5) ** 4;
    const taper = 1 + Math.abs(p.getY(i)) * .095;
    p.setXYZ(i, p.getX(i) * .385 * bulge * taper, p.getY(i) * .335, p.getZ(i) * .385 * bulge * taper);
  }
  g.computeVertexNormals();
  return g;
}

function bulbGlareTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,249,202,.92)');
  gradient.addColorStop(.12, 'rgba(255,213,136,.70)');
  gradient.addColorStop(.28, 'rgba(255,175,79,.27)');
  gradient.addColorStop(.58, 'rgba(246,115,39,.07)');
  gradient.addColorStop(1, 'rgba(240,96,25,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

/** Four-lantern gateway modelled around the illuminated faces in the supplied photograph. */
export function buildGate(scene: T.Scene) {
  const root = new T.Group();
  root.name = '饒河街觀光夜市牌樓';
  root.position.z = -9;
  root.scale.set(1.10, 1.135, 1);
  scene.add(root);

  const b = new GeometryBatch();
  const loader = new T.TextureLoader();
  const atlas = loader.load(assetRoot + 'panels.webp');
  const silk = loader.load(assetRoot + 'silk.webp');
  for (const map of [atlas, silk]) {
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 8;
  }
  const sign = new T.MeshBasicMaterial({ map: atlas, toneMapped: false });
  const lantern = new T.MeshBasicMaterial({ map: silk, toneMapped: false });
  const vermilion = finish('#9d301a', .31, .30, '#360d04');
  const oxblood = finish('#571f16', .33, .31, '#170401');
  const brass = finish('#b78241', .63, .26, '#4f2608');
  const edge = finish('#e4a951', .51, .22, '#844615');
  const tile = finish('#8d5728', .52, .26, '#301704');
  const rock = finish('#62564e', .06, .85, '#080504');
  const iron = finish('#33291f', .57, .48, '#0a0502');
  const ochre = finish('#c18532', .25, .56, '#4a2304');
  const cord = finish('#90280f', .04, .65, '#420d03');
  const patina = loader.load(assetRoot + 'patina.webp');
  const surface = loader.load(assetRoot + 'patina-surface.webp');
  patina.colorSpace = T.SRGBColorSpace;
  for (const t of [patina,surface]) {
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 4;
  }
  for (const material of [vermilion, oxblood, brass, edge, tile, rock, iron]) {
    material.map = patina;
    material.roughnessMap = surface;
    material.bumpMap = surface;
    material.bumpScale = material === rock ? .016 : .004;
  }
  const bulbs: T.Vector3[] = [];

  function bulbLine(a: T.Vector3, c: T.Vector3, spacing = .116, skipFirst = false) {
    const count = Math.max(1, Math.round(a.distanceTo(c) / spacing));
    for (let i = skipFirst ? 1 : 0; i <= count; i++) bulbs.push(a.clone().lerp(c, i / count));
  }
  function rectangularLights(cx: number, cy: number, z: number, w: number, h: number, spacing = .115) {
    const left = cx - w / 2, right = cx + w / 2, lo = cy - h / 2, hi = cy + h / 2;
    bulbLine(vec(left, lo, z), vec(right, lo, z), spacing);
    bulbLine(vec(left, hi, z), vec(right, hi, z), spacing);
    for (const x of [left, right]) {
      const count = Math.round(h / spacing);
      for (let i = 1; i < count; i++) bulbs.push(vec(x, lo + i * h / count, z));
    }
  }
  function molding(cx: number, cy: number, z: number, w: number, h: number, size: number, mat: T.Material) {
    for (const side of [-1, 1]) {
      b.box(w + size, size, .05, cx, cy + side * h / 2, z, mat);
      b.box(size, h, .05, cx + side * w / 2, cy, z, mat);
    }
  }
  function roof(cx: number, width: number, depth: number, base: number, rise: number) {
    const half = width / 2, dz = depth / 2;
    const lift = (x: number) => .13 * (Math.abs(x) / half) ** 7;
    const yAt = (x: number, z: number) =>
      base + lift(x) * (.55 + .45 * Math.abs(z) / dz) + rise * Math.max(0, 1 - Math.abs(z) / dz) ** 1.55;
    b.add(roofSkin(width, depth, yAt, cx), tile);
    // Soffit and support blocking are visible from below while walking under the eaves.
    b.box(width - .18, .115, depth - .11, cx, base - .071, 0, oxblood);
    const spans = Math.ceil(width / .45);
    for (const face of [front, back]) {
      const z = face * dz;
      for (let j = 0; j < spans; j++) {
        const l = -half + j * width / spans, r = -half + (j + 1) * width / spans;
        b.beam(vec(cx+l, yAt(l,z) - .035, z), vec(cx+r, yAt(r,z) - .035,z), .065, .105, brass);
        b.beam(vec(cx+l, yAt(l,z) - .089, z - face * .016), vec(cx+r, yAt(r,z) - .089,z - face * .016), .022, .105, edge);
      }
      const bulbCount = Math.round(width / .136);
      for (let j = 0; j <= bulbCount; j++) {
        const x = -half + j * width / bulbCount;
        bulbs.push(vec(cx+x, yAt(x,z) - .027,z + face * .068));
      }
      const tiles = Math.round(width / .139);
      for (let j = 0; j <= tiles; j++) {
        const x = -half + j * width / tiles;
        const points = [0,.18,.46,.74,1].map((t) => vec(cx+x, yAt(x,z*t) + .013,z*t));
        b.tube(points,.035,j % 4 === 0 ? brass : tile,6);
      }
    }
    for (let j = 0; j < spans; j++) {
      const x = cx - half + (j+.5) * width / spans;
      b.box(.088,.09,depth * .91,x,base - .142,0,brass);
    }
    b.box(width-.12,.095,.122,cx,base+rise+.04,0,brass);
    for (const s of [-1,1]) {
      const ex = cx+s*(half-.11);
      const points=[vec(ex-s*.14,base+rise+.06,0),vec(ex-s*.045,base+rise+.12,0),vec(ex,base+rise+.20,0),vec(ex+s*.012,base+rise+.27,0)];
      b.tube(points,.05,edge,10);
      bulbs.push(points[3]);
      for (const face of [front,back]) {
        const p = [vec(ex-s*.09,base+.08,face*dz),vec(ex+.035*s,base+.16,face*dz),vec(ex+s*.085,base+.225,face*dz)];
        b.tube(p,.038,edge,7);
        bulbs.push(p[2]);
      }
    }
  }

  for (const side of [-1, 1]) {
    const x = side * 3.59;
    b.box(.92,.22,.87,x,.11,0,rock,.024);
    b.box(.85,.35,.80,x,.38,0,rock,.018);
    b.box(.92,.085,.85,x,.58,0,brass,.015);
    b.box(.78,4.23,.64,x,2.69,0,vermilion,.022);
    b.box(.84,.15,.72,x,4.60,0,brass);
    for (const face of [front, back]) {
      const dir = face;
      const z = face * .332;
      molding(x,2.64,z,.681,3.81,.031,brass);
      b.box(.648,3.72,.018,x,2.64,z+dir*.004,oxblood);
      rectangularLights(x,2.64,z + dir * .054,.674,3.79,.135);
      // Pier face relief and long recessed lozenges continue below the awning height.
      for (const py of [1.49,2.65,3.78]) {
        const points = [vec(x,py+.27,z+dir*.031),vec(x+.12,py+.11,z+dir*.031),vec(x+.115,py-.05,z+dir*.031),vec(x,py-.27,z+dir*.031),vec(x-.115,py-.05,z+dir*.031),vec(x-.12,py+.11,z+dir*.031),vec(x,py+.27,z+dir*.031)];
        b.tube(points,.016,brass,24);
        b.sphere(.051,x,py,z+dir*.041,edge,vec(.8,1,.32));
      }
    }
    // The heraldic medallions are individually rectified from the two side lights.
    b.box(.99,1.03,.74,x,5.11,0,oxblood,.023);
    for (const face of [front, back]) {
      molding(x,5.11,.384*face,.945,.978,.07,brass);
      const panel: [number, number, number, number] = side === -1 ? [11,290,180,199] : [225,289,198,202];
      facadePanel(b,sign,panel,.80,.828,x,5.11,face*.405,face);
      rectangularLights(x,5.11,face*.434,.923,.956,.118);
    }
    roof(x,1.41,1.04,5.72,.31);
  }

  b.box(7.24,.17,.69,0,4.57,0,vermilion,.024);
  b.box(7.22,.059,.75,0,4.46,0,oxblood);
  b.box(6.44,1.17,.52,0,5.18,0,vermilion);
  for (const x of [-2.81,2.81]) {
    b.box(.52,1.20,.55,x,5.20,0,oxblood);
    for (const face of [front,back]) {
      facadePanel(b,sign,[445,289,76,202],.37,1.00,x,5.20,face*.282,face);
      molding(x,5.20,face*.30,.401,1.053,.024,brass);
    }
  }
  b.box(5.19,1.46,.76,0,5.30,0,oxblood,.023);
  for (const face of [front,back]) {
    const z = face*.39;
    molding(0,5.30,z,5.16,1.44,.057,brass);
    molding(0,5.30,z + face*.017,4.91,1.274,.034,edge);
    facadePanel(b,sign,[8,8,1008,266],4.862,1.239,0,5.30,z+.023*face,face);
    rectangularLights(0,5.30,z + face*.065,5.074,1.37,.115);
  }
  b.box(5.68,.16,.7,0,6.04,0,vermilion);
  roof(0,5.97,1.48,6.125,.39);
  // Four finial plinths crown the long central ridge.
  for (const [x,w,cy] of [[0,3.1,6.665],[-1.825,.55,6.79],[1.825,.55,6.79]]) {
    b.box(w,.087,.128,x,cy,0,brass);
    b.box(w,.027,.145,x,cy-.047,0,edge);
    for (const face of [front,back]) {
      bulbLine(vec(x-w/2+.05,cy+.041,face*.077),vec(x+w/2-.05,cy+.041,face*.077),.13);
    }
  }
  for (const x of [-2.10,-1.55,1.55,2.10]) {
    const y=6.75;
    b.box(.215,.34,.18,x,y,0,brass,.038);
    b.box(.25,.052,.21,x,y-.159,0,edge,.012);
    b.sphere(.111,x,y+.15,0,brass,vec(.93,.74,.66));
    for (const face of [front,back]) {
      const z=face*.105;
      bulbLine(vec(x-.109,y-.096,z),vec(x-.109,y+.116,z),.089);
      bulbLine(vec(x+.109,y-.096,z),vec(x+.109,y+.116,z),.089);
      bulbs.push(vec(x-.071,y+.190,z),vec(x+.071,y+.190,z),vec(x,y+.215,z));
    }
  }

  const shell = lanternSkin();
  for (const [index,x] of [-2.10,-.70,.70,2.10].entries()) {
    const y=4.015+(index%2)*.015;
    const z=.095;
    b.cylinder(.013,.013,4.47-y-.34,x,(4.47+y+.34)/2,z,iron,8);
    b.cylinder(.12,.105,.06,x,y+.328,z,brass,16);
    b.add(shell.clone(),lantern,x,y,z,new T.Euler(0,index*.24,0));
    b.cylinder(.087,.107,.054,x,y-.33,z,brass,16);
    b.cylinder(.075,.083,.14,x,y-.415,z,ochre,18);
    // Individually tapered silk tassels create a fine uneven fringe up close.
    for (let j=0;j<14;j++) {
      const a=j/14*Math.PI*2;
      b.cylinder(.0065,.002,.086+(j%3)*.009,x+Math.cos(a)*.07,y-.473,z+Math.sin(a)*.07,ochre,5);
    }
    b.cylinder(.014,.007,.10,x,y-.51,z,cord,10);
  }
  shell.dispose();
  b.flush(root);
  root.traverse(obj => {
    if (obj instanceof T.Mesh && (obj.material === sign || obj.material === lantern)) obj.castShadow = false;
  });

  const glass = new T.MeshBasicMaterial({ color: new T.Color(3.2,1.89,.68) });
  const lamps = new T.InstancedMesh(new T.IcosahedronGeometry(.023),glass,bulbs.length);
  const matrix = new T.Matrix4();
  bulbs.forEach((p,i) => lamps.setMatrixAt(i,matrix.makeTranslation(p.x,p.y,p.z)));
  lamps.name = 'Incandescent marquee bulbs';
  root.add(lamps);
  const glowGeometry = new T.BufferGeometry().setFromPoints(bulbs);
  const glowMaterial = new T.PointsMaterial({
    size:.21, map:bulbGlareTexture(), transparent:true, opacity:1,
    blending:T.AdditiveBlending, depthWrite:false, toneMapped:false,
  });
  const glow = new T.Points(glowGeometry, glowMaterial);
  glow.renderOrder=2;
  root.add(glow);
}
