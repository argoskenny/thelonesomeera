import { centerFace, offsetFace, type Face, type Point, type Skin, type Skins } from './keep-mesh';

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const TAU = Math.PI * 2;
const pitch = .30;

// Each half-round ceramic cap laps the narrower head of the tile above it.
function tileCourse(s: Skins, face: Face, length: number, seed: number,
  sample: (t: number, lateral: number, raised: number) => Point) {
  const segment = .395;
  for (let start = 0, index = 0; start < length - .001; start += segment, index++) {
    const end = Math.min(start + segment, length);
    const grain = .90 + .11 * Math.sin(seed * 17.37 + index * 11.8);
    const width = .076 + .006 * Math.cos(seed * 3.21 + index * 21.9);
    s.rolls.patch(face, 4, 2, (u, row) => {
      const v = row === .5 ? .13 : row;
      const phi = u * Math.PI;
      const t = mix(start, end, v) / length;
      return sample(t, -Math.cos(phi) * width * (1 - .13 * v),
        .026 + Math.sin(phi) * (.072 - v * .016) + (v === 0 ? .005 : 0));
    }, (u, v) => [u + seed * .37, v + index * .27], (_u, row) => grain * (row === 0 ? .70 : row === 1 ? .87 : 1));
  }
}

function roundCap(skin: Skin, face: Face, x: number, y: number, z: number, r: number, tone = 1) {
  skin.patch(face, 10, 1, (a, t) => [x + Math.cos(a * TAU) * r * t, y + Math.sin(a * TAU) * r * t, z],
    (a, t) => [.5 + .5 * Math.cos(a * TAU) * t, .5 + .5 * Math.sin(a * TAU) * t],
    () => tone, true);
}

function ridge(skin: Skin, face: Face, path: (t: number) => Point, radius: number, sections: number, tone = 1) {
  skin.patch(face, 8, sections, (a, t) => {
    const [x, y, z] = path(t);
    const before = path(Math.max(0, t - .002)), after = path(Math.min(1, t + .002));
    const dx = after[0] - before[0], dz = after[2] - before[2], l = Math.hypot(dx, dz) || 1;
    return [x - Math.cos(a * TAU) * dz / l * radius, y + Math.sin(a * TAU) * radius,
      z + Math.cos(a * TAU) * dx / l * radius];
  }, (u, v) => [u, v * sections], () => tone);
}

export interface RoofTier {
  x: number;
  z: number;
  innerX: number;
  innerZ: number;
  eave: number;
  rise: number;
  lift: number;
}

export function hippedRoof(s: Skins, r: RoofTier) {
  for (let side = 0; side < 4; side++) {
    const face = { ...centerFace, turn: side };
    const w = side % 2 ? r.z : r.x, d = side % 2 ? r.x : r.z;
    const wi = side % 2 ? r.innerZ : r.innerX, di = side % 2 ? r.innerX : r.innerZ;
    const run = d - di;
    const widthAt = (v: number) => mix(w, wi, v);
    const height = (x: number, v: number) => {
      const n = Math.min(1, Math.abs(x) / widthAt(v));
      const kick = .10 * n * n + .90 * n ** 8;
      return r.eave + r.rise * (.46 * v + .54 * v * v) + r.lift * kick * (1 - .74 * v);
    };
    const position = (u: number, v: number): Point => {
      const x = (u * 2 - 1) * widthAt(v);
      return [x, height(x, v), d - run * v];
    };
    s.pans.patch(face, Math.ceil(w * 2), 5, position,
      (u, v) => [(u * 2 - 1) * widthAt(v) / (pitch * 10), (v * Math.hypot(run, r.rise)) / 1.96],
      (u, v) => .91 + .065 * v + .018 * Math.cos(u * 21 + side));
    s.trim.patch(face, Math.ceil(w * 2), 2, (u, v) => {
      const p = position(u, v * .74);
      return [p[0], p[1] - .27 - v * .04, p[2]];
    }, (u, v) => [u * w, v * run], (_u, v) => .86 - .2 * v, true);
    // Leading fascia has a charcoal tile drip above the pale, lime-washed rafter plate.
    for (const [surface, y0, y1] of [[s.trim, -.275, -.105], [s.rolls, -.105, .018]] as const) {
      surface.patch(face, Math.ceil(w * 2), 1, (u, v) => {
        const x = (u * 2 - 1) * w;
        return [x, height(x, 0) + mix(y0, y1, v), d];
      }, (u, v) => [u * w, v], (_u, v) => .86 + .14 * v);
    }

    const tiles = Math.floor(w * 2 / pitch);
    for (let i = 0; i < tiles; i++) {
      const x = ((i + .5) / tiles * 2 - 1) * w;
      // Rolls run down the pitch parallel to each other and are clipped against the diagonal hip.
      const tEnd = Math.min(1, (w - Math.abs(x) - .04) / (w - wi));
      if (tEnd <= .008) continue;
      const tone = .86 + .14 * (.5 + .5 * Math.cos(i * 37.54 + side * 6.01 + r.eave));
      tileCourse(s, face, Math.hypot(run, r.rise) * tEnd, i + side + r.eave, (v, lateral, raised) => {
        const xx = x + lateral, t = v * tEnd;
        return [xx, height(xx, t) + raised, d + .036 - run * t];
      });
      roundCap(s.endTiles, face, x, height(x, 0) + .024, d + .056, .082, tone);
      if (i % 2 === 0 && tEnd > .38) {
        const y = height(x, .095) - .275;
        s.trim.box(face, x, y, d - run * .083, .12, .09, Math.min(.58, run * .2), .64);
      }
    }
    for (const [rad, dy] of [[.125, .05], [.082, .14]]) {
      ridge(s.rolls, face, t => {
        const x = widthAt(t);
        return [x, height(x, t) + dy + .10 * (1 - t) ** 18, d - run * t];
      }, rad, 12);
    }
    // Compact onigawara at the foot of each descending hip.
    const corner = offsetFace(face, w, d);
    const base = height(w, 0);
    for (let j = 0; j < 3; j++) {
      s.rolls.box(corner, -.039 * j, base + .095 + j * .081, -.039 * j,
        .30 - j * .073, .105, .29 - j * .06, .92);
    }
  }
}

interface Gable {
  face: Face;
  halfWidth: number;
  rear: number;
  front: number;
  y: number;
  rise: number;
  upper?: boolean;
}

function ornament(s: Skins, face: Face, x: number, y: number, z: number, size: number) {
  // A carved gegyo pendant below the peak, built around the central six-leaf rosette.
  for (const [offset, scale] of [[0, 1], [-.29, .53], [.29, .53]]) {
    s.trim.patch(face, 6, 2, (u, v) => {
      const a = (u - .5) * 2;
      const top = y + .14 * size - Math.abs(a) * .13 * size * scale;
      const bottom = y - (.18 + .39 * (1 - Math.abs(a)) ** 1.5) * size * scale;
      return [x + offset * size + a * .21 * size * scale, mix(bottom, top, v), z];
    }, undefined, () => .92);
  }
  roundCap(s.endTiles, face, x, y - .04 * size, z + .007, .10 * size);
}

export function gabledRoof(s: Skins, g: Gable) {
  const { face, halfWidth: w, rear, front, y, rise } = g;
  const length = front - rear;
  const liftZ = (v: number) => .17 * (Math.abs(2 * v - 1) ** 6);
  const surfaceY = (a: number, v: number) => y + rise * (1 - a) ** 1.56 + .24 * a ** 9 + liftZ(v);
  for (const sign of [-1, 1]) {
    s.pans.patch(face, 12, 8, (u, v) => [sign * w * u, surfaceY(u, v), rear + length * v],
      (u, v) => [(rear + length * v) / (pitch * 10), (1 - u) * Math.hypot(w, rise) / 1.96]);
    s.trim.patch(face, 12, 3, (u, v) => [sign * w * u, surfaceY(u, v) - .22, rear + length * v],
      (u, v) => [u, v], () => .83);
    s.trim.patch(face, 12, 1, (u, v) => [sign * w, surfaceY(1, u) - .225 + .16 * v, rear + length * u]);
    const count = Math.ceil(length / pitch);
    for (let j = 0; j < count; j++) {
      const t = (j + .5) / count, z = rear + length * t;
      const tone = .88 + .1 * (.5 + .5 * Math.sin(j * 17 + sign * 3));
      tileCourse(s, face, Math.hypot(w, rise), j + y, (along, dz, raised) => {
        const v = 1 - along;
        return [sign * (w + .035) * v, surfaceY(v, t + dz / length) + raised, z + dz];
      });
      const endFace = offsetFace(face, sign * (w + .048), z, sign > 0 ? 1 : 3);
      roundCap(s.endTiles, endFace, 0, surfaceY(1, t) + .024, 0, .079, tone);
    }
    for (const v of [0, 1]) {
      const z = rear + length * v, dir = v ? 1 : -1;
      // Stepped white bargeboard with its shadow joint under the graphite coping.
      s.trim.patch(face, 18, 1, (u, t) => [sign * u * w, surfaceY(u, v) + mix(-.32, -.09, t), z + dir * .024],
        (u, t) => [u * w / 3.8, t], (_u, t) => .82 + .16 * t);
      s.rolls.patch(face, 18, 1, (u, t) => [sign * u * w, surfaceY(u, v) + mix(-.11, .032, t), z + dir * .038]);
      ridge(s.rolls, face, u => [sign * u * w, surfaceY(u, v) + .11, z], .10, 16);
    }
  }
  for (const v of [0, 1]) {
    const z = rear + length * v + (v ? -.34 : .34);
    const wallWidth = w - .40;
    for (const sign of [-1, 1]) {
      s.plaster.patch(face, 12, 2, (u, t) => {
        const x = sign * u * wallWidth;
        return [x, mix(y - .17, surfaceY(Math.abs(x / w), v) - .35, t), z];
      }, (u, t) => [u * wallWidth / 3.8, t], (_u, t) => .97 - .15 * t);
    }
    if (g.upper) {
      for (const x of [-wallWidth * .32, 0, wallWidth * .32]) {
        const top = surfaceY(Math.abs(x / w), v) - .47;
        s.trim.box(face, x, (top + y) * .5, z, .10, top - y, .10, .9);
      }
    }
    ornament(s, face, 0, surfaceY(0, v) - .43, rear + length * v + (v ? .05 : -.05), g.upper ? 1.55 : 1.06);
  }
  const ridgeTiles = Math.ceil(length / .48);
  for (let j = 0; j < ridgeTiles; j++) {
    const t = (j + .5) / ridgeTiles;
    const z = rear + length * t, yy = surfaceY(0, t);
    s.rolls.box(face, 0, yy + .106, z, .37, .12, length / ridgeTiles - .009, .89 + .07 * Math.sin(j * 6.14));
    s.rolls.box(face, 0, yy + .184, z, .31, .065, length / ridgeTiles - .006, .9);
    ridge(s.rolls, face, u => {
      const t = (j + u) / ridgeTiles;
      return [0, surfaceY(0, t) + .25, rear + t * length];
    }, .112 - .004 * (j % 2), 2);
  }
  for (const v of [0, 1]) {
    const z = rear + length * v, yy = surfaceY(0, v);
    s.rolls.box(face, 0, yy + .225, z, .41, .41, .22);
    roundCap(s.endTiles, v ? face : offsetFace(face, 0, z, 2), 0, yy + .28, v ? z + .116 : .116, .169);
    if (g.upper) fish(s, offsetFace(face, 0, z, v ? 0 : 2), yy + .36);
  }
}

function fish(s: Skins, face: Face, bottom: number) {
  // Paired shachihoko turn toward the ridge. Tail and dorsal spines break the skyline.
  const silhouette = [
    [-.40, .04], [-.37, .23], [-.23, .24], [-.19, .41], [-.06, .55], [.03, .77],
    [.01, .98], [-.09, 1.17], [.08, 1.07], [.17, 1.25], [.25, 1.02],
    [.40, 1.08], [.30, .89], [.22, .77], [.22, .62], [.34, .69],
    [.25, .46], [.36, .48], [.18, .22], [.10, .06],
  ];
  const profile = offsetFace(face, 0, 0, 1);
  const faceShape = (offset: number) => {
    const mid: Point = [.01, bottom + .45, offset];
    for (let i = 0; i < silhouette.length; i++) {
      const a = silhouette[i], b = silhouette[(i + 1) % silhouette.length];
      s.rolls.patch(profile, 1, 1, (u, v) => [
        mix(mid[0], mix(a[0], b[0], u), v), mix(mid[1], bottom + mix(a[1], b[1], u), v), offset]);
      if (offset > 0) s.rolls.patch(profile, 1, 1, (u, v) =>
        [mix(a[0], b[0], u), bottom + mix(a[1], b[1], u), mix(-.105, .105, v)]);
    }
  };
  faceShape(.105);
  faceShape(-.105);
}
