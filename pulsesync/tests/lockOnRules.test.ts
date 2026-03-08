import { describe, expect, it } from 'vitest';
import {
  canCollectLock,
  countLocksForTarget,
} from '@/game/gameplay/lockOnRules';

describe('lockOnRules', () => {
  it('counts locks per target inside a sequence', () => {
    expect(
      countLocksForTarget(
        [
          { targetId: 'a', order: 0 },
          { targetId: 'b', order: 1 },
          { targetId: 'a', order: 2 },
        ],
        'a',
      ),
    ).toBe(2);
  });

  it('rejects new locks when capacity or cooldown fails', () => {
    expect(
      canCollectLock({
        maxLocks: 8,
        queuedLocks: 8,
        targetQueuedLocks: 0,
        targetLockSlots: 2,
        elapsedSinceLastLockMs: 200,
        lockCooldownMs: 90,
      }),
    ).toBe(false);

    expect(
      canCollectLock({
        maxLocks: 8,
        queuedLocks: 2,
        targetQueuedLocks: 1,
        targetLockSlots: 2,
        elapsedSinceLastLockMs: 40,
        lockCooldownMs: 90,
      }),
    ).toBe(false);
  });

  it('allows a lock when there is room and cooldown elapsed', () => {
    expect(
      canCollectLock({
        maxLocks: 8,
        queuedLocks: 2,
        targetQueuedLocks: 1,
        targetLockSlots: 2,
        elapsedSinceLastLockMs: 120,
        lockCooldownMs: 90,
      }),
    ).toBe(true);
  });
});
