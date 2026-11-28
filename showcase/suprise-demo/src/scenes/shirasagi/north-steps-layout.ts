import type { Obstacle, WalkSurface } from '../../shared/types';

export const stairZ = -20.5;
export const stairWidth = 3.24;
export const lowerX = -19;
export const topY = 10.6;
export const doorZ = -12;
export const landingEndX = 5.72;
const rise = topY / 50;
const going = .385;

export interface StairSlab {
  from: number;
  to: number;
  y: number;
  landing: boolean;
}
export const treads: StairSlab[] = [];
let x = lowerX;
for (let step = 1; step <= 50; step++) {
  treads.push({ from: x, to: x + going, y: step * rise, landing: false });
  x += going;
  if (step === 25) {
    treads.push({ from: x, to: x + 2.23, y: step * rise, landing: true });
    x += 2.23;
  }
}
export const landingStartX = x;
treads.push({ from: x, to: landingEndX, y: topY, landing: true });

export function northAccessLayout(): { surfaces: WalkSurface[]; obstacles: Obstacle[] } {
  const north = stairZ - stairWidth / 2;
  const south = stairZ + stairWidth / 2;
  const span = landingEndX - lowerX;
  const surfaces: WalkSurface[] = [
    { x: (lowerX + landingEndX) / 2, z: stairZ, w: span, d: stairWidth, y: 0,
      heightAt: (px, pz) => {
        if (pz < north || pz > south || px < lowerX || px > landingEndX) return undefined;
        return treads.find(t => px < t.to)?.y ?? topY;
      } },
    { x: (landingStartX + landingEndX) / 2, z: (south + doorZ) / 2,
      w: landingEndX - landingStartX, d: doorZ - south, y: topY },
  ];
  const obstacles: Obstacle[] = [
    // The retaining piers extend to the ground. Leave clearance at the next tread's leading edge.
    ...treads.map(t => ({ x: (t.from + t.to) / 2, z: stairZ, w: t.to - t.from,
      d: stairWidth, h: t.y - .18 })),
    { x: (landingStartX + landingEndX) / 2, z: (south + doorZ) / 2,
      w: landingEndX - landingStartX, d: doorZ - south, h: topY - .18 },
    { x: (lowerX + landingEndX) / 2, z: north, w: span, d: .12, h: topY + 1.12 },
    { x: (lowerX + landingStartX) / 2, z: south, w: landingStartX - lowerX, d: .12, h: topY + 1.12 },
    { x: landingStartX, z: (south + doorZ) / 2, w: .12, d: doorZ - south, h: topY + 1.12 },
    { x: landingEndX, z: (north + doorZ) / 2, w: .12, d: doorZ - north, h: topY + 1.12 },
    { x: (landingStartX + landingEndX) / 2, z: doorZ + .04, w: landingEndX - landingStartX,
      d: .12, minY: topY - .2, h: topY + 2.4 },
  ];
  return { surfaces, obstacles };
}
