import * as THREE from 'three';
import { centerFace, createSkins, offsetFace, type Face, type Skins } from './keep-mesh';
import { gabledRoof, hippedRoof, type RoofTier } from './keep-roofs';

interface Opening {
  x: number;
  bottom: number;
  top: number;
  width: number;
  kind: 'slit' | 'shutter' | 'open' | 'door' | 'gallery';
}

const roofs: RoofTier[] = [
  { x: 14.70, z: 12.70, innerX: 12.85, innerZ: 10.91, eave: 2.52, rise: .70, lift: .12 },
  { x: 14.02, z: 12.03, innerX: 10.36, innerZ: 8.68, eave: 7.10, rise: 1.34, lift: .46 },
  { x: 11.66, z: 9.96, innerX: 8.07, innerZ: 6.66, eave: 11.45, rise: 1.37, lift: .47 },
  { x: 9.42, z: 7.97, innerX: 6.13, innerZ: 4.96, eave: 15.34, rise: 1.30, lift: .46 },
  { x: 7.46, z: 6.30, innerX: 4.57, innerZ: 3.59, eave: 18.93, rise: 1.27, lift: .43 },
  { x: 5.71, z: 4.66, innerX: 2.94, innerZ: 2.96, eave: 22.40, rise: 1.12, lift: .42 },
];

function windowDetails(s: Skins, f: Face, d: number, hole: Opening) {
  const { x, width: w, bottom, top, kind } = hole;
  const height = top - bottom;
  const middle = (bottom + top) / 2;
  const depth = kind === 'gallery' ? .71 : kind === 'slit' ? .28 : .24;
  const edge = x - w / 2;
  s.recess.face(f, edge, edge + w, bottom, top, d - depth - .011, .75, .48);
  // Left and right jambs, lintel and sill enclose actual recesses in the mesh.
  for (const sign of [-1, 1]) {
    s.trim.patch(f, 1, 1, (u, v) => [x + sign * w * .5, bottom + height * v, d - depth * u],
      undefined, () => sign > 0 ? .82 : .75);
    s.trim.patch(f, 1, 1, (u, v) => [edge + w * u, middle + sign * height * .5, d - depth * v],
      undefined, () => sign > 0 ? .63 : .88);
  }
  if (kind === 'slit') return;
  if (kind === 'door') {
    const count = 10;
    for (let j = 0; j < count; j++) {
      s.wood.box(f, edge + w * (j + .5) / count, middle, d - .14,
        w / count - .012, height - .025, .075, .78 + .05 * Math.cos(j * 2.3));
    }
    for (const y of [bottom + .43, top - .35]) {
      s.recess.box(f, x, y, d - .08, w * .94, .09, .045);
      for (const sign of [-1, 1]) s.rolls.box(f, x + sign * w * .39, y, d - .045, .04, .04, .04);
    }
    return;
  }
  const panel = (cx: number, width: number) => {
    s.shutters.box(f, cx, middle - .016, d - .121, width - .018, height - .074, .065);
  };
  if (kind === 'shutter') {
    panel(x - w / 4, w / 2);
    panel(x + w / 4, w / 2);
  } else {
    const openWidth = kind === 'open' ? w * (.31 + .15 * (.5 + .5 * Math.sin(x * 17.3))) : w;
    if (kind === 'open') panel(edge + (w - openWidth) / 2, w - openWidth);
    if (kind === 'gallery') {
      const paperWidth = w * (.38 + .47 * (.5 + .5 * Math.sin(x * 7.4 + f.turn * 1.75)));
      s.screens.face(f, edge + .03, edge + paperWidth, bottom + .05, top - .06, d - depth + .07, .57, .34);
      for (let i = 1; i <= 3; i++) {
        s.wood.box(f, edge + paperWidth / 2, bottom + height * i / 4, d - depth + .085,
          paperWidth, .024, .025, .8);
      }
    }
    const bars = kind === 'gallery' ? Math.round(w / .52) : Math.max(1, Math.floor(openWidth / .34));
    for (let n = 1; n <= bars; n++) {
      s.wood.box(f, edge + w - openWidth + openWidth * n / (bars + 1), middle, d - depth * .65,
        kind === 'gallery' ? .052 : .038, height - .042, .044);
    }
    if (kind === 'gallery') {
      s.wood.box(f, x, bottom + height * .68, d - .16, w, .045, .05);
    }
  }
  s.trim.box(f, x, bottom - .025, d + .008, w + .10, .058, .113, .94);
}

function wallSurface(s: Skins, f: Face, w: number, d: number, bottom: number, top: number, openings: Opening[]) {
  const cuts = new Set([bottom, top, top - .22, top - .66, bottom + .16]);
  for (const opening of openings) {
    cuts.add(opening.bottom);
    cuts.add(opening.top);
  }
  const levels = Array.from(cuts).filter(y => y >= bottom && y <= top).sort((a, b) => a - b);
  const sorted = openings.slice().sort((a, b) => a.x - b.x);
  const runoff = sorted.filter(o => o.kind !== 'gallery' && o.kind !== 'door').flatMap(o =>
    [-1, 1].map(sign => ({ x: o.x + sign * o.width * .48, y: o.bottom,
      width: .075 + .048 * (1 + Math.cos(o.x + sign * 23)),
      length: .31 + .21 * (1 + Math.sin(o.x * 17.2 + sign * 3.12)),
      value: o.kind === 'slit' ? .065 : .185 })));
  const shade = (x: number, y: number) => {
    const belowEave = Math.max(0, top - y);
    const streaks = Math.max(0, Math.sin(x * 2.7 + .7 * Math.cos(x * 4.2 + top))) ** 3;
    let result = .97 - (.32 + .085 * streaks) * Math.exp(-belowEave * 1.39)
      - (.095 + .04 * Math.sin(x * 1.5)) * Math.exp(-Math.max(0, y - bottom) * 2.9);
    for (const drip of runoff) {
      const dy = drip.y - y, dx = Math.abs(drip.x - x);
      if (dy < 0 || dy > 2 || dx > .44) continue;
      result -= drip.value * Math.exp(-(dx * dx) / (drip.width * drip.width) - dy / drip.length);
    }
    return result;
  };
  const panel = (left: number, right: number, a: number, b: number) => {
    const sampleX = (u: number) => mix(left, right, u), sampleY = (v: number) => mix(a, b, v);
    s.plaster.patch(f, Math.max(1, Math.ceil((right - left) / .25)), Math.max(1, Math.ceil((b - a) / .29)),
      (u, v) => [sampleX(u), sampleY(v), d],
      (u, v) => [sampleX(u) / 4.4 + f.turn * .31, sampleY(v) / 4.4 + f.turn * .19],
      (u, v) => shade(sampleX(u), sampleY(v)));
  };
  for (let k = 1; k < levels.length; k++) {
    const a = levels[k - 1], b = levels[k];
    let left = -w;
    for (const o of sorted) {
      if ((a + b) / 2 <= o.bottom || (a + b) / 2 >= o.top) continue;
      if (o.x - o.width / 2 > left)
        panel(left, o.x - o.width / 2, a, b);
      left = o.x + o.width / 2;
    }
    if (left < w) panel(left, w, a, b);
  }
  for (const o of sorted) windowDetails(s, f, d, o);
}

function storey(s: Skins, index: number) {
  const r = roofs[index];
  const prev = roofs[index - 1];
  const inset = index === 5 ? -.42 : .035;
  const hx = prev ? prev.innerX + inset : 14;
  const hz = prev ? prev.innerZ + inset : 12;
  const bottom = prev ? prev.eave + prev.rise - .05 : 0;
  const top = r.eave;
  for (let side = 0; side < 4; side++) {
    const f = { ...centerFace, turn: side };
    const w = side % 2 ? hz : hx, d = side % 2 ? hx : hz;
    const openings: Opening[] = [];
    if (index < 4) {
      const count = Math.floor(w * 2 / 1.55);
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * ((w * 2 - 1) / count);
        if (index === 0 && side === 2 && Math.abs(x + 4.1) < 1.22) continue;
        openings.push({ x, width: .13, bottom: bottom + .39, top: bottom + .70, kind: 'slit' });
      }
    }
    if (index === 0 && side === 2)
      openings.push({ x: -4.1, width: 1.82, bottom, top: bottom + 2.16, kind: 'door' });
    if (index >= 1) {
      const isGallery = index === 5;
      const count = Math.max(2, Math.floor(w * 2 / (isGallery ? 2 : 4.05)));
      const spacing = (w * 2 - (isGallery ? .44 : .80)) / count;
      const bottomWindow = isGallery ? bottom + .22 : bottom + (index === 1 ? .82 : .92);
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * spacing;
        const open = (i * 7 + side * 2 + index * 3) % 8 <= 1;
        openings.push({ x, width: spacing * (isGallery ? .85 : .62), bottom: bottomWindow,
          top: bottomWindow + (isGallery ? 1.75 : 1.09),
          kind: isGallery ? 'gallery' : open ? 'open' : 'shutter' });
      }
    }
    wallSurface(s, f, w, d, bottom, top, openings);
    // End the masonry inside the curved eave. A flat taller wall would poke through the roof.
    const outerD = side % 2 ? r.x : r.z, innerD = side % 2 ? r.innerX : r.innerZ;
    const outerW = side % 2 ? r.z : r.x, innerW = side % 2 ? r.innerZ : r.innerX;
    const roofDepth = (outerD - d) / (outerD - innerD);
    s.plaster.patch(f, Math.ceil(w * 2), 1, (u, v) => {
      const x = (u * 2 - 1) * w;
      const t = Math.min(roofDepth, (outerW - Math.abs(x)) / (outerW - innerW));
      const fraction = Math.min(1, Math.abs(x) / mix(outerW, innerW, t));
      const kick = r.lift * (.10 * fraction ** 2 + .90 * fraction ** 8) * (1 - .74 * t);
      return [x, top + v * (r.rise * (.46 * t + .54 * t * t) + kick - .038), d];
    }, (u, v) => [(u * 2 - 1) * w / 4.4 + f.turn * .31, (top + v * .25) / 4.4 + f.turn * .19], () => .63);
    if (index === 0) s.trim.box(f, 0, .135, d + .012, w * 2, .27, .10, .82);
  }
}

function dormer(s: Skins, side: number, x: number, halfWidth: number,
  rear: number, front: number, base: number, eave: number, rise: number) {
  const f = offsetFace({ ...centerFace, turn: side }, x, 0);
  const wallWidth = halfWidth - .43, wallFront = front - .34;
  s.trim.box(f, 0, base + .018, (rear + wallFront) / 2, wallWidth * 2 + .10, .23, wallFront - rear + .12, .9);
  for (const sign of [-1, 1]) {
    const side = offsetFace(f, sign * wallWidth, (rear + wallFront) / 2, sign === 1 ? 1 : 3);
    wallSurface(s, side, (wallFront - rear) / 2, 0, base + .10, eave + .11, []);
  }
  const holes: Opening[] = [{ x: 0, bottom: eave - 1.61, top: eave - .57, width: 1.92, kind: 'shutter' }];
  wallSurface(s, f, wallWidth, wallFront, base + .10, eave + .11, holes);
  for (let j = -2; j <= 2; j++) {
    s.trim.box(f, j * wallWidth * .41, base - .16, wallFront - .37, .23, .25, .83, .8);
    s.trim.box(f, j * wallWidth * .41, base - .285, wallFront - .57, .26, .12, .54, .76);
  }
  gabledRoof(s, { face: f, halfWidth, rear, front, y: eave, rise });
}

function gallery(s: Skins) {
  const y = roofs[4].eave + roofs[4].rise + .09;
  const x = 5.08, z = 4.10;
  s.trim.box(centerFace, 0, y - .12, 0, 2 * x + .22, .24, 2 * z + .22);
  s.wood.box(centerFace, 0, y + .018, 0, 2 * x + .12, .075, 2 * z + .12, .90);
  for (let side = 0; side < 4; side++) {
    const f = { ...centerFace, turn: side };
    const w = side % 2 ? z : x, d = side % 2 ? x : z;
    for (const height of [.22, .49, .91])
      s.wood.box(f, 0, y + height, d, w * 2 + .09, height === .91 ? .10 : .05, .09);
    const bays = Math.ceil(w * 2 / 1.23);
    for (let j = 0; j <= bays; j++) {
      const x = mix(-w, w, j / bays);
      s.wood.box(f, x, y + .50, d, .092, 1.01, .095);
      s.rolls.box(f, x, y + 1.035, d, .126, .073, .13, .91);
      if (j < bays) s.wood.box(f, x + w / bays, y + .56, d, .041, .70, .05);
    }
  }
}
const mix = THREE.MathUtils.lerp;

export function createKeep(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'White plaster tenshu';
  const skins = createSkins();
  for (let i = 0; i < roofs.length; i++) {
    storey(skins, i);
    hippedRoof(skins, roofs[i]);
  }
  dormer(skins, 0, -2.55, 3.89, 6.35, 12.72, 7.31, 11.72, 2.95);
  dormer(skins, 1, -1.55, 2.89, 7.22, 11.33, 11.76, 15.09, 2.33);
  dormer(skins, 2, 2.25, 3.45, 5.95, 12.58, 7.30, 11.60, 2.70);
  dormer(skins, 3, 1.38, 2.85, 6.20, 11.99, 11.61, 15.22, 2.39);
  gallery(skins);
  // The final irimoya has a rectangular hip below a true two-ended gabled ridge.
  skins.trim.box(centerFace, 0, 23.425, 0, 5.97, .095, 6.00, .76);
  gabledRoof(skins, { face: centerFace, halfWidth: 2.99,
    rear: -3.01, front: 3.01, y: 23.51, rise: 1.93, upper: true });
  for (const skin of Object.values(skins)) skin.finish(group);
  return group;
}
