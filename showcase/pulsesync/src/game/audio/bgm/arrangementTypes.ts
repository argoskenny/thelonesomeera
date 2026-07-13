import type { PhaseKey } from '@/game/types/GameTypes';

export type StepNote = string | null;

export interface SectionBarPattern {
  chord: string[];
  bass: StepNote[];
  arp: StepNote[];
  lead: StepNote[];
  kick: number[];
  snare: number[];
  hat: number[];
  openHat: number[];
  accent: number[];
}

export interface SongSection {
  motif: string;
  bars: SectionBarPattern[];
  fillSnare: number[];
  fillHat: number[];
  transitionChord: string[];
  transitionLead?: string[];
  energy: number;
}

export type PhaseArrangementMap = Record<PhaseKey, SongSection>;
