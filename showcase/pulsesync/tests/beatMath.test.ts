import { describe, expect, it } from 'vitest';
import { getBeatSnapshot, scanBeatTransitions } from '@/game/systems/beatMath';

const GRID = {
  bpm: 120,
  beatsPerBar: 4,
  phraseBars: 4,
};

describe('beatMath', () => {
  it('emits subdivision transitions between timestamps', () => {
    const transitions = scanBeatTransitions(0.24, 1.01, GRID);
    expect(transitions.filter((entry) => entry.channel === 'beat').map((entry) => entry.index)).toEqual([1, 2]);
    expect(transitions.filter((entry) => entry.channel === 'bar').map((entry) => entry.index)).toEqual([]);
    expect(transitions.filter((entry) => entry.channel === 'half').length).toBe(4);
  });

  it('builds a stable snapshot from elapsed seconds', () => {
    const snapshot = getBeatSnapshot(8.25, GRID);
    expect(snapshot.beatIndex).toBe(16);
    expect(snapshot.barIndex).toBe(4);
    expect(snapshot.phraseIndex).toBe(1);
  });
});
