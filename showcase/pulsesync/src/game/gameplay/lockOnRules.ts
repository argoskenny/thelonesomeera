import type { LockToken } from '@/game/types/GameTypes';

export interface LockAcquisitionParams {
  maxLocks: number;
  queuedLocks: number;
  targetQueuedLocks: number;
  targetLockSlots: number;
  elapsedSinceLastLockMs: number;
  lockCooldownMs: number;
}

export function countLocksForTarget(
  sequence: ReadonlyArray<LockToken>,
  targetId: string,
): number {
  return sequence.reduce(
    (total, token) => total + (token.targetId === targetId ? 1 : 0),
    0,
  );
}

export function canCollectLock(params: LockAcquisitionParams): boolean {
  if (params.queuedLocks >= params.maxLocks) {
    return false;
  }

  if (params.targetQueuedLocks >= params.targetLockSlots) {
    return false;
  }

  return params.elapsedSinceLastLockMs >= params.lockCooldownMs;
}
