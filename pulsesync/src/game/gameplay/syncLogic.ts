import { clamp } from '@/game/utils/math';
import type { SyncState, SyncTier } from '@/game/types/GameTypes';

export type SyncEvent =
  | { type: 'hit'; onBeat: boolean }
  | { type: 'destroy'; onBeat: boolean; chain?: boolean }
  | { type: 'miss' }
  | { type: 'damage' }
  | { type: 'burst'; perfect: boolean; targets: number }
  | { type: 'bossPhaseClear' };

const TIER_THRESHOLDS: Record<SyncTier, number> = {
  dormant: 0,
  aligned: 25,
  surge: 55,
  overdrive: 85,
};

export function createInitialSyncState(): SyncState {
  return {
    gauge: 0,
    tier: 'dormant',
    intensity: 0,
  };
}

export function getSyncTier(gauge: number): SyncTier {
  if (gauge >= TIER_THRESHOLDS.overdrive) {
    return 'overdrive';
  }

  if (gauge >= TIER_THRESHOLDS.surge) {
    return 'surge';
  }

  if (gauge >= TIER_THRESHOLDS.aligned) {
    return 'aligned';
  }

  return 'dormant';
}

export function applySyncEvent(state: SyncState, event: SyncEvent): SyncState {
  let gauge = state.gauge;

  switch (event.type) {
    case 'hit': {
      gauge += event.onBeat ? 6 : 4;
      break;
    }
    case 'destroy': {
      gauge += event.chain ? 10 : 8;
      gauge += event.onBeat ? 3 : 0;
      break;
    }
    case 'miss': {
      gauge -= 10;
      break;
    }
    case 'damage': {
      gauge -= 16;
      break;
    }
    case 'burst': {
      gauge += event.perfect ? 12 : -4;
      gauge += event.perfect ? Math.min(10, event.targets * 2) : 0;
      break;
    }
    case 'bossPhaseClear': {
      gauge += 14;
      break;
    }
  }

  gauge = clamp(gauge, 0, 100);
  const tier = getSyncTier(gauge);

  return {
    gauge,
    tier,
    intensity: gauge / 100,
  };
}
