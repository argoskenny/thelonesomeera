export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function damp(current: number, target: number, lambda: number, delta: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * delta));
}

export function distanceSquared(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt(distanceSquared(ax, ay, bx, by));
}

export function wrap(value: number, max: number): number {
  return ((value % max) + max) % max;
}

export function secondsForBarBeat(
  bar: number,
  beatInBar: number,
  bpm: number,
  beatsPerBar = 4,
): number {
  const beatDuration = 60 / bpm;
  return (bar * beatsPerBar + beatInBar) * beatDuration;
}
