/** Seeded botanical geometry: vein segments and bioluminescent spores share a skeleton. */
export type FernData = {
  positions: Float32Array;
  colors: Float32Array;
  spores: Float32Array;
};
export function generateFern(
  complexity: number,
  seed: number,
  mode = 0,
): FernData {
  complexity = Math.max(
    0.15,
    Math.min(1, Number.isFinite(complexity) ? complexity : 0.75),
  );
  let randomState = seed | 0;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) | 0;
    return (randomState >>> 0) / 4294967296;
  };
  const positions: number[] = [],
    colors: number[] = [],
    spores: number[] = [];
  type V = [number, number, number];
  const segment = (a: V, b: V, brightness = 1) => {
    positions.push(...a, ...b);
    const tint = 0.65 + random() * 0.35;
    for (let k = 0; k < 2; k++)
      colors.push(
        0.56 * brightness * tint,
        0.65 * brightness * tint,
        0.3 * brightness * tint,
      );
  };
  const fronds = mode === 1 ? 6 : 5;
  for (let f = 0; f < fronds; f++) {
    const main = f === 0;
    const scale = main ? 1 : 0.42 + random() * 0.3;
    const angle = main ? -0.12 : (f % 2 ? -1 : 1) * (0.25 + f * 0.16);
    const depth = main ? 0 : (random() - 0.5) * 1.4;
    const transform = (p: V): V => [
      p[0] * Math.cos(angle) * scale - p[1] * Math.sin(angle) * scale - 0.25,
      p[0] * Math.sin(angle) * scale + p[1] * Math.cos(angle) * scale - 2.6,
      p[2] * scale + depth,
    ];
    const stem = (t: number): V => {
      if (t < 0.76)
        return [Math.sin(t * 2.6) * 0.9, t * 6, 0.2 * Math.sin(t * 3)];
      const a = ((t - 0.76) / 0.24) * Math.PI * 1.68;
      const r = 0.78 * (1 - ((t - 0.76) / 0.24) * 0.7);
      return [0.8 - r + Math.cos(a) * r, 4.56 + Math.sin(a) * r, 0.14];
    };
    const stemCount = 130;
    for (let j = 1; j <= stemCount; j++)
      segment(
        transform(stem((j - 1) / stemCount)),
        transform(stem(j / stemCount)),
        1.15,
      );
    const pairs = Math.round(18 + complexity * 19);
    for (let j = 2; j < pairs; j++) {
      const t = (j / pairs) * 0.96;
      const root = stem(t);
      const before = stem(Math.max(0, t - 0.003)),
        after = stem(Math.min(1, t + 0.003));
      const dx = after[0] - before[0],
        dy = after[1] - before[1],
        len = Math.hypot(dx, dy) || 1;
      const taper = Math.pow(Math.sin(t * Math.PI), 0.85) * (1 - t * 0.58);
      for (const side of [-1, 1]) {
        const leafLength = (1.7 + random() * 0.25) * taper;
        const direction: V = [
          ((side * dy) / len) * 0.92 + (dx / len) * 0.34,
          ((-side * dx) / len) * 0.92 + (dy / len) * 0.34,
          0.15 * Math.sin(j + f),
        ];
        const leaf = (u: number): V => [
          root[0] + direction[0] * leafLength * u,
          root[1] +
            direction[1] * leafLength * u +
            Math.sin(u * Math.PI) * 0.08,
          root[2] + direction[2] * u + 0.22 * Math.sin(u * Math.PI),
        ];
        const divisions = Math.round(11 + complexity * 9);
        for (let k = 1; k <= divisions; k++) {
          const u = k / divisions;
          const point = leaf(u);
          segment(transform(leaf((k - 1) / divisions)), transform(point), 0.82);
          if (k % 3 === 0) spores.push(...transform(point));
          for (const directionSide of [-1, 1]) {
            const branchSize =
              leafLength *
              0.16 *
              Math.sin(u * Math.PI) *
              (0.85 + random() * 0.3);
            const tip: V = [
              point[0] +
                (-direction[1] * directionSide + direction[0] * 0.5) *
                  branchSize,
              point[1] +
                (direction[0] * directionSide + direction[1] * 0.5) *
                  branchSize,
              point[2] + 0.07,
            ];
            let prev = point;
            for (let v = 1; v <= 4; v++) {
              const r = v / 4;
              const end: V = [
                point[0] + (tip[0] - point[0]) * r,
                point[1] +
                  (tip[1] - point[1]) * r +
                  Math.sin(r * Math.PI) * 0.025,
                point[2] + (tip[2] - point[2]) * r,
              ];
              segment(transform(prev), transform(end), 0.56);
              prev = end;
            }
            if (random() > 0.55) spores.push(...transform(tip));
          }
        }
      }
    }
  }
  if (mode === 2) {
    for (let i = 0; i < 2200; i++) {
      const theta = random() * Math.PI * 2,
        r = Math.pow(random(), 0.5) * 3.1;
      spores.push(
        Math.cos(theta) * r,
        (random() - 0.5) * 6,
        Math.sin(theta) * r * 0.45,
      );
    }
  }
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    spores: new Float32Array(spores),
  };
}
