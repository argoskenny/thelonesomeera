import { describe, expect, it } from 'vitest';
import { DEMO_LEVEL } from '@/game/content/beatmaps/DemoBeatmap';
import {
  loadBeatmap,
  validateBeatmap,
} from '@/game/content/beatmaps/beatmapLoader';
import type { BossCue } from '@/game/types/GameTypes';

describe('beatmapLoader', () => {
  it('loads the demo beatmap without validation issues', () => {
    expect(validateBeatmap(DEMO_LEVEL)).toEqual([]);
    expect(DEMO_LEVEL.cues[0].kind).toBe('phase');
    expect(DEMO_LEVEL.phases[0].key).toBe('boot');
  });

  it('sorts cues before validation', () => {
    const loaded = loadBeatmap({
      ...DEMO_LEVEL,
      id: 'sorted-check',
      cues: [...DEMO_LEVEL.cues].reverse(),
    });

    expect(loaded.cues[0].at).toBeLessThanOrEqual(loaded.cues[1].at);
  });

  it('does not force boss progression from the timeline', () => {
    const bossCues = DEMO_LEVEL.cues.filter((cue): cue is BossCue => cue.kind === 'boss');

    expect(DEMO_LEVEL.phases.at(-1)?.key).toBe('boss');
    expect(bossCues).toHaveLength(1);
    expect(bossCues[0]).toMatchObject({
      id: 'boss-start',
      command: 'start',
    });
  });
});
