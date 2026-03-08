import type { ToneModule } from '@/game/systems/toneRuntime';
import type { BeatGrid, MusicLayer, PhaseKey, SyncTier } from '@/game/types/GameTypes';

export interface ProceduralBGMRuntime {
  onLayerChange(layer: MusicLayer, enabled: boolean): void;
  onPhaseChange(phase: PhaseKey): void;
  onSyncChange(tier: SyncTier): void;
  onPhrase(): void;
  onSixteenth(time: number): void;
  onBar(time: number): void;
  dispose(): void;
}

export interface ProceduralBGMSongContext {
  Tone: ToneModule;
  beatGrid: BeatGrid;
}

export interface ProceduralBGMSongDefinition {
  id: string;
  title: string;
  description: string;
  bpm: number;
  createRuntime(context: ProceduralBGMSongContext): ProceduralBGMRuntime;
}
