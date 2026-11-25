import * as T from 'three';
import { seededRandom } from '../../shared/geometry';

type Ink = T.ColorRepresentation;
type Instance = { matrix: T.Matrix4; tint: T.Color };
type Surface = { xyz: number[]; uv: number[]; index: number[] };
type RectUV = [number, number, number, number];
const WHITE = 0xffffff;
const unitBox = new T.BoxGeometry();
const unitPipe = new T.CylinderGeometry(1, 1, 1, 10);
const axisY = new T.Vector3(0, 1, 0);

function photo(path: string, repeat = false) {
  const map = new T.TextureLoader().load(new URL('../assets/' + path, document.baseURI).href);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  if (repeat) map.wrapS = map.wrapT = T.RepeatWrapping;
  return map;
}

function atlas(index: number, cols: number, rows: number): RectUV {
  const column = index % cols;
  const row = Math.floor(index / cols);
  return [(column + .007) / cols, 1 - (row + .993) / rows,
    (column + .993) / cols, 1 - (row + .007) / rows];
}

// Structural profiles repeat across the entire street. Preserve their modeled depth while
// submitting each material/shape combination only once to WebGL.
class StreetBatch {
  private frame = new T.Matrix4();
  private solids = new Map<T.Material, Map<T.BufferGeometry, Instance[]>>();
  private faces = new Map<T.Material, Surface>();

  at(x: number, z: number, heading: number, build: () => void) {
    const original = this.frame;
    this.frame = original.clone().multiply(new T.Matrix4().makeTranslation(x, 0, z))
      .multiply(new T.Matrix4().makeRotationY(heading));
    build();
    this.frame = original;
  }

  private put(g: T.BufferGeometry, m: T.Material, tint: Ink, p: T.Vector3, scale: T.Vector3, q: T.Quaternion) {
    let shapes = this.solids.get(m);
    if (!shapes) this.solids.set(m, shapes = new Map());
    let instances = shapes.get(g);
    if (!instances) shapes.set(g, instances = []);
    instances.push({ matrix: new T.Matrix4().compose(p, q, scale).premultiply(this.frame), tint: new T.Color(tint) });
  }

  box(x: number, y: number, z: number, w: number, h: number, d: number, mat: T.Material, tint: Ink = WHITE, tilt = 0) {
    this.put(unitBox, mat, tint, new T.Vector3(x, y, z), new T.Vector3(w, h, d),
      new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), tilt));
  }

  cylinder(x: number, y: number, z: number, radius: number, h: number, mat: T.Material, tint: Ink = WHITE) {
    this.put(unitPipe, mat, tint, new T.Vector3(x, y, z), new T.Vector3(radius, h, radius), new T.Quaternion());
  }

  line(a: T.Vector3, b: T.Vector3, radius: number, m: T.Material, tint: Ink = WHITE) {
    const difference = b.clone().sub(a);
    const length = difference.length();
    const q = new T.Quaternion().setFromUnitVectors(axisY, difference.multiplyScalar(1 / length));
    this.put(unitPipe, m, tint, b.clone().lerp(a, .5), new T.Vector3(radius, length, radius), q);
  }

  rect(x: number, y: number, z: number, w: number, h: number, mat: T.Material, uv: RectUV = [0, 0, 1, 1], turn = 0) {
    let surface = this.faces.get(mat);
    if (!surface) this.faces.set(mat, surface = { xyz: [], index: [], uv: [] });
    const start = surface.xyz.length / 3;
    const rotate = new T.Matrix4().makeRotationY(turn).setPosition(x, y, z).premultiply(this.frame);
    for (const [px, py] of [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]) {
      const p = new T.Vector3(px, py, 0).applyMatrix4(rotate);
      surface.xyz.push(p.x, p.y, p.z);
    }
    const [u0, v0, u1, v1] = uv;
    surface.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    surface.index.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }

  roof(x: number, y: number, z: number, w: number, d: number, mat: T.Material) {
    let surface = this.faces.get(mat);
    if (!surface) this.faces.set(mat, surface = { xyz: [], index: [], uv: [] });
    const start = surface.xyz.length / 3;
    for (const [dx,dz] of [[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5]]) {
      const p = new T.Vector3(x + dx * w,y,z + dz * d).applyMatrix4(this.frame);
      surface.xyz.push(p.x,p.y,p.z);
      surface.uv.push(p.x / 3.8,p.z / 3.8);
    }
    surface.index.push(start,start + 1,start + 2,start,start + 2,start + 3);
  }

  finish(group: T.Object3D) {
    for (const [mat, shapes] of this.solids) {
      for (const [geometry, values] of shapes) {
        const mesh = new T.InstancedMesh(geometry, mat, values.length);
        values.forEach((item, index) => {
          mesh.setMatrixAt(index, item.matrix);
          mesh.setColorAt(index, item.tint);
        });
        mesh.computeBoundingSphere();
        group.add(mesh);
      }
    }
    for (const [mat, surface] of this.faces) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(surface.xyz, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(surface.uv, 2));
      g.setIndex(surface.index);
      g.computeVertexNormals();
      group.add(new T.Mesh(g, mat));
    }
  }
}

function streetMaterials() {
  const ceramic = photo('raohe/city/ceramic.jpg', true);
  const rooms = photo('kowloon/rooms.jpg');
  const office = photo('neo-taipei/facade.jpg', true);
  const signprint = photo('raohe/city/lightboxes.jpg');
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 96;
  const ctx = haloCanvas.getContext('2d')!;
  const fade = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
  fade.addColorStop(0, '#ffffff');
  fade.addColorStop(.35, 'rgba(255,255,255,.45)');
  fade.addColorStop(.7, 'rgba(255,255,255,.10)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 96, 96);
  const glowMap = new T.CanvasTexture(haloCanvas);
  const tile = (color: Ink) => new T.MeshStandardMaterial({
    map: ceramic, color, roughness: .59, metalness: .05,
    emissiveMap: ceramic, emissive: color, emissiveIntensity: .06
  });
  return {
    concrete: new T.MeshStandardMaterial({ roughness: .91 }),
    metal: new T.MeshStandardMaterial({ roughness: .49, metalness: .48 }),
    darkMetal: new T.MeshStandardMaterial({ roughness: .67, metalness: .25 }),
    tiles: [tile('#c2b4a6'), tile('#b6a89c'), tile('#839891'), tile('#98989b')],
    roof: new T.MeshStandardMaterial({ map: photo('shared/concrete-color.jpg',true), color: '#a1a5a2', roughness: .69, metalness: .045 }),
    rooms: new T.MeshBasicMaterial({ map: rooms, color: '#aa9073' }),
    shopInterior: new T.MeshBasicMaterial({ map: rooms, color: new T.Color(1.55, 1.34, 1.09), fog: false }),
    photoBays: new T.MeshBasicMaterial({ map: photo('raohe/city/service-bays.jpg'), color: '#efdfcd' }),
    darkRooms: new T.MeshBasicMaterial({ map: rooms, color: '#424a58' }),
    distantWindow: new T.MeshBasicMaterial({ map: rooms, color: '#ab947b', fog: false }),
    office: new T.MeshBasicMaterial({ map: office, color: '#677384' }),
    fan: new T.MeshStandardMaterial({ map: photo('raohe/city/condenser.jpg'), roughness: .71 }),
    outerUnit: new T.MeshStandardMaterial({ map: photo('raohe/city/outer-unit.jpg'), roughness: .77, color: '#d3cdc0' }),
    runoff: new T.MeshBasicMaterial({ map: photo('raohe/city/runoff.webp'), transparent: true, depthWrite: false }),
    lightboxes: new T.MeshBasicMaterial({ map: signprint, color: new T.Color(1.48, 1.43, 1.35) }),
    shopSigns: new T.MeshBasicMaterial({ map: photo('raohe/city/shop-signs.jpg'), color: new T.Color(1.75, 1.60, 1.55) }),
    glows: ['#ee3f69','#71baec','#b33bfc','#f3b04a','#58d59b'].map(color => new T.MeshBasicMaterial({
      color, map: glowMap, transparent: true, opacity: .28, depthWrite: false, blending: T.AdditiveBlending
    })),
    bareLight: new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.4, 1.1) }),
    skyline: new T.MeshBasicMaterial({ fog: false }),
    towerOffice: new T.MeshBasicMaterial({ map: office, color: '#7ca3bb', fog: false }),
    towerLight: new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.6, 1.6), fog: false })
  };
}
type M = ReturnType<typeof streetMaterials>;

function aircon(b: StreetBatch, m: M, x: number, y: number, z: number, id: number) {
  const casing = ['#928f85', '#978c81', '#75766e'][id % 3];
  b.box(x, y, z + .22, .94, .61, .44, m.metal, casing);
  const fanX = x - .10;
  if (id % 3) b.rect(fanX, y, z + .446, .57, .55, m.fan);
  else b.rect(x, y, z + .446, .91, .59, m.outerUnit);
  for (const end of [-1, 1]) {
    for (let row = 0; row < 4; row++) b.box(x + end * .472, y - .17 + row * .11, z + .23, .009, .045, .24, m.darkMetal, '#373633');
  }
  b.line(new T.Vector3(x + .45, y + .17, z + .16), new T.Vector3(x + .57, y + .13, z + .10), .038, m.metal, '#aba58d');
  b.line(new T.Vector3(x + .57, y + .13, z + .10), new T.Vector3(x + .6, y - .49, z + .04), .038, m.metal, '#958b74');
  for (let i = 0; i < 5; i++) b.box(x + .29 + i * .025, y, z + .448, .012, .37, .012, m.darkMetal, '#525552');
  for (const dx of [-.34, .34]) {
    b.box(x + dx, y - .335, z + .22, .06, .055, .57, m.darkMetal, '#4d443c');
    b.line(new T.Vector3(x + dx, y - .59, z + .02), new T.Vector3(x + dx, y - .35, z + .43), .019, m.darkMetal, '#5b4a40');
  }
}

function apartment(b: StreetBatch, m: M, width: number, floors: number, seed: number, right: boolean) {
  const rand = seededRandom(seed);
  const depth = 4.8 + rand() * 1.7;
  const floorH = 2.55 + rand() * .28;
  const shopH = 2.99;
  const height = shopH + floors * floorH;
  const facade = m.tiles[seed % m.tiles.length];
  const bayCount = Math.max(2, Math.round(width / 2.7));
  const bay = width / bayCount;
  const wallTint = ['#74695d', '#6a6b66', '#766e68', '#717775'][seed % 4];
  const steelTint = ['#342e2b', '#474440', '#393d3d'][seed % 3];

  b.box(0, height / 2, -depth / 2 - .25, width, height, depth, m.concrete, wallTint);
  b.roof(0,height + .012,-depth / 2 - .25,width,depth,m.roof);
  // Dimensional spandrels, columns and sills leave the rooms inset behind the ceramic skin.
  const tiledFace = (x: number, y: number, w: number, h: number) => {
    b.rect(x, y, -.015, w, h, facade, [(x - w / 2) / 1.9, (y - h / 2) / 1.75, (x + w / 2) / 1.9, (y + h / 2) / 1.75]);
  };
  b.box(0, shopH - .04, .10, width + .08, .22, .45, m.concrete, '#767169');
  b.box(0, height + .12, -.35, width + .18, .23, .94, m.concrete, '#6c6b66');
  for (const edge of [-1, 1]) {
    b.rect(edge * (width / 2 + .007), height / 2, -depth / 2 - .25, depth, height, facade, [0, 0, depth / 2, height / 1.8], edge * Math.PI / 2);
  }

  for (let j = 0; j < bayCount; j++) {
    const center = (j + .5) * bay - width / 2;
    b.box(center, 1.34, -.11, bay - .16, 2.67, .13, m.darkMetal, '#4a4840');
    for (let l = 0; l < 21; l++) b.box(center, .14 + l * .116, -.033, bay - .2, .021, .025, m.metal, l % 2 ? '#757168' : '#514c45');
    b.box(center - bay / 2 + .055, 1.45, .025, .12, 2.9, .27, m.concrete, '#837970');

    for (let floor = 0; floor < floors; floor++) {
      const fy = shopH + floor * floorH;
      const ww = bay * (.69 + .07 * rand());
      const wh = floorH * (.48 + .16 * rand());
      const bottom = .69 + .17 * rand();
      const wy = fy + bottom + wh / 2;
      const side = (bay - ww) / 2;
      tiledFace(center, fy + bottom / 2, bay, bottom);
      tiledFace(center, fy + (bottom + wh + floorH) / 2, bay, floorH - bottom - wh);
      for (const sign of [-1, 1]) {
        tiledFace(center + sign * (ww + side) / 2, wy, side, wh);
        b.box(center + sign * ww / 2, wy, -.10, .055, wh + .09, .29, m.darkMetal, steelTint);
      }
      const id = seed + floor * 7 + j;
      const bright = rand() > .54;
      if (id % 4 === 1 || id % 13 === 0) {
        b.rect(center, wy, -.18, ww + .025, wh + .03, m.photoBays, atlas(id % 13 === 0 ? 3 : 1, 2, 2));
      } else {
        b.rect(center, wy, -.18, ww + .025, wh + .03, bright ? m.rooms : m.darkRooms, atlas(id % 16, 4, 4));
      }
      for (const dy of [-.5, .5]) b.box(center, wy + dy * wh, -.029, ww + .10, .055, .18, m.metal, steelTint);
      b.box(center, wy, -.002, .048, wh, .085, m.metal, steelTint);
      b.box(center, fy + bottom - .05, .065, ww + .19, .10, .29, m.concrete, wallTint);
      b.rect(center, fy + bottom / 2 - .05, .001, ww + .20, bottom, m.runoff);
      if ((j === 0 && floor === 0) || id % 9 === 1) {
        b.rect(center - bay * .04, fy + bottom / 2, .02, bay * .84, bottom * .96, m.photoBays, atlas(0,2,2));
        b.box(center, fy + .04, .11, bay * .9, .045, .3, m.metal, '#4c514a');
      }
      if (id % 4 !== 0) {
        const grill = id % 5 === 0 ? .43 : .17;
        for (let k = 0; k < 7; k++) b.box(center + ww * (k / 6 - .5), wy, grill, .019, wh + .13, .025, m.metal, steelTint);
        for (const level of [-.46, .12, .46]) b.box(center, wy + wh * level, grill, ww + .08, .025, .026, m.metal, steelTint);
        if (grill > .3) b.box(center, wy - wh / 2 - .09, .17, ww + .21, .11, .66, m.concrete, wallTint);
      }
      if (id % 6 === 0) {
        const awning = ['#586560', '#66544a', '#596166'][id % 3];
        b.box(center, wy + wh / 2 + .13, .35, ww + .38, .06, .90, m.metal, awning, .12);
        for (const dx of [-.42, .42]) {
          b.line(new T.Vector3(center + dx * ww, wy + wh / 2 - .31, .03), new T.Vector3(center + dx * ww, wy + wh / 2 + .06, .69), .021, m.metal, '#534e45');
        }
      }
      if (id % 3 === 0 || (floor === 0 && id % 2 === 0)) aircon(b, m, center + bay * .23, fy + .41, .09, id);
    }
  }
  for (const x of [-width * .47, width * .47]) {
    b.cylinder(x, height / 2, .13, .052, height, m.metal, seed % 3 === 0 ? '#745a4e' : '#595852');
    for (let y = 1; y < height; y += 2) b.cylinder(x, y, .13, .065, .07, m.metal, '#494543');
  }
  if (seed % 3 !== 2) {
    const sx = width * .43;
    b.box(sx, (shopH + height) / 2, .12, .72, height - shopH, .42, m.darkMetal, '#393737');
    b.rect(sx, (shopH + height) / 2, .333, .7, height - shopH, m.photoBays, atlas(2,2,2));
    for (const dx of [-.30,.29]) b.cylinder(sx + dx, (shopH + height) / 2, .37, .028, height - shopH, m.darkMetal, '#4e4340');
    for (let y = shopH; y < height; y += .86) b.box(sx, y, .38, .72, .036, .095, m.darkMetal, '#484441');
  }
  if (!right || seed % 3 === 0) {
    b.box(-width * .17, height + .65, -depth * .57, width * .55, 1.3, 2.4, m.concrete, '#625e57');
    b.box(-width * .17, height + 1.37, -depth * .57, width * .60, .12, 2.68, m.darkMetal, '#514a40', -.045);
    if (seed % 2) {
      b.cylinder(width * .25, height + .83, -depth * .44, .53, 1.27, m.metal, '#8f8d83');
      for (const dy of [.32, .84, 1.35]) b.cylinder(width * .25, height + dy, -depth * .44, .55, .055, m.metal, '#575e5c');
    }
  }
}

function blade(b: StreetBatch, m: M, wallX: number, z: number, sign: number, base: number, h: number) {
  const side = Math.sign(wallX);
  const w = h * .34;
  const x = wallX - side * (1.1 + w * .54);
  const y = base + h / 2;
  for (const mount of [base + .15, base + h - .18]) {
    b.box((wallX + x) / 2, mount, z, Math.abs(wallX - x), .065, .075, m.darkMetal, '#302c27');
    b.line(new T.Vector3(wallX, mount + .35, z), new T.Vector3(x, mount, z), .027, m.metal, '#4c4740');
  }
  b.box(x, y, z, w + .085, h + .09, .22, m.metal, '#655a52');
  b.rect(x, y, z + .112, w, h, m.lightboxes, atlas(sign, 6, 2));
  b.rect(x, y, z - .112, w, h, m.lightboxes, atlas(sign, 6, 2), Math.PI);
  const glow = m.glows[[0, 3, 2, 3, 4, 1, 0, 1, 4, 3, 4, 2][sign]];
  b.rect(x, y, z + .116, w * 2.15, h * 1.32, glow);
  b.rect(x, y, z - .116, w * 2.15, h * 1.32, glow, [0,0,1,1], Math.PI);
}

function projectingPanel(b: StreetBatch, m: M, side: number, z: number, y: number, index: number, w: number) {
  const x = side * (3.86 + .14 * (index % 3));
  const h = w * (index % 3 === 2 ? 1.24 : .89);
  b.box((side * 6.2 + x) / 2, y - h * .37, z, 6.2 - Math.abs(x), .075, .07, m.metal, '#474b48');
  b.box(x, y, z, w + .065, h + .065, .18, m.metal, '#556062');
  for (const face of [-1, 1]) {
    const r = face === 1 ? 0 : Math.PI;
    b.rect(x, y, z + face * .092, w, h, m.shopSigns, atlas(index,4,2), r);
    b.rect(x, y, z + face * .095, w * 1.64, h * 1.57, m.glows[[1,0,1,3,2,3,4,2][index]], [0,0,1,1], r);
  }
}

function cable(b: StreetBatch, m: M, a: T.Vector3, end: T.Vector3, sag: number, radius: number) {
  let prior = a;
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const p = a.clone().lerp(end, t);
    p.y -= 4 * t * (1 - t) * sag;
    b.line(prior, p, radius, m.darkMetal, '#201d20');
    prior = p;
  }
}

function streetLamp(b: StreetBatch, m: M, x: number, z: number, side: number, height: number) {
  b.cylinder(x, height * .49, z, .065, height, m.metal, '#63615a');
  let last = new T.Vector3(x, height * .96, z);
  for (let k = 1; k <= 7; k++) {
    const t = k / 7;
    const p = new T.Vector3(x - side * 1.27 * t, height * .96 + .65 * Math.sin(t * Math.PI * .54), z);
    b.line(last, p, .034, m.metal, '#817669');
    last = p;
  }
  b.box(last.x - side * .18, last.y - .025, z, .60, .14, .25, m.metal, '#65645d');
  b.box(last.x - side * .18, last.y - .103, z, .47, .022, .16, m.bareLight, '#f4c477');
}

function distantBuildings(b: StreetBatch, m: M) {
  const rand = seededRandom(82822);
  // Rows beyond both cross streets close the vanishing point and remain coherent when turning around.
  for (const [end, direction] of [[-119, 1], [44, -1]]) {
    for (let i = -5; i < 6; i++) {
      const x = i * 6.5 + rand();
      const z = end - direction * rand() * 7;
      const h = 9 + rand() * 15;
      const width = 5.75 + rand();
      b.box(x, h / 2, z - direction * 3.2, width, h, 6.25, m.concrete, '#44494b');
      b.rect(x, h / 2, z, width - .14, h - .2, m.office, [0, 0, .42 + rand() * .3, h / 24], direction > 0 ? 0 : Math.PI);
      b.roof(x,h + .009,z - direction * 3.2,width,6.25,m.roof);
      for (const side of [-1,1]) b.rect(x + side * (width / 2 + .013),h / 2,z - direction * 3.2,
        6.20,h - .14,m.office,[.28,0,.60,h / 22],side * Math.PI / 2);
      for (let floor = 1; floor * 2.45 < h - .8; floor++) {
        for (let bay = 0; bay < 3; bay++) {
          if (rand() > .41) continue;
          const wx = x + width * .28 * (bay - 1);
          const wy = floor * 2.45 + .39;
          b.rect(wx, wy, z + .013 * direction, width * .17, .9, m.distantWindow,
            atlas(Math.floor(rand() * 16),4,4), direction > 0 ? 0 : Math.PI);
          b.box(wx, wy, z + .04 * direction, .047, .93, .06, m.darkMetal, '#373b3b');
        }
      }
      b.box(x, h + .58, z - direction * 3.9, width * .52, 1.1, 2, m.darkMetal, '#535653');
    }
  }
  // Low, stepped shop fronts on the facing blocks of the adjoining streets.
  for (const [z, angle] of [[-91, 0], [24, Math.PI]]) {
    for (let i = -2; i <= 2; i++) {
      if (i === 0 || i === (z < 0 ? -1 : 1)) continue;
      b.at(i * 6.32, z + (i % 2) * .4, angle, () => apartment(b, m, 6.3, 1 + (i + 2) % 3, 112 + i + (z < 0 ? 24 : 0), false));
    }
    b.box(0, -.088, z + (z < 0 ? 6 : -5), 42, .14, 13.5, m.concrete, '#393c3e');
    for (let k = -4; k <= 4; k++) b.box(k * 4.3, -.012, z + (z < 0 ? 6 : -5), 1.8, .012, .09, m.concrete, '#988c77');
  }
  // The far intersection opens to another lane, framed by lights at different depths.
  // Leave the middle open so the central perspective continues between buildings.
  for (const [start, stride] of [[-82, -1], [18, 1]]) {
    b.box(0, -.095, start + stride * 15, 15, .15, 33, m.concrete, '#343639');
    for (const side of [-1, 1]) {
      const pitch = -side * Math.PI / 2;
      for (let i = 0; i < (stride === 1 ? 3 : 5); i++) {
        const z = start + stride * (4 + i * 5.2);
        const x = side * (4.65 + (i % 3) * .40);
        b.at(x, z, pitch, () => {
          const width = 4.60;
          const height = 5.8 + ((i + 2) % 3) * 1.9;
          b.box(0, height / 2, -1.65, width + .35, height, 3.3, m.concrete, '#514e49');
          b.rect(0, (height + 3.3) / 2, .006, width, height - 3.3, m.office, [0,.14,.45,.47]);
          b.rect(0, 1.18, .018, width * .93, 2.33, m.rooms, atlas((i * 7 + side + 4) % 16,4,4));
          b.box(0, 2.63, .24, width + .12, .12, .90, m.metal, '#5b5950');
          b.box(0, 2.53, .53, width * .84, .025, .04, m.bareLight, '#ffd59d');
          for (const dx of [-1.72, 0, 1.72]) b.box(dx, 1.20, .07, .055, 2.4, .12, m.darkMetal, '#353a3b');
        });
        projectingPanel(b, m, side, z, 3.45 + (i % 2) * 1.24, (i + (side < 0 ? 6 : 1)) % 8, .62 + .22 * (i % 3));
      }
    }
  }
  // The lane bends left at the open tea shop. Its fluorescent lintel, red lanterns
  // and the second-floor window form a small, luminous focal point at street level.
  for (const [x,z,heading] of [[1.52,-90,.14],[-1.4,30,Math.PI+.07]]) {
    b.at(x,z,heading,()=>{
      b.box(0,2.78,-1.51,3.65,5.55,3.25,m.concrete,'#5a554b');
      b.rect(0,4.38,.14,3.53,1.92,m.photoBays,atlas(1,2,2));
      b.box(0,3.36,.24,3.76,.11,.78,m.metal,'#59564b');
      b.rect(0,2.88,.37,2.69,.76,m.shopSigns,atlas(6,4,2));
      b.rect(0,1.35,.14,3.37,2.48,m.shopInterior,atlas(0,4,4));
      for (const bar of [-1.64,-.41,1.64]) b.box(bar,1.35,.29,.055,2.60,.09,m.darkMetal,'#423831');
      b.box(0,.62,.35,3.48,1.14,.35,m.metal,'#5d4538');
      b.box(0,1.21,.46,3.56,.08,.54,m.metal,'#ccc4ae');
      b.box(0,2.54,.41,3.22,.054,.075,m.bareLight,'#ffedb8');
      for (const dx of [-1.28,1.28]) {
        b.cylinder(dx,2.31,.52,.16,.36,m.bareLight,'#fe5422');
        b.cylinder(dx,2.54,.52,.018,.14,m.darkMetal,'#302d28');
        b.rect(dx,2.30,.71,.86,.84,m.glows[0]);
      }
      b.box(0,3.47,.54,3.75,.11,1.00,m.metal,'#665b47',.08);
    });
  }
  for (const [x,z,id] of [[-.85,-100,1],[.65,-109,7],[-1.26,-114,2]]) {
    b.rect(x,3.02+(id%3)*.43,z,.64,.9,m.shopSigns,atlas(id,4,2));
    b.rect(x,3.02+(id%3)*.43,z+.01,1.26,1.38,m.glows[id % 5]);
  }
}

function outerBlocks(b: StreetBatch, m: M) {
  const rand = seededRandom(13072);
  for (const side of [-1, 1]) {
    // Side streets connect the residential blocks behind the market and carry the
    // scene out to the horizon when the visitor rises above the awnings.
    for (let row = 0; row < 3; row++) {
      const frontX = side * [15.8, 31.4, 48.5][row];
      const avenueX = frontX - side * 2.5;
      b.box(avenueX, -.15, -35, 6.4, .20, 138, m.concrete, '#363b40');
      for (let z = -99; z < 31; z += 8.1) b.box(avenueX, -.042, z, .10, .011, 2.35, m.concrete, '#948860');
      let near = 31 - rand() * 6;
      let block = 0;
      while (near > -103) {
        const frontage = 7.6 + rand() * 6.7;
        const z = near - frontage / 2;
        const x = frontX + side * rand() * .8;
        const corridor = side > 0 && Math.abs(z - (8 - Math.abs(x) * 3.25)) < 17;
        const floors = corridor ? 2 : 3 + Math.floor(rand() * (row === 2 ? 6 : 4));
        const height = floors * 2.72;
        const depth = 6.5 + rand() * 3.8;
        const tint = ['#555a57','#625c56','#636668','#574f48','#625953'][block % 5];
        b.at(x,z,-side * Math.PI / 2,()=>{
          b.box(0,height / 2,-depth / 2,frontage,height,depth,m.concrete,tint);
          b.box(0,.031,.69,frontage + .14,.13,1.51,m.concrete,'#64635b');
          const uv: RectUV = [0,.035,frontage / 16,.035 + height / 24];
          for (const face of [-1,1]) {
            const planeZ = face > 0 ? .008 : -depth - .008;
            const angle = face > 0 ? 0 : Math.PI;
            b.rect(0,height / 2,planeZ,frontage - .17,height - .20,m.office,uv,angle);
            b.rect(face * (frontage / 2 + .006),height / 2,-depth / 2,depth - .12,height - .19,
              m.office,[.19,.03,.19 + depth / 15,.03 + height / 21],face * Math.PI / 2);
          }
          const bays = Math.max(3,Math.round(frontage / 2.35));
          for (let floor = 1; floor < floors; floor++) {
            const wy = floor * 2.72 + .94;
            if (floor % 2 === 1) b.box(0,wy - 1.02,.07,frontage + .11,.095,.22,m.concrete,tint);
            for (let bay = 0; bay < bays; bay++) {
              const wx = frontage * ((bay + .5) / bays - .5);
              if (rand() > .31) continue;
              b.rect(wx,wy,.016,1.08,1.01,m.rooms,atlas(Math.floor(rand() * 16),4,4));
              if (row === 0 && bay % 2 === 0) b.box(wx + .48,wy - .68,.18,.55,.35,.37,m.metal,'#837d72');
            }
          }
          b.box(0,height + .075,-depth / 2,frontage + .30,.15,depth + .22,m.concrete,'#6e6962');
          b.roof(0,height + .153,-depth / 2,frontage + .27,depth + .19,m.roof);
          for (const s of [-1,1]) b.box(0,height + .27,-depth / 2 + s * depth / 2,frontage,.38,.13,m.concrete,tint);
          b.box(-frontage * .19,height + .56,-depth * .60,frontage * .38,1.08,2.0,m.concrete,'#66665f');
          b.box(-frontage * .19,height + 1.16,-depth * .60,frontage * .40,.12,2.22,m.metal,'#4b5454',-.04);
          const tx = frontage * .26;
          if (block % 3 !== 1) {
            b.cylinder(tx,height + .89,-depth * .42,.53,1.46,m.metal,'#93958e');
            for (const rise of [.24,.84,1.48]) b.cylinder(tx,height + rise,-depth * .42,.55,.054,m.metal,'#5c6766');
          } else {
            for (const dx of [-.42,.45]) b.box(tx + dx,height + .27,-depth * .38,.69,.52,.85,m.metal,'#8c8980');
          }
          if (block % 4 === 0) {
            b.cylinder(1.2,height + 1.35,-depth * .8,.026,2.7,m.metal,'#5a5b55');
            for (let k = 0; k < 3; k++) b.box(1.15,height + 1.67 + k * .37,-depth * .8,1.32 - k * .21,.022,.03,m.metal,'#72766f');
          }
        });
        if (row === 0 && block % 3 === 1) streetLamp(b,m,avenueX,z,side,5.2);
        near -= frontage + (block % 3 === 1 ? 3.15 : .58 + rand() * .84);
        block++;
      }
    }
  }
}

function taipei101(b: StreetBatch, m: M, group: T.Object3D) {
  // The eight flared sections and cap are legible even above a dark, foggy canyon.
  const x = 26.2, z = -80.5, base = 14.4;
  const tiers = new T.Group();
  tiers.position.set(x, base, z);
  tiers.rotation.y = .24;
  group.add(tiers);
  b.box(x, base / 2, z, 4.6, base, 4.6, m.skyline, '#18232b');
  let y = 0;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let level = 0; level < 8; level++) {
    const bottom = 1.72 - level * .074;
    const top = bottom * 1.14;
    const h = 2.13;
    const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
    for (let k = 0; k < 4; k++) {
      const a = corners[k], c = corners[(k + 1) % 4], start = positions.length / 3;
      positions.push(a[0] * bottom, y, a[1] * bottom, c[0] * bottom, y, c[1] * bottom,
        c[0] * top, y + h, c[1] * top, a[0] * top, y + h, a[1] * top);
      const v = (level % 3) / 3;
      uv.push(.13,v,.87,v,.87,v+.22,.13,v+.22);
      indices.push(start,start+1,start+2,start,start+2,start+3);
    }
    b.at(x, z, .24, () => {
      for (const s of [-1, 1]) {
        b.box(0, base + y + h - .015, s * top, top * 2, .098, .07, m.towerLight, level % 3 === 0 ? '#67e6f7' : '#3aabc6');
        b.box(s * top, base + y + h - .015, 0, .067, .094, top * 2, m.towerLight, '#5088d4');
        if (level > 4) {
          b.box(s * top * .69, base + y + h * .82, top + .025, .075, .28, .06, m.towerLight, '#72d2fa');
          b.box(s * top * .28, base + y + h * .82, top + .025, .055, .18, .06, m.towerLight, '#56b6e5');
        }
      }
    });
    y += h + .10;
  }
  const glass = new T.BufferGeometry();
  glass.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  glass.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  glass.setIndex(indices);
  tiers.add(new T.Mesh(glass, m.towerOffice));
  for (let i = 0; i < 4; i++) {
    const w = 1.43 - i * .25, h = .68 - i * .075;
    b.box(x, base + y + h / 2, z, w, h, w, m.skyline, '#448aa1');
    b.box(x, base + y + h, z, w + .04, .085, w + .04, m.towerLight, i % 2 ? '#94e5f5' : '#3ec8e8');
    y += h;
  }
  b.cylinder(x, base + y + 1.05, z, .044, 2.1, m.towerLight, '#93c2e7');
  b.cylinder(x, base + y + 2.1, z, .081, .14, m.towerLight, '#ffc17c');
}

export function buildCity(scene: T.Scene): void {
  const city = new T.Group();
  city.name = 'Songshan street architecture';
  scene.add(city);
  const b = new StreetBatch();
  const m = streetMaterials();
  const rand = seededRandom(31164);
  for (const side of [-1, 1]) {
    let front = 16.2;
    let n = 0;
    while (front > -80.3) {
      const width = 5.25 + rand() * 2.65;
      const center = front - width / 2;
      const wallX = side * (6.15 + rand() * .64);
      const right = side > 0;
      // The lower roofline on the east side opens a glimpse of the blue-lit tower.
      const floors = right && center < 4 && center > -47 ? 1 : 2 + Math.floor(rand() * (right ? 2 : 3));
      const seed = 51 + n * 7 + (right ? 4 : 0);
      b.at(wallX, center, -side * Math.PI / 2, () => apartment(b, m, width - .08, floors, seed, right));
      if (n % 2 === (right ? 0 : 1) && center < 4) {
        const sign = (n * 5 + (right ? 0 : 1)) % 12;
        blade(b, m, wallX, center + width * .15, sign, 3.35 + rand() * .72, 1.48 + rand() * .98);
      }
      for (let j = 0; j < 3; j++) {
        const x = side * (5.80 - j * .13);
        const y = 4.6 + j * .31;
        cable(b, m, new T.Vector3(x, y, front), new T.Vector3(x, y + .04, front - width), .09 + j * .06, .014 + .003 * j);
      }
      n++;
      front -= width + (n % 5 === 0 ? .82 : .08);
    }
  }
  blade(b, m, -6.32, -7.4, 2, 5.72, 2.16);
  blade(b, m, -6.34, -5.05, 0, 3.77, 1.92);
  // Larger wall-mounted condensers above the first teal awning catch its warm light.
  for (const [z,y,seed] of [[.68,4.84,6],[-.72,4.96,10],[1.93,5.27,12]]) {
    b.at(-5.79,z,1.27,()=>aircon(b,m,0,y,0,seed));
  }
  for (const [side,z,y,index,w] of [
    [-1,-16.1,4.12,0,.88], [1,-17.5,5.4,6,.69], [-1,-26,3.9,7,.67], [1,-28.3,4.25,3,1.02],
    [-1,-33.4,5.63,1,.75], [-1,-33.4,4.84,4,.73], [1,-43.7,4.44,0,.89], [-1,-47.3,3.96,2,.85],
    [1,-52,5.45,1,.65], [-1,-60.6,4.55,0,.72], [1,-64.9,4.32,7,.70], [1,-73.2,3.95,6,.85]
  ]) projectingPanel(b,m,side,z,y,index,w);
  for (const [x, z, h] of [[5.75, -16, 6.40], [-5.7, -36, 5.9], [5.7, -66, 6.15], [-5.9, 14.2, 6.35], [4.5, -87, 5.8]]) {
    streetLamp(b, m, x, z, Math.sign(x), h);
  }
  for (const z of [12.8, -22, -58]) {
    cable(b, m, new T.Vector3(-6.2, 8.15, z), new T.Vector3(6.2, 7.86, z - 1.18), .72, .016);
  }
  distantBuildings(b, m);
  outerBlocks(b,m);
  taipei101(b, m, city);
  b.finish(city);
}
