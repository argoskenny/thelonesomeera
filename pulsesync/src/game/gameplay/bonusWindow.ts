import { wrap } from '@/game/utils/math';

export interface BeatWindowEvaluation {
  beatPhase: number;
  distanceToBeat: number;
  inWindow: boolean;
  perfect: boolean;
  multiplier: number;
}

export function getBeatPhase(elapsedSeconds: number, bpm: number): number {
  const beatDuration = 60 / bpm;
  return wrap(elapsedSeconds / beatDuration, 1);
}

export function evaluateBeatWindow(
  elapsedSeconds: number,
  bpm: number,
  window = 0.16,
): BeatWindowEvaluation {
  const beatPhase = getBeatPhase(elapsedSeconds, bpm);
  const distanceToBeat = Math.min(beatPhase, 1 - beatPhase);
  const inWindow = distanceToBeat <= window;
  const perfect = distanceToBeat <= window * 0.42;

  return {
    beatPhase,
    distanceToBeat,
    inWindow,
    perfect,
    multiplier: perfect ? 1.5 : inWindow ? 1.18 : 1,
  };
}
