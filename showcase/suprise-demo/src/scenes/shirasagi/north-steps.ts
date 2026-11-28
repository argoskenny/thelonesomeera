import * as THREE from 'three';
import { GeometryBatch, seededRandom, vec } from '../../shared/geometry';
import { centerFace, Skin, type Point } from './keep-mesh';
import { northAccessLayout, stairZ, stairWidth, lowerX, topY, doorZ, landingEndX, landingStartX, treads } from './north-steps-layout';

const lerp = THREE.MathUtils.lerp;

function stoneSkin(file: string, label: string, color: number, bumpScale: number) {
  const url = new URL('../assets/shirasagi/rampart/' + file, document.baseURI);
  const map = new THREE.TextureLoader().load(url.href);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 6;
  return new Skin(label, new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale,
    roughness: .94, color, vertexColors: true, side: THREE.DoubleSide }));
}
function panel(s: Skin, a: Point, b: Point, c: Point, d: Point, grain: number, vertical: boolean, tint: number) {
  const point = (u: number, v: number): Point => [
    lerp(lerp(a[0], b[0], u), lerp(c[0], d[0], u), v),
    lerp(lerp(a[1], b[1], u), lerp(c[1], d[1], u), v),
    lerp(lerp(a[2], b[2], u), lerp(c[2], d[2], u), v),
  ];
  const sideX = Math.abs(b[0] - a[0]) > Math.abs(b[2] - a[2]);
  s.patch(centerFace, 1, 1, point, (u, v) => {
    const [x, y, z] = point(u, v);
    return vertical ? [(sideX ? x : -z) / grain, y / grain] : [x / grain, z / grain];
  }, (_u, v) => tint * (vertical ? .78 + .22 * v : 1));
}
function wallBlock(s: Skin, x0: number, x1: number, z0: number, z1: number, height: number, widenX = false) {
  const y = height - .14;
  const taper = Math.max(0, y * .065);
  const tx = widenX ? taper : 0;
  const bottom: Point[] = [[x0 - tx, -.08, z0 - taper], [x1 + tx, -.08, z0 - taper],
    [x1 + tx, -.08, z1 + taper], [x0 - tx, -.08, z1 + taper]];
  const top: Point[] = [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
  for (let j = 0; j < 4; j++) {
    const k = (j + 1) % 4;
    panel(s, bottom[j], bottom[k], top[j], top[k], 3.55, true, 1.30);
  }
  panel(s, top[0], top[1], top[3], top[2], 3.55, false, .82);
}

// Each tread is laid from individually jointed and slightly chamfered dressed-stone blocks.
function flag(s: Skin, x0: number, x1: number, z0: number, z1: number, y: number, random: () => number) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const c = .016 + random() * .025;
  const outline = [[x0 + c, z0], [x1 - c, z0], [x1, z0 + c], [x1, z1 - c],
    [x1 - c, z1], [x0 + c, z1], [x0, z1 - c], [x0, z0 + c]];
  const shade = .82 + random() * .24;
  const bottom: Point[] = outline.map(([x,z]) => [x, y - .165, z]);
  const edge: Point[] = outline.map(([x,z]) => [x, y - .030 - random() * .009, z]);
  const top: Point[] = outline.map(([x,z]) => [lerp(x,cx,.022), y + random() * .003, lerp(z,cz,.012)]);
  const center: Point = [cx, y, cz];
  for (let j=0; j<8; j++) {
    const k=(j+1)%8;
    panel(s,bottom[j],bottom[k],edge[j],edge[k],1.15,true,shade*.88);
    panel(s,edge[j],edge[k],top[j],top[k],1.15,true,shade*.97);
    panel(s,top[k],top[j],center,center,1.15,false,shade);
  }
}

export function createNorthSteps() {
  const group = new THREE.Group();
  group.name = '北口石段と踊り場';
  const masonry = stoneSkin('stair-masonry.webp', 'Fieldstone stair abutment', 0xefede5, .15);
  const granite = stoneSkin('stair-granite.webp', 'Individually laid hewn stone treads', 0xb7b8b1, .035);
  const random = seededRandom(196734);
  const north = stairZ - stairWidth/2, south = stairZ + stairWidth/2;
  const rail = new GeometryBatch();
  const timber = new THREE.MeshStandardMaterial({ color: 0x504b43, roughness: .86 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x47443f, roughness: .68, metalness: .26 });
  function pave(x0: number, x1: number, z0: number, z1: number, y: number) {
    const split = lerp(z0, z1, .4 + random() * .2);
    flag(granite, x0 + .005, x1 - .005, z0 + .006, split -.009, y, random);
    flag(granite, x0 + .005, x1 - .005, split + .009, z1 -.006, y, random);
  }
  for (const t of treads) {
    wallBlock(masonry,t.from,t.to,north,south,t.y);
    const n = t.landing ? Math.ceil((t.to - t.from) / .86) : 1;
    for (let j=0; j<n; j++) {
      const x0 = lerp(t.from,t.to,j/n) - (j === 0 && !t.landing ? .017 : 0);
      pave(x0, lerp(t.from,t.to,(j+1)/n), north - .044,south + .044,t.y);
    }
  }
  wallBlock(masonry,landingStartX,landingEndX,south,doorZ,topY,true);
  const rows = Math.ceil((doorZ-south)/.75);
  for(let j=0;j<rows;j++) {
    const z0 = lerp(south,doorZ,j/rows) + .004, z1 = lerp(south,doorZ,(j+1)/rows) - .004;
    const divisions = j % 2 ? 3 : 2;
    for (let col=0;col<divisions;col++) {
      flag(granite,lerp(landingStartX-.035,landingEndX+.035,col/divisions)+.006,
        lerp(landingStartX-.035,landingEndX+.035,(col+1)/divisions)-.006,z0,z1,topY,random);
    }
  }
  // A weathered timber handrail traces both flights and turns toward the closed door.
  const seen = new Set<string>();
  function railing(a: Point, b: Point) {
    const count = Math.max(1, Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2]) / 1.52));
    for(let j=0;j<=count;j++) {
      const t=j/count, x=lerp(a[0],b[0],t), y=lerp(a[1],b[1],t), z=lerp(a[2],b[2],t);
      const key=x.toFixed(2)+','+z.toFixed(2);
      if (seen.has(key)) continue;
      seen.add(key);
      rail.box(.11,1.12,.11,x,y+.50,z,timber);
      rail.box(.127,.08,.127,x,y+.14,z,iron);
      rail.box(.143,.048,.143,x,y+1.075,z,timber);
    }
    for(const [h,w] of [[.47,.055],[.98,.099]]) {
      rail.beam(vec(a[0],a[1]+h,a[2]),vec(b[0],b[1]+h,b[2]),w,w*1.11,timber);
    }
  }
  const mid=treads.find(t=>t.landing)!;
  for(const z of [north,south]) {
    railing([lowerX+.12,.212,z],[mid.from,mid.y,z]);
    railing([mid.from,mid.y,z],[mid.to,mid.y,z]);
    railing([mid.to,mid.y,z],[landingStartX,topY,z]);
  }
  railing([landingStartX,topY,north],[landingEndX,topY,north]);
  railing([landingEndX,topY,north],[landingEndX,topY,doorZ-.16]);
  railing([landingStartX,topY,south],[landingStartX,topY,doorZ-.16]);
  masonry.finish(group); granite.finish(group); rail.flush(group);
  return { group, ...northAccessLayout() };
}
