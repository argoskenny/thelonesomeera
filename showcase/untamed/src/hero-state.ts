/** All scroll-owned properties are a pure function of this one normalized state. */
export const HERO_NEAR_DEPTH = 4.8;
export const clamp01 = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export function smoothRange(value: number, start: number, end: number) {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
export function sampleJourney(progress: number, mobile = false) {
  const p = clamp01(progress);
  const travel = smoothRange(p, 0, 1);
  return {
    progress: p,
    travel: travel * (mobile ? 2.25 : 2.85),
    turn: smoothRange(p, 0.08, 0.92),
    typeDeparture: smoothRange(p, 0.04, 0.64),
    typeOpacity: 1 - smoothRange(p, 0.1, 0.53),
    scriptOpacity: 1 - smoothRange(p, 0.06, 0.34),
    interfaceOpacity: 1 - smoothRange(p, 0, 0.17),
    entranceOpacity: 1 - smoothRange(p, 0, 0.105),
    threshold: smoothRange(p, 0.76, 1),
  };
}
/** UV y runs from the sky (0) to the riverbank (1). Distances are scene units. */
export function jungleDepth(u: number, y: number) {
  const ground = 47 - 36 * Math.pow(clamp01(y), 1.25);
  // A broad, gentle basin keeps the waterfall rigid while river rocks approach faster.
  const waterfall = Math.exp(
    -Math.pow((u - 0.727) / 0.11, 2) - Math.pow((y - 0.49) / 0.2, 2),
  );
  return ground + waterfall * 4;
}
export function coverFrame(width: number, height: number) {
  const mobile = width <= 700;
  const boxWidth = width * (mobile ? 1.25 : 1);
  const boxHeight = height * 1.12;
  const scale = Math.max(boxWidth / 1536, boxHeight / 1024);
  const imageWidth = 1536 * scale,
    imageHeight = 1024 * scale;
  return {
    width: imageWidth,
    height: imageHeight,
    left:
      (mobile ? -0.125 * width : 0) +
      (boxWidth - imageWidth) * (mobile ? 0.54 : 0.5),
    top: -0.06 * height + (boxHeight - imageHeight) * (mobile ? 0.5 : 0.52),
  };
}
