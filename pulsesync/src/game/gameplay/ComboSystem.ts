import type { GameEventMap } from '@/game/types/GameEvents';
import { EventBus } from '@/game/systems/EventBus';
import {
  applyComboEvent,
  createInitialComboState,
  type ComboEvent,
} from '@/game/gameplay/comboLogic';
import type { ComboState } from '@/game/types/GameTypes';

export class ComboSystem {
  private state: ComboState = createInitialComboState();

  constructor(private readonly bus: EventBus<GameEventMap>) {}

  reset(): void {
    this.state = createInitialComboState();
    this.bus.emit('combo:changed', this.state);
  }

  apply(event: ComboEvent): ComboState {
    this.state = applyComboEvent(this.state, event);
    this.bus.emit('combo:changed', this.state);
    return this.state;
  }

  getState(): ComboState {
    return this.state;
  }
}
