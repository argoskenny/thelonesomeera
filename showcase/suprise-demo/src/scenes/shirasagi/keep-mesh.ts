import * as THREE from 'three';

type Point = [number, number, number];
type UV = [number, number];
type SurfacePoint = (u: number, v: number) => Point;
type SurfaceUV = (u: number, v: number) => UV;

export type { Point };

export interface Face {
  x: number;
  z: number;
  turn: number;
}

export const centerFace: Face = { x: 0, z: 0, turn: 0 };
const directions: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

export function locate(face: Face, x: number, y: number, z: number): Point {
  const [c, s] = directions[face.turn];
  return [face.x + x * c + z * s, y, face.z + z * c - x * s];
}

export function offsetFace(face: Face, x: number, z: number, turn = 0): Face {
  const [wx, , wz] = locate(face, x, 0, z);
  return { x: wx, z: wz, turn: (face.turn + turn) % 4 };
}

const standardUV: SurfaceUV = (u, v) => [u, v];
const unshaded = () => 1;

// Independent indexed patches keep curved tiles smooth and leave cornice edges sharp.
export class Skin {
  private positions: number[] = [];
  private uvs: number[] = [];
  private shades: number[] = [];
  private indices: number[] = [];
  constructor(private label: string, private material: THREE.MeshStandardMaterial) {}

  patch(face: Face, nx: number, ny: number, sample: SurfacePoint,
    uv: SurfaceUV = standardUV, shade: (u: number, v: number) => number = unshaded, flip = false) {
    const start = this.positions.length / 3;
    for (let j = 0; j <= ny; j++) {
      const v = j / ny;
      for (let i = 0; i <= nx; i++) {
        const u = i / nx;
        const p = sample(u, v);
        this.positions.push(...locate(face, ...p));
        this.uvs.push(...uv(u, v));
        const value = shade(u, v);
        this.shades.push(value, value, value);
        if (i === nx || j === ny) continue;
        const a = start + j * (nx + 1) + i;
        const b = a + 1;
        const c = a + nx + 1;
        const d = c + 1;
        if (flip) this.indices.push(a, c, b, c, d, b);
        else this.indices.push(a, b, c, c, b, d);
      }
    }
  }

  face(face: Face, x0: number, x1: number, y0: number, y1: number, z: number,
    low = 1, high = low) {
    this.patch(face, 1, 1, (u, v) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * v, z],
      (u, v) => [(x0 + (x1 - x0) * u) / 3.8, (y0 + (y1 - y0) * v) / 3.8],
      (_u, v) => low + (high - low) * v);
  }

  box(face: Face, x: number, y: number, z: number, width: number, height: number, depth: number, shade = 1) {
    const base = offsetFace(face, x, z);
    for (let side = 0; side < 4; side++) {
      const w = (side % 2 ? depth : width) * .5;
      const d = (side % 2 ? width : depth) * .5;
      this.face(offsetFace(base, 0, 0, side), -w, w, y - height / 2, y + height / 2, d, shade);
    }
    for (const sign of [-1, 1]) {
      this.patch(base, 1, 1, (u, v) => [(u - .5) * width, y + sign * height / 2, (.5 - v) * depth],
        (u, v) => [u * width / 3.8, v * depth / 3.8], () => shade, sign < 0);
    }
  }

  finish(group: THREE.Group) {
    if (!this.indices.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.shades, 3));
    g.setIndex(this.indices);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, this.material);
    mesh.name = this.label;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
}

function unitNoise(x: number, y: number) {
  let h = Math.imul(x + 73, 1597334677) ^ Math.imul(y + 31, 3812015801);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}
function pattern(size: number, sample: (x: number, y: number) => number) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = Math.min(255, Math.max(0, sample(x, y)));
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
const tau = Math.PI * 2;

export function createSkins() {
  const loader = new THREE.TextureLoader();
  const surface = (name: string) => {
    const t = loader.load(new URL('../assets/shirasagi/' + name, document.baseURI).href);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 6;
    return t;
  };
  // Tonal derivatives of the collection's mottled mineral plaster and weathered fired-clay maps.
  const plaster = surface('keep-lime.webp'), pans = surface('keep-kawara.webp');
  const firedClay = pattern(192, (x, y) => {
    const u = x / 192 * tau, v = y / 192 * tau;
    const bloom = Math.max(0, Math.sin(u * 3 + Math.cos(v * 2)) * Math.cos(v * 3 + Math.sin(u)));
    return 231 + bloom * 14 + (unitNoise(x, y) - .5) * 20;
  });
  const timber = pattern(192, (x, y) => {
    const u = x / 192 * tau, v = y / 192 * tau;
    return 220 + 17 * Math.sin(u * 23 + Math.sin(v) + .3 * Math.cos(v * 3 + u))
      + 8 * Math.cos(u * 41 + Math.sin(v * 2)) + (unitNoise(x, y) - .5) * 12;
  });
  // Mitsudomoe moulding on the round ends of the cylindrical cover tiles.
  const mon = pattern(96, (x, y) => {
    const px = (x + .5) / 48 - 1, py = (y + .5) / 48 - 1;
    const r = Math.hypot(px, py);
    const a = Math.atan2(py, px);
    const spiral = Math.cos(3 * a + 6.9 * r);
    const rim = r > .76 && r < .9 ? 32 : r > .68 && r < .76 ? -32 : 0;
    return 186 + rim + (r < .64 ? Math.max(-.8, spiral) * 29 : 0) + unitNoise(x, y) * 9;
  });
  const skin = (label: string, color: number, map?: THREE.Texture, roughness = .85, relief = 0) =>
    new Skin(label, new THREE.MeshStandardMaterial({ color, vertexColors: true, roughness, map: map ?? null,
      bumpMap: relief ? map : null, bumpScale: relief,
      side: THREE.DoubleSide }));
  return {
    plaster: skin('Lime plaster and window reveals', 0xf1f0ec, plaster, .96, .024),
    trim: skin('Lime-washed fascia and carved bargeboards', 0xd3d2cd, plaster, .9, .014),
    pans: skin('Overlapping smoke-fired flat kawara', 0xc8c7c2, pans, .79, .037),
    rolls: skin('Curved ibushi cover tiles and hip ridges', 0x66645e, firedClay, .72, .008),
    endTiles: skin('Stamped round tile ends', 0x77756e, mon, .74, .004),
    wood: skin('Weathered gallery and structural joinery', 0x635a50, timber, .86),
    recess: skin('Deep shutter recesses', 0x3d3935),
    shutters: skin('Lime-coated storm shutters', 0xe8e7e2, plaster, .89, .012),
    screens: skin('Recessed paper screens behind the gallery', 0xb9b5aa, plaster, .92),
  };
}
export type Skins = ReturnType<typeof createSkins>;
