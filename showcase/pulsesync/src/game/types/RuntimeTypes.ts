import type { EnemyType } from '@/game/types/GameTypes';

export interface LockableTarget {
  id: string;
  owner: 'enemy' | 'boss';
  enemyType?: EnemyType;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  targetable: boolean;
  maxLocks: number;
  pendingLocks: number;
}

export interface DamageableTarget extends LockableTarget {
  hp: number;
  maxHp: number;
  scoreValue: number;
  color: number;
}

export interface DamageContext {
  amount: number;
  onBeat: boolean;
  source: 'projectile' | 'burst' | 'chain';
}

export interface DamageResult {
  target: DamageableTarget;
  destroyed: boolean;
  remainingHp: number;
  scoreValue: number;
  chain: boolean;
  phaseCleared?: boolean;
  bossDefeated?: boolean;
}

export interface BossHudState {
  active: boolean;
  phase: 1 | 2 | 3;
  health: number;
  maxHealth: number;
  label: string;
}
