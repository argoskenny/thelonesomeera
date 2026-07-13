import type { BeatGrid } from '@/game/types/GameTypes';

export type BeatChannel = 'quarter' | 'half' | 'beat' | 'bar' | 'phrase';

export interface BeatTransition {
  channel: BeatChannel;
  index: number;
  at: number;
}

export interface BeatSnapshot {
  elapsedSeconds: number;
  beatIndex: number;
  barIndex: number;
  phraseIndex: number;
  beatPhase: number;
}

function collectTransitions(
  previousSeconds: number,
  currentSeconds: number,
  duration: number,
  channel: BeatChannel,
): BeatTransition[] {
  if (currentSeconds < previousSeconds || duration <= 0) {
    return [];
  }

  const previousIndex = Math.floor(previousSeconds / duration);
  const currentIndex = Math.floor(currentSeconds / duration);
  const transitions: BeatTransition[] = [];

  for (let index = previousIndex + 1; index <= currentIndex; index += 1) {
    transitions.push({
      channel,
      index,
      at: index * duration,
    });
  }

  return transitions;
}

export function scanBeatTransitions(
  previousSeconds: number,
  currentSeconds: number,
  grid: BeatGrid,
): BeatTransition[] {
  const beatDuration = 60 / grid.bpm;
  const halfDuration = beatDuration / 2;
  const quarterDuration = beatDuration / 4;
  const barDuration = beatDuration * grid.beatsPerBar;
  const phraseDuration = barDuration * grid.phraseBars;

  return [
    ...collectTransitions(previousSeconds, currentSeconds, quarterDuration, 'quarter'),
    ...collectTransitions(previousSeconds, currentSeconds, halfDuration, 'half'),
    ...collectTransitions(previousSeconds, currentSeconds, beatDuration, 'beat'),
    ...collectTransitions(previousSeconds, currentSeconds, barDuration, 'bar'),
    ...collectTransitions(previousSeconds, currentSeconds, phraseDuration, 'phrase'),
  ].sort((left, right) => left.at - right.at);
}

export function getBeatSnapshot(
  elapsedSeconds: number,
  grid: BeatGrid,
): BeatSnapshot {
  const beatDuration = 60 / grid.bpm;
  const barDuration = beatDuration * grid.beatsPerBar;
  const phraseDuration = barDuration * grid.phraseBars;

  return {
    elapsedSeconds,
    beatIndex: Math.floor(elapsedSeconds / beatDuration),
    barIndex: Math.floor(elapsedSeconds / barDuration),
    phraseIndex: Math.floor(elapsedSeconds / phraseDuration),
    beatPhase: (elapsedSeconds / beatDuration) % 1,
  };
}
