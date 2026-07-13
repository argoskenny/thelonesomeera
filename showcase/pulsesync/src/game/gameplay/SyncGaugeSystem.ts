import type { GameEventMap } from '@/game/types/GameEvents';
import { EventBus } from '@/game/systems/EventBus';
import {
  applySyncEvent,
  createInitialSyncState,
  type SyncEvent,
} from '@/game/gameplay/syncLogic';
import type { SyncState, SyncTier } from '@/game/types/GameTypes';

export class SyncGaugeSystem {
  private state: SyncState = createInitialSyncState();
  private peakTier: SyncTier = 'dormant';

  constructor(private readonly bus: EventBus<GameEventMap>) {}

  reset(): void {
    this.state = createInitialSyncState();
    this.peakTier = 'dormant';
    this.bus.emit('sync:changed', this.state);
  }

  apply(event: SyncEvent): SyncState {
    this.state = applySyncEvent(this.state, event);
    if (
      ['dormant', 'aligned', 'surge', 'overdrive'].indexOf(this.state.tier) >
      ['dormant', 'aligned', 'surge', 'overdrive'].indexOf(this.peakTier)
    ) {
      this.peakTier = this.state.tier;
    }
    this.bus.emit('sync:changed', this.state);
    return this.state;
  }

  getState(): SyncState {
    return this.state;
  }

  getPeakTier(): SyncTier {
    return this.peakTier;
  }
}
