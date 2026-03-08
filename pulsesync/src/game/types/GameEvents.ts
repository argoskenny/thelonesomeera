import type {
  BeatGrid,
  BossCue,
  ComboState,
  EnemyType,
  LevelPhase,
  MusicCue,
  PhaseCue,
  SpawnCue,
  SyncState,
  VisualCue,
} from '@/game/types/GameTypes';

export interface BeatEventPayload {
  index: number;
  at: number;
  grid: BeatGrid;
}

export interface SpawnRequestPayload {
  cue: SpawnCue;
}

export interface PhaseChangedPayload {
  cue: PhaseCue;
  phase: LevelPhase;
}

export interface MusicLayerPayload {
  cue: MusicCue;
}

export interface VisualThemePayload {
  cue: VisualCue;
}

export interface BossCommandPayload {
  cue: BossCue;
}

export interface LockEventPayload {
  targetId: string;
  x: number;
  y: number;
  order: number;
}

export interface HitEventPayload {
  targetId: string;
  owner: 'enemy' | 'boss';
  enemyType?: EnemyType;
  x: number;
  y: number;
  damage: number;
  destroyed: boolean;
  onBeat: boolean;
}

export interface IntegrityPayload {
  value: number;
  delta: number;
}

export interface BurstPayload {
  perfect: boolean;
  targets: number;
}

export interface GameEventMap {
  'beat:quarter': BeatEventPayload;
  'beat:half': BeatEventPayload;
  'beat:beat': BeatEventPayload;
  'beat:bar': BeatEventPayload;
  'beat:phrase': BeatEventPayload;
  'timeline:spawn': SpawnRequestPayload;
  'timeline:phase': PhaseChangedPayload;
  'timeline:music': MusicLayerPayload;
  'timeline:visual': VisualThemePayload;
  'timeline:boss': BossCommandPayload;
  'lock:acquired': LockEventPayload;
  'lock:released': { count: number };
  'projectile:fired': { targetId: string };
  'enemy:hit': HitEventPayload;
  'enemy:destroyed': HitEventPayload;
  'combo:changed': ComboState;
  'sync:changed': SyncState;
  'burst:used': BurstPayload;
  'burst:cooldown': { readyIn: number };
  'integrity:changed': IntegrityPayload;
  'player:explode': { x: number; y: number };
}
