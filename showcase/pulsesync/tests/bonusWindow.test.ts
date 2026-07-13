import { describe, expect, it } from 'vitest';
import {
  evaluateBeatWindow,
  getBeatPhase,
} from '@/game/gameplay/bonusWindow';

describe('bonusWindow', () => {
  it('detects a perfect beat-aligned action', () => {
    const evaluation = evaluateBeatWindow(1, 120, 0.16);
    expect(evaluation.inWindow).toBe(true);
    expect(evaluation.perfect).toBe(true);
  });

  it('rejects actions far from the beat', () => {
    const evaluation = evaluateBeatWindow(1.25, 120, 0.1);
    expect(evaluation.inWindow).toBe(false);
    expect(evaluation.multiplier).toBe(1);
  });

  it('wraps beat phase inside the unit interval', () => {
    expect(getBeatPhase(2.75, 120)).toBeCloseTo(0.5, 5);
  });
});
