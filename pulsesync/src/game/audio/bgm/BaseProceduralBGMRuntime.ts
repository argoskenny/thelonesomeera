import type { ToneModule } from '@/game/systems/toneRuntime';
import type { BeatGrid, MusicLayer, PhaseKey, SyncTier } from '@/game/types/GameTypes';
import type { ProceduralBGMRuntime } from '@/game/audio/bgm/types';

export abstract class BaseProceduralBGMRuntime implements ProceduralBGMRuntime {
  protected readonly Tone: ToneModule;
  protected readonly beatGrid: BeatGrid;
  private readonly layers = new Map<string, boolean>();
  private readonly lastTriggerTimes: Record<string, number> = {};
  private currentPhase: PhaseKey = 'boot';
  private sixteenthIndex = 0;

  protected constructor(Tone: ToneModule, beatGrid: BeatGrid, initialLayers?: Record<string, boolean>) {
    this.Tone = Tone;
    this.beatGrid = beatGrid;
    Object.entries(initialLayers ?? {}).forEach(([layer, enabled]) => {
      this.layers.set(layer, enabled);
    });
  }

  onLayerChange(layer: MusicLayer, enabled: boolean): void {
    this.layers.set(layer, enabled);
  }

  onPhaseChange(phase: PhaseKey): void {
    this.currentPhase = phase;
  }

  onSyncChange(_tier: SyncTier): void {}

  onPhrase(): void {}

  onSixteenth(_time: number): void {
    this.sixteenthIndex += 1;
  }

  onBar(_time: number): void {}

  abstract dispose(): void;

  protected getCurrentPhase(): PhaseKey {
    return this.currentPhase;
  }

  protected isLayerEnabled(layer: string, fallback = false): boolean {
    return this.layers.get(layer) ?? fallback;
  }

  protected getSixteenthIndex(): number {
    return this.sixteenthIndex;
  }

  protected getStepsPerBar(): number {
    return this.beatGrid.beatsPerBar * 4;
  }

  protected getCurrentBarIndex(): number {
    return Math.floor(this.sixteenthIndex / this.getStepsPerBar());
  }

  protected getStepInBar(): number {
    return this.sixteenthIndex % this.getStepsPerBar();
  }

  protected advanceSixteenth(): void {
    this.sixteenthIndex += 1;
  }

  protected resetTransportCounters(): void {
    this.sixteenthIndex = 0;
    Object.keys(this.lastTriggerTimes).forEach((key) => {
      delete this.lastTriggerTimes[key];
    });
  }

  protected safeTriggerTime(instrument: string, time: number): number {
    const minimumGap = 0.0015;
    const previous = this.lastTriggerTimes[instrument] ?? -Infinity;
    const next = Math.max(time, previous + minimumGap);
    this.lastTriggerTimes[instrument] = next;
    return next;
  }
}
