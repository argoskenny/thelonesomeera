import { describe, expect, it } from 'vitest';
import {
  applyComboEvent,
  createInitialComboState,
} from '@/game/gameplay/comboLogic';
import {
  applySyncEvent,
  createInitialSyncState,
  getSyncTier,
} from '@/game/gameplay/syncLogic';

describe('comboLogic', () => {
  it('increments combo and score on hits and destroys', () => {
    const afterHit = applyComboEvent(createInitialComboState(), {
      type: 'hit',
      onBeat: true,
    });
    const afterDestroy = applyComboEvent(afterHit, {
      type: 'destroy',
      onBeat: true,
      scoreValue: 240,
    });

    expect(afterDestroy.combo).toBe(3);
    expect(afterDestroy.hits).toBe(1);
    expect(afterDestroy.kills).toBe(1);
    expect(afterDestroy.score).toBeGreaterThan(afterHit.score);
  });

  it('decays combo when the player misses', () => {
    const primed = applyComboEvent(createInitialComboState(), {
      type: 'bossPhaseClear',
      scoreValue: 100,
    });
    const afterMiss = applyComboEvent(primed, { type: 'miss' });
    expect(afterMiss.combo).toBeLessThan(primed.combo);
  });
});

describe('syncLogic', () => {
  it('promotes sync tiers with enough successful actions', () => {
    let state = createInitialSyncState();
    for (let index = 0; index < 6; index += 1) {
      state = applySyncEvent(state, {
        type: 'destroy',
        onBeat: true,
      });
    }

    expect(state.gauge).toBeGreaterThan(55);
    expect(getSyncTier(state.gauge)).toBe('surge');
  });

  it('penalizes mistimed bursts and damage', () => {
    let state = createInitialSyncState();
    state = applySyncEvent(state, { type: 'bossPhaseClear' });
    state = applySyncEvent(state, { type: 'damage' });
    state = applySyncEvent(state, {
      type: 'burst',
      perfect: false,
      targets: 0,
    });
    expect(state.gauge).toBeLessThan(10);
  });
});
