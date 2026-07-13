export type PhaseKey =
  | 'boot'
  | 'tutorial'
  | 'build'
  | 'climax'
  | 'boss'
  | 'outro';

export type PaletteKey =
  | 'boot'
  | 'primer'
  | 'cascade'
  | 'overclock'
  | 'eden'
  | 'clean';

export type EnemyType =
  | 'pulse-drone'
  | 'shield-node'
  | 'chain-cluster'
  | 'sniper-sigil'
  | 'distortion-mine';

export type MusicLayer = string;
export type SyncTier = 'dormant' | 'aligned' | 'surge' | 'overdrive';

export interface BeatGrid {
  bpm: number;
  beatsPerBar: number;
  phraseBars: number;
}

export interface LevelPhase {
  key: PhaseKey;
  label: string;
  startBar: number;
  endBar: number;
  paletteKey: PaletteKey;
  intensity: number;
}

export interface SpawnCue {
  id: string;
  at: number;
  kind: 'spawn';
  enemyType: EnemyType;
  lane: number;
  count?: number;
  spacing?: number;
  speedScale?: number;
  hpScale?: number;
  drift?: number;
  phaseOffset?: number;
  clusterId?: string;
}

export interface PhaseCue {
  id: string;
  at: number;
  kind: 'phase';
  phase: PhaseKey;
}

export interface MusicCue {
  id: string;
  at: number;
  kind: 'music';
  layer: MusicLayer;
  enabled: boolean;
}

export interface BossCue {
  id: string;
  at: number;
  kind: 'boss';
  command: 'start' | 'phase' | 'end';
  phase?: 1 | 2 | 3;
}

export interface VisualCue {
  id: string;
  at: number;
  kind: 'visual';
  palette: PaletteKey;
}

export type TimelineCue = SpawnCue | PhaseCue | MusicCue | BossCue | VisualCue;

export interface LevelDefinition {
  id: string;
  title: string;
  summary: string;
  beatGrid: BeatGrid;
  totalBars: number;
  phases: LevelPhase[];
  cues: TimelineCue[];
}

export interface EnemyArchetype {
  type: EnemyType;
  label: string;
  maxHp: number;
  scoreValue: number;
  radius: number;
  speed: number;
  lockSlots: number;
  threat: number;
  chargeDuration?: number;
}

export interface LockToken {
  targetId: string;
  order: number;
}

export interface ComboState {
  combo: number;
  maxCombo: number;
  score: number;
  hits: number;
  kills: number;
  multiplier: number;
}

export interface SyncState {
  gauge: number;
  tier: SyncTier;
  intensity: number;
}

export interface ResultSummary {
  score: number;
  maxCombo: number;
  hits: number;
  kills: number;
  syncPeak: SyncTier;
  integrityLeft: number;
  levelTitle: string;
  cleared: boolean;
}
