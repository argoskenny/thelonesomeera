import * as THREE from 'three';
import { noise, smoothstep } from '../../shared/procedural';

const height = 10.6;
const bottom = -0.28;
const topX = 14.8;
const topZ = 12.8;
const batter = 4.2;
const spanX = (topX + 1.85) * 2;
const spanZ = (topZ + 1.85) * 2;
const span = [spanX, spanZ, spanX, spanZ];
const outward = [
  new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0),
];

type Point = { u: number; y: number; d: number };
type Buffers = { pos: number[]; color: number[]; uv: number[]; indices: number[] };
type Random = () => number;
const buffers = (): Buffers => ({ pos: [], color: [], uv: [], indices: [] });

function seededRandom(): Random {
  let seed = 0xb435c191;
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function profile(side: number, u: number, y: number, relief: number) {
  const t = u * 2 / span[side] - 1;
  const offset = batter * (1 - THREE.MathUtils.clamp(y / height, 0, 1)) ** 1.42 + relief;
  const x = topX + offset, z = topZ + offset;
  switch (side) {
    case 0: return new THREE.Vector3(t * x, y, z);
    case 1: return new THREE.Vector3(x, y, -t * z);
    case 2: return new THREE.Vector3(-t * x, y, -z);
    default: return new THREE.Vector3(-x, y, t * z);
  }
}

function mesh(data: Buffers, material: THREE.Material, name: string) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(data.color, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv, 2));
  g.setIndex(data.indices);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  g.boundingSphere!.radius += 0.4;
  const result = new THREE.Mesh(g, material);
  result.name = name;
  result.castShadow = result.receiveShadow = true;
  return result;
}

function surface(name: string, color = false) {
  const url = new URL('../assets/shirasagi/rampart/' + name + '.webp', document.baseURI);
  const texture = new THREE.TextureLoader().load(url.href);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function fieldstone(map: THREE.Texture, normalMap: THREE.Texture, displacementMap: THREE.Texture) {
  const b = buffers();
  // Taper and warp the scan in metres. The color, physical displacement and relief normals share
  // one parameterization, including the pockets around the small stones packed between boulders.
  for (let side = 0; side < 4; side++) {
    const columns = Math.ceil(span[side] / 0.145), rows = 78;
    const start = b.pos.length / 3;
    const phase = side * 3.69;
    for (let row = 0; row <= rows; row++) {
      const y = bottom + (height - bottom) * row / rows;
      for (let column = 0; column <= columns; column++) {
        const u = span[side] * column / columns;
        const corner = Math.min(u, span[side] - u);
        const p = profile(side, u, y, -0.075 * (1 - smoothstep(0.35, 2.6, corner)));
        b.pos.push(p.x, p.y, p.z);
        // The field becomes finely packed toward the middle and opens into larger blocks near the quoins.
        const stretch = (u - span[side] / 2) / span[side];
        b.uv.push(
          u / 3.60 - 1.59 * stretch ** 3 + 0.15 * Math.sin(0.44 * u + 0.51 * y + phase)
            + 0.105 * Math.sin(0.71 * y - 0.26 * u) + phase,
          y / 3.61 + 0.19 * Math.sin(0.50 * u + 0.12 * y + phase)
            + 0.24 * Math.sin(0.18 * u - 0.37 * y) + 0.043 * Math.sin(1.81 * u + 0.54 * y) + phase,
        );
        const patches = 0.64 * noise(phase + u * 0.25, 5.4 + y * 0.32)
          + 0.36 * noise(phase + u * 0.84, y * 1.04);
        const moss = smoothstep(0.48, 0.83, patches);
        const tone = 1.18 + 0.48 * noise(55 + u * 0.53, phase + y * 0.48);
        b.color.push(tone * (1 - moss * 0.11), tone * (1 + moss * 0.075), tone * (1 - moss * 0.24));
        if (column < columns && row < rows) {
          const i = start + row * (columns + 1) + column;
          b.indices.push(i, i + 1, i + columns + 2, i, i + columns + 2, i + columns + 1);
        }
      }
    }
  }
  const mat = new THREE.MeshStandardMaterial({
    map, normalMap, normalScale: new THREE.Vector2(0.84, 0.84), displacementMap,
    displacementBias: -0.23, displacementScale: 0.53, vertexColors: true, roughness: 0.97,
  });
  return mesh(b, mat, 'Dry-stacked scanned stone with individually resolved joints');
}

// Sample broad areas inside individual scanned stones for the large hewn corner blocks.
const faces = [
  [0.422, 0.077, 0.119, 0.047], [0.779, 0.078, 0.10, 0.036], [0.596, 0.258, 0.088, 0.033],
  [0.876, 0.251, 0.094, 0.04], [0.331, 0.373, 0.064, 0.049], [0.772, 0.526, 0.103, 0.042],
  [0.850, 0.640, 0.075, 0.039], [0.328, 0.844, 0.069, 0.032], [0.516, 0.660, 0.091, 0.038],
];

function cornerstone(b: Buffers, corner: number, y: number, nextY: number, course: number, random: Random) {
  const h = nextY - y;
  const long = 1.45 + random() * 0.95, short = 0.48 + random() * 0.52;
  const toe = 0.13 + random() * 0.065, crest = 0.13 + random() * 0.075;
  const tone = 0.77 + random() * 0.36;
  const lithology = faces[Math.floor(random() * faces.length)];
  const yLo = y + 0.011, yHi = nextY - 0.018;
  const slope = (random() - 0.5) * 0.09;
  for (let wing = 0; wing < 2; wing++) {
    const prev = wing === 0;
    const side = prev ? (corner + 3) % 4 : corner;
    const length = (course + wing) % 2 ? long : short;
    const lower = length * (0.78 + random() * 0.21), upper = length * (0.78 + random() * 0.21);
    const low = yLo + (random() - 0.5) * h * 0.13, high = yHi + (random() - 0.5) * h * 0.11;
    const end = 0.075 + random() * 0.052;
    const points: Point[] = [
      { u: 0, y: yLo, d: toe }, { u: lower, y: low, d: end },
      { u: length, y: low + h * (0.17 + random() * 0.15), d: end * 0.9 },
      { u: upper * (0.97 + random() * 0.10), y: high - h * (0.095 + random() * 0.13), d: end },
      { u: upper * 0.89, y: high, d: end * 1.05 }, { u: 0, y: yHi, d: crest },
    ];
    const front = points.map(p => {
      const factor = p.u / length;
      const margin = h * (0.016 + random() * 0.061);
      return {
        u: p.u * (1 - (0.012 + random() * 0.030)),
        y: p.y + (p.y < y + h / 2 ? margin : -margin) * factor,
        d: p.d + (0.015 + slope * factor), 
      };
    });
    const add = (p: Point, color: number) => {
      const index = b.pos.length / 3;
      const u = prev ? span[side] - p.u : p.u;
      const world = profile(side, u, p.y, p.d);
      b.pos.push(world.x, world.y, world.z);
      b.uv.push(lithology[0] + lithology[2] * (p.u / length * 2 - 1) * (prev ? -1 : 1),
        1 - lithology[1] + lithology[3] * ((p.y - y) / h * 2 - 1));
      b.color.push(color * 1.26, color * 1.25, color * 1.26);
      return index;
    };
    const tri = (a: number, c: number, d: number) => {
      if (prev) b.indices.push(d, c, a);
      else b.indices.push(a, c, d);
    };
    const faceIndices = front.map(p => add(p, tone));
    for (let i = 1; i < front.length - 1; i++) tri(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
    for (let i = 0; i < points.length - 1; i++) {
      const j = i + 1, a = points[i], c = points[j];
      // Separate normals keep the hewn face planar and the broken lips sharp.
      const first = add(front[i], tone * 0.89), second = add(front[j], tone * 0.89);
      const third = add({ ...a, d: -0.075 }, tone * 0.64), fourth = add({ ...c, d: -0.075 }, tone * 0.64);
      tri(third, fourth, second); tri(third, second, first);
    }
  }
}

function structure(map: THREE.Texture, normalMap: THREE.Texture, random: Random) {
  const b = buffers();
  for (let corner = 0; corner < 4; corner++) {
    let y = bottom, course = 0;
    while (y < height - 0.01) {
      let nextY = y + 0.53 + random() * 0.35;
      if (height - nextY < 0.34) nextY = height;
      cornerstone(b, corner, y, nextY, course++, random);
      y = nextY;
    }
  }
  const cap = b.pos.length / 3;
  for (let side = 0; side < 4; side++) {
    const p = profile(side, 0, height - 0.01, 0.085);
    b.pos.push(p.x, p.y, p.z); b.uv.push(p.x / 3, p.z / 3); b.color.push(0.76, 0.78, 0.70);
  }
  b.indices.push(cap, cap + 1, cap + 2, cap, cap + 2, cap + 3);
  return mesh(b, new THREE.MeshStandardMaterial({
    map, normalMap, normalScale: new THREE.Vector2(0.42, 0.42), roughness: 0.95, vertexColors: true,
  }), 'Alternating corner headers and stretchers');
}

function fissurePlants(random: Random) {
  const b = buffers(), up = new THREE.Vector3(0, 1, 0);
  for (let side = 0; side < 4; side++) {
    const tangent = new THREE.Vector3().crossVectors(up, outward[side]);
    for (let i = 0; i < 38; i++) {
      const u = 0.9 + random() * (span[side] - 1.8), y = 0.15 + random() * (height - 0.40);
      const root = profile(side, u, y, 0.075);
      const olive = new THREE.Color(random() > 0.6 ? 0x58523a : 0x454d34);
      for (let blade = 0; blade < 6; blade++) {
        const lateral = (random() - 0.5) * 0.34, length = 0.08 + random() * 0.20;
        const direction = tangent.clone().multiplyScalar(lateral).addScaledVector(outward[side], 0.06 + random() * 0.12);
        const mid = root.clone().addScaledVector(direction, 0.46).addScaledVector(up, length * 0.63);
        const tip = root.clone().add(direction).addScaledVector(up, length * (0.30 + random() * 0.57));
        const width = 0.006 + random() * 0.011, n = b.pos.length / 3;
        for (const [j, v] of [root, mid.clone().addScaledVector(tangent, -width), mid.clone().addScaledVector(tangent, width), tip].entries()) {
          const shade = j === 0 ? 0.64 : j === 3 ? 1.13 : 0.94;
          b.pos.push(v.x, v.y, v.z); b.color.push(olive.r * shade, olive.g * shade, olive.b * shade); b.uv.push(0, 0);
        }
        b.indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
  }
  return mesh(b, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 }),
    'Sparse sedges in the stonework');
}

export function createRampart(): THREE.Group {
  const group = new THREE.Group(), random = seededRandom();
  group.name = 'Ishigaki rampart';
  const map = surface('fieldstone', true), normalMap = surface('normal');
  group.add(fieldstone(map, normalMap, surface('relief')), structure(map, normalMap, random), fissurePlants(random));
  return group;
}
