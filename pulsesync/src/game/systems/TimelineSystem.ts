import type { GameEventMap } from '@/game/types/GameEvents';
import type { LevelDefinition, LevelPhase } from '@/game/types/GameTypes';
import { EventBus } from '@/game/systems/EventBus';

export class TimelineSystem {
  private cueIndex = 0;

  constructor(
    private readonly level: LevelDefinition,
    private readonly bus: EventBus<GameEventMap>,
  ) {}

  reset(): void {
    this.cueIndex = 0;
  }

  getPhaseAtTime(elapsedSeconds: number): LevelPhase {
    const beatDuration = 60 / this.level.beatGrid.bpm;
    const currentBar = elapsedSeconds / (beatDuration * this.level.beatGrid.beatsPerBar);

    const phase =
      this.level.phases.find(
        (candidate) =>
          currentBar >= candidate.startBar && currentBar < candidate.endBar,
      ) ?? this.level.phases[this.level.phases.length - 1];

    return phase;
  }

  update(elapsedSeconds: number): void {
    while (
      this.cueIndex < this.level.cues.length &&
      this.level.cues[this.cueIndex].at <= elapsedSeconds + 0.0001
    ) {
      const cue = this.level.cues[this.cueIndex];

      switch (cue.kind) {
        case 'spawn':
          this.bus.emit('timeline:spawn', { cue });
          break;
        case 'phase': {
          const phase = this.level.phases.find(
            (candidate) => candidate.key === cue.phase,
          );
          if (phase) {
            this.bus.emit('timeline:phase', { cue, phase });
          }
          break;
        }
        case 'music':
          this.bus.emit('timeline:music', { cue });
          break;
        case 'visual':
          this.bus.emit('timeline:visual', { cue });
          break;
        case 'boss':
          this.bus.emit('timeline:boss', { cue });
          break;
      }

      this.cueIndex += 1;
    }
  }
}
