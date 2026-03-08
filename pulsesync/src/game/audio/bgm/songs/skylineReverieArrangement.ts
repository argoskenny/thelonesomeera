import type { StepNote } from '@/game/audio/bgm/arrangementTypes';
import type { PhaseKey } from '@/game/types/GameTypes';

type StepChord = string[] | null;

export interface SkylineReverieBarPattern {
  chord: string[];
  sub: StepNote[];
  pluck: StepNote[];
  lead: StepNote[];
  vocal: StepChord[];
  kick: number[];
  snare: number[];
  hat: number[];
  openHat: number[];
  sparkle: number[];
}

export interface SkylineReverieSection {
  motif: string;
  bars: SkylineReverieBarPattern[];
  fillSnare: number[];
  fillHat: number[];
  transitionChord: string[];
  transitionLead?: string[];
  energy: number;
}

const REST = null;
const CHOP = (notes: string[]): StepChord => notes;

export const SKYLINE_REVERIE_ARRANGEMENTS: Record<PhaseKey, SkylineReverieSection> = {
  boot: {
    motif: 'Sunset boot glow',
    energy: 0.2,
    transitionChord: ['B3', 'D4', 'F#4', 'A4'],
    transitionLead: ['F#5', 'A5'],
    fillSnare: [0, 0, 0, 0, 0, 0, 0.08, 0, 0.12, 0, 0.16, 0, 0.2, 0.24, 0.28, 0.34],
    fillHat: [0.08, 0, 0.1, 0, 0.1, 0, 0.12, 0, 0.12, 0.14, 0.14, 0.16, 0.18, 0.2, 0.22, 0.24],
    bars: [
      {
        chord: ['B3', 'D4', 'F#4', 'A4'],
        sub: ['B1', REST, REST, REST, REST, REST, 'F#1', REST, 'B1', REST, REST, REST, REST, REST, 'A1', REST],
        pluck: [REST, 'D5', 'F#5', REST, 'A5', 'B5', 'A5', REST, 'F#5', 'A5', 'B5', REST, 'D6', 'B5', 'A5', 'F#5'],
        lead: Array(16).fill(REST),
        vocal: [REST, REST, CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'A5']), REST, CHOP(['A5', 'B5']), REST, REST, REST, CHOP(['F#5', 'A5']), REST, CHOP(['E5', 'F#5']), REST, CHOP(['D5', 'E5']), REST],
        kick: [0.76, 0, 0, 0, 0.12, 0, 0, 0, 0.46, 0, 0, 0, 0.1, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 0.38, 0, 0, 0, 0, 0, 0, 0],
        hat: [0.05, 0, 0.05, 0, 0.06, 0, 0.06, 0, 0.05, 0, 0.05, 0, 0.06, 0, 0.08, 0],
        openHat: Array(16).fill(0),
        sparkle: [0.12, 0, 0, 0, 0, 0, 0.08, 0, 0.14, 0, 0, 0, 0, 0, 0.1, 0],
      },
      {
        chord: ['G3', 'B3', 'D4', 'F#4'],
        sub: ['G1', REST, REST, REST, REST, REST, 'D1', REST, 'G1', REST, REST, REST, REST, REST, 'F#1', REST],
        pluck: [REST, 'B4', 'D5', REST, 'F#5', 'G5', 'F#5', REST, 'D5', 'F#5', 'G5', REST, 'B5', 'G5', 'F#5', 'D5'],
        lead: Array(16).fill(REST),
        vocal: [REST, REST, CHOP(['B4', 'D5']), REST, CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'G5']), REST, REST, REST, CHOP(['D5', 'F#5']), REST, CHOP(['C#5', 'D5']), REST, CHOP(['B4', 'C#5']), REST],
        kick: [0.72, 0, 0, 0, 0.12, 0, 0, 0, 0.44, 0, 0, 0, 0.1, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 0.36, 0, 0, 0, 0, 0, 0, 0],
        hat: [0.05, 0, 0.05, 0, 0.06, 0, 0.06, 0, 0.05, 0, 0.05, 0, 0.06, 0, 0.08, 0],
        openHat: Array(16).fill(0),
        sparkle: [0.12, 0, 0, 0, 0, 0, 0.08, 0, 0.14, 0, 0, 0, 0, 0, 0.1, 0],
      },
    ],
  },
  tutorial: {
    motif: 'Pastel boulevard drift',
    energy: 0.36,
    transitionChord: ['E4', 'G4', 'B4', 'D5'],
    transitionLead: ['B5', 'D6', 'F#6'],
    fillSnare: [0, 0, 0, 0, 0.08, 0, 0.1, 0, 0.14, 0, 0.18, 0, 0.24, 0.3, 0.38, 0.46],
    fillHat: [0.1, 0, 0.12, 0, 0.12, 0.1, 0.14, 0, 0.14, 0.12, 0.16, 0.14, 0.18, 0.22, 0.26, 0.3],
    bars: [
      {
        chord: ['B3', 'D4', 'F#4', 'A4'],
        sub: ['B1', REST, 'B1', REST, REST, 'F#1', REST, REST, 'B1', REST, REST, REST, REST, 'A1', REST, REST],
        pluck: ['F#5', 'A5', 'B5', REST, 'D6', 'B5', 'A5', REST, 'F#5', 'A5', 'B5', REST, 'E5', 'F#5', 'D5', REST],
        lead: [REST, REST, 'F#5', REST, 'A5', REST, 'B5', REST, 'A5', REST, 'F#5', REST, 'E5', REST, 'D5', REST],
        vocal: [CHOP(['F#5', 'A5']), REST, CHOP(['A5', 'B5']), REST, REST, REST, CHOP(['E5', 'F#5']), REST, CHOP(['F#5', 'A5']), REST, CHOP(['A5', 'B5']), REST, REST, REST, CHOP(['D5', 'E5']), REST],
        kick: [0.82, 0, 0.12, 0, 0.16, 0, 0, 0, 0.52, 0, 0.1, 0, 0.12, 0, 0, 0],
        snare: [0, 0, 0, 0, 0.08, 0, 0, 0, 0.52, 0, 0, 0, 0.08, 0, 0, 0],
        hat: [0.08, 0, 0.1, 0, 0.1, 0.08, 0.12, 0, 0.1, 0.08, 0.12, 0, 0.12, 0.1, 0.16, 0],
        openHat: [0, 0, 0, 0, 0, 0, 0, 0.12, 0, 0, 0, 0, 0, 0, 0, 0.16],
        sparkle: [0.16, 0, 0.08, 0, 0.1, 0, 0.12, 0, 0.18, 0, 0.1, 0, 0.12, 0, 0.16, 0],
      },
      {
        chord: ['D4', 'F#4', 'A4', 'C#5'],
        sub: ['D2', REST, 'D2', REST, REST, 'A1', REST, REST, 'D2', REST, REST, REST, REST, 'C#2', REST, REST],
        pluck: ['A5', 'C#6', 'D6', REST, 'F#6', 'D6', 'C#6', REST, 'A5', 'C#6', 'D6', REST, 'G5', 'F#5', 'E5', REST],
        lead: [REST, REST, 'A5', REST, 'C#6', REST, 'D6', REST, 'C#6', REST, 'A5', REST, 'G5', REST, 'F#5', REST],
        vocal: [CHOP(['A5', 'C#6']), REST, CHOP(['C#6', 'D6']), REST, REST, REST, CHOP(['G5', 'A5']), REST, CHOP(['A5', 'C#6']), REST, CHOP(['C#6', 'D6']), REST, REST, REST, CHOP(['F#5', 'G5']), REST],
        kick: [0.84, 0, 0.12, 0, 0.16, 0, 0, 0, 0.54, 0, 0.1, 0, 0.12, 0, 0, 0],
        snare: [0, 0, 0, 0, 0.08, 0, 0, 0, 0.54, 0, 0, 0, 0.08, 0, 0, 0],
        hat: [0.08, 0, 0.1, 0, 0.1, 0.08, 0.12, 0, 0.1, 0.08, 0.12, 0, 0.12, 0.1, 0.16, 0],
        openHat: [0, 0, 0, 0, 0, 0, 0, 0.12, 0, 0, 0, 0, 0, 0, 0, 0.16],
        sparkle: [0.16, 0, 0.08, 0, 0.1, 0, 0.12, 0, 0.18, 0, 0.1, 0, 0.12, 0, 0.16, 0],
      },
    ],
  },
  build: {
    motif: 'Skyline pulse bloom',
    energy: 0.58,
    transitionChord: ['G4', 'B4', 'D5', 'F#5'],
    transitionLead: ['D6', 'F#6', 'A6'],
    fillSnare: [0, 0, 0.08, 0, 0.1, 0.08, 0.12, 0.1, 0.16, 0.12, 0.2, 0.14, 0.26, 0.34, 0.44, 0.56],
    fillHat: [0.14, 0.08, 0.16, 0.1, 0.16, 0.12, 0.18, 0.12, 0.2, 0.14, 0.22, 0.16, 0.24, 0.28, 0.32, 0.36],
    bars: [
      {
        chord: ['B3', 'D4', 'F#4', 'A4'],
        sub: ['B1', REST, 'B1', REST, 'B1', REST, 'F#1', REST, 'B1', REST, 'A1', REST, 'F#1', REST, 'E1', REST],
        pluck: ['F#5', 'A5', 'B5', 'A5', 'D6', 'B5', 'A5', 'F#5', 'A5', 'B5', 'D6', 'B5', 'A5', 'F#5', 'E5', 'F#5'],
        lead: ['D6', REST, 'F#6', REST, 'A6', REST, 'B6', REST, 'A6', REST, 'F#6', REST, 'E6', REST, 'D6', REST],
        vocal: [CHOP(['F#5', 'A5']), REST, CHOP(['A5', 'B5']), REST, CHOP(['B5', 'D6']), REST, CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'A5']), REST, CHOP(['A5', 'B5']), REST, CHOP(['B5', 'D6']), REST, CHOP(['E5', 'F#5']), REST],
        kick: [0.86, 0, 0.16, 0, 0.2, 0, 0.12, 0, 0.54, 0, 0.14, 0, 0.18, 0, 0.1, 0],
        snare: [0, 0, 0.08, 0, 0.12, 0, 0, 0, 0.66, 0, 0.08, 0, 0.14, 0, 0, 0],
        hat: [0.16, 0.08, 0.18, 0.1, 0.16, 0.1, 0.2, 0.12, 0.16, 0.08, 0.18, 0.1, 0.18, 0.12, 0.24, 0.14],
        openHat: [0, 0, 0, 0.12, 0, 0, 0, 0.16, 0, 0, 0, 0.12, 0, 0, 0, 0.2],
        sparkle: [0.18, 0.08, 0.12, 0, 0.14, 0.1, 0.16, 0, 0.2, 0.08, 0.14, 0, 0.16, 0.1, 0.22, 0],
      },
      {
        chord: ['G3', 'B3', 'D4', 'F#4'],
        sub: ['G1', REST, 'G1', REST, 'G1', REST, 'D1', REST, 'G1', REST, 'F#1', REST, 'D1', REST, 'E1', REST],
        pluck: ['D5', 'F#5', 'G5', 'F#5', 'B5', 'G5', 'F#5', 'D5', 'F#5', 'G5', 'B5', 'G5', 'F#5', 'D5', 'C#5', 'D5'],
        lead: ['B5', REST, 'D6', REST, 'F#6', REST, 'G6', REST, 'F#6', REST, 'D6', REST, 'C#6', REST, 'B5', REST],
        vocal: [CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'G5']), REST, CHOP(['G5', 'B5']), REST, CHOP(['B4', 'D5']), REST, CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'G5']), REST, CHOP(['G5', 'B5']), REST, CHOP(['C#5', 'D5']), REST],
        kick: [0.84, 0, 0.16, 0, 0.2, 0, 0.12, 0, 0.52, 0, 0.14, 0, 0.18, 0, 0.1, 0],
        snare: [0, 0, 0.08, 0, 0.12, 0, 0, 0, 0.64, 0, 0.08, 0, 0.14, 0, 0, 0],
        hat: [0.16, 0.08, 0.18, 0.1, 0.16, 0.1, 0.2, 0.12, 0.16, 0.08, 0.18, 0.1, 0.18, 0.12, 0.24, 0.14],
        openHat: [0, 0, 0, 0.12, 0, 0, 0, 0.16, 0, 0, 0, 0.12, 0, 0, 0, 0.2],
        sparkle: [0.18, 0.08, 0.12, 0, 0.14, 0.1, 0.16, 0, 0.2, 0.08, 0.14, 0, 0.16, 0.1, 0.22, 0],
      },
    ],
  },
  climax: {
    motif: 'Neon horizon lift',
    energy: 0.84,
    transitionChord: ['E4', 'G4', 'B4', 'D5'],
    transitionLead: ['B5', 'D6', 'F#6', 'A6'],
    fillSnare: [0.08, 0, 0.1, 0.08, 0.12, 0.1, 0.14, 0.12, 0.18, 0.14, 0.22, 0.18, 0.28, 0.38, 0.5, 0.64],
    fillHat: [0.2, 0.12, 0.22, 0.14, 0.22, 0.16, 0.24, 0.16, 0.26, 0.18, 0.28, 0.2, 0.3, 0.34, 0.38, 0.44],
    bars: [
      {
        chord: ['E4', 'G4', 'B4', 'D5'],
        sub: ['E2', REST, 'E2', REST, 'E2', REST, 'B1', REST, 'E2', REST, 'D2', REST, 'B1', REST, 'A1', REST],
        pluck: ['B5', 'D6', 'E6', 'G6', 'E6', 'D6', 'B5', 'D6', 'G6', 'E6', 'D6', 'B5', 'A5', 'B5', 'D6', 'E6'],
        lead: ['G6', REST, 'B6', 'D7', 'B6', REST, 'D7', REST, 'B6', 'G6', 'F#6', REST, 'E6', 'F#6', 'G6', REST],
        vocal: [CHOP(['B5', 'D6']), REST, CHOP(['D6', 'E6']), REST, CHOP(['E6', 'G6']), REST, CHOP(['G5', 'B5']), REST, CHOP(['B5', 'D6']), REST, CHOP(['D6', 'E6']), REST, CHOP(['E6', 'G6']), REST, CHOP(['A5', 'B5']), REST],
        kick: [0.92, 0, 0.18, 0.08, 0.22, 0, 0.14, 0, 0.58, 0, 0.16, 0.08, 0.2, 0, 0.12, 0],
        snare: [0, 0, 0.1, 0.08, 0.16, 0, 0.08, 0, 0.72, 0, 0.1, 0.08, 0.18, 0, 0.08, 0],
        hat: [0.24, 0.14, 0.26, 0.16, 0.24, 0.16, 0.28, 0.18, 0.24, 0.14, 0.26, 0.16, 0.28, 0.18, 0.34, 0.22],
        openHat: [0, 0, 0.08, 0.16, 0, 0, 0.1, 0.18, 0, 0, 0.08, 0.16, 0, 0, 0.1, 0.24],
        sparkle: [0.22, 0.1, 0.14, 0.08, 0.18, 0.12, 0.2, 0.1, 0.24, 0.12, 0.18, 0.1, 0.2, 0.14, 0.28, 0.12],
      },
      {
        chord: ['D4', 'F#4', 'A4', 'C#5'],
        sub: ['D2', REST, 'D2', REST, 'D2', REST, 'A1', REST, 'D2', REST, 'C#2', REST, 'A1', REST, 'B1', REST],
        pluck: ['A5', 'C#6', 'D6', 'F#6', 'D6', 'C#6', 'A5', 'C#6', 'F#6', 'D6', 'C#6', 'A5', 'G5', 'A5', 'C#6', 'D6'],
        lead: ['F#6', REST, 'A6', 'C#7', 'A6', REST, 'C#7', REST, 'A6', 'F#6', 'E6', REST, 'D6', 'E6', 'F#6', REST],
        vocal: [CHOP(['A5', 'C#6']), REST, CHOP(['C#6', 'D6']), REST, CHOP(['D6', 'F#6']), REST, CHOP(['F#5', 'A5']), REST, CHOP(['A5', 'C#6']), REST, CHOP(['C#6', 'D6']), REST, CHOP(['D6', 'F#6']), REST, CHOP(['G5', 'A5']), REST],
        kick: [0.92, 0, 0.18, 0.08, 0.22, 0, 0.14, 0, 0.58, 0, 0.16, 0.08, 0.2, 0, 0.12, 0],
        snare: [0, 0, 0.1, 0.08, 0.16, 0, 0.08, 0, 0.74, 0, 0.1, 0.08, 0.18, 0, 0.08, 0],
        hat: [0.24, 0.14, 0.26, 0.16, 0.24, 0.16, 0.28, 0.18, 0.24, 0.14, 0.26, 0.16, 0.28, 0.18, 0.34, 0.22],
        openHat: [0, 0, 0.08, 0.16, 0, 0, 0.1, 0.18, 0, 0, 0.08, 0.16, 0, 0, 0.1, 0.24],
        sparkle: [0.22, 0.1, 0.14, 0.08, 0.18, 0.12, 0.2, 0.1, 0.24, 0.12, 0.18, 0.1, 0.2, 0.14, 0.28, 0.12],
      },
    ],
  },
  boss: {
    motif: 'Afterglow rush',
    energy: 0.96,
    transitionChord: ['B4', 'D5', 'F#5', 'A5'],
    transitionLead: ['F#6', 'A6', 'B6', 'D7'],
    fillSnare: [0.12, 0.08, 0.14, 0.1, 0.18, 0.12, 0.2, 0.14, 0.24, 0.18, 0.28, 0.22, 0.36, 0.46, 0.58, 0.72],
    fillHat: [0.24, 0.16, 0.26, 0.18, 0.28, 0.2, 0.3, 0.22, 0.32, 0.24, 0.34, 0.26, 0.36, 0.4, 0.44, 0.5],
    bars: [
      {
        chord: ['B3', 'D4', 'F#4', 'A4'],
        sub: ['B1', REST, 'B1', REST, 'B1', REST, 'F#1', REST, 'B1', REST, 'A1', REST, 'F#1', REST, 'E1', REST],
        pluck: ['F#5', 'A5', 'B5', 'D6', 'B5', 'A5', 'F#5', 'A5', 'D6', 'B5', 'A5', 'F#5', 'E5', 'F#5', 'A5', 'B5'],
        lead: ['D6', REST, 'F#6', 'A6', 'B6', REST, 'A6', REST, 'B6', 'A6', 'F#6', REST, 'E6', 'F#6', 'A6', REST],
        vocal: [CHOP(['F#5', 'A5']), REST, CHOP(['A5', 'B5']), REST, CHOP(['B5', 'D6']), REST, CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'A5']), REST, CHOP(['A5', 'B5']), REST, CHOP(['B5', 'D6']), REST, CHOP(['E5', 'F#5']), REST],
        kick: [0.96, 0, 0.2, 0.08, 0.24, 0, 0.16, 0.08, 0.62, 0, 0.18, 0.08, 0.22, 0, 0.14, 0.08],
        snare: [0, 0, 0.12, 0.08, 0.18, 0, 0.1, 0.08, 0.8, 0, 0.12, 0.08, 0.2, 0, 0.1, 0.08],
        hat: [0.28, 0.18, 0.3, 0.2, 0.28, 0.2, 0.32, 0.22, 0.28, 0.18, 0.3, 0.2, 0.32, 0.22, 0.38, 0.26],
        openHat: [0, 0.08, 0.1, 0.18, 0, 0.08, 0.12, 0.2, 0, 0.08, 0.1, 0.18, 0, 0.08, 0.12, 0.26],
        sparkle: [0.26, 0.12, 0.16, 0.1, 0.2, 0.14, 0.24, 0.12, 0.28, 0.14, 0.2, 0.12, 0.24, 0.16, 0.32, 0.14],
      },
      {
        chord: ['G3', 'B3', 'D4', 'F#4'],
        sub: ['G1', REST, 'G1', REST, 'G1', REST, 'D1', REST, 'G1', REST, 'F#1', REST, 'D1', REST, 'E1', REST],
        pluck: ['D5', 'F#5', 'G5', 'B5', 'G5', 'F#5', 'D5', 'F#5', 'B5', 'G5', 'F#5', 'D5', 'C#5', 'D5', 'F#5', 'G5'],
        lead: ['B5', REST, 'D6', 'F#6', 'G6', REST, 'F#6', REST, 'G6', 'F#6', 'D6', REST, 'C#6', 'D6', 'F#6', REST],
        vocal: [CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'G5']), REST, CHOP(['G5', 'B5']), REST, CHOP(['B4', 'D5']), REST, CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'G5']), REST, CHOP(['G5', 'B5']), REST, CHOP(['C#5', 'D5']), REST],
        kick: [0.96, 0, 0.2, 0.08, 0.24, 0, 0.16, 0.08, 0.62, 0, 0.18, 0.08, 0.22, 0, 0.14, 0.08],
        snare: [0, 0, 0.12, 0.08, 0.18, 0, 0.1, 0.08, 0.8, 0, 0.12, 0.08, 0.2, 0, 0.1, 0.08],
        hat: [0.28, 0.18, 0.3, 0.2, 0.28, 0.2, 0.32, 0.22, 0.28, 0.18, 0.3, 0.2, 0.32, 0.22, 0.38, 0.26],
        openHat: [0, 0.08, 0.1, 0.18, 0, 0.08, 0.12, 0.2, 0, 0.08, 0.1, 0.18, 0, 0.08, 0.12, 0.26],
        sparkle: [0.26, 0.12, 0.16, 0.1, 0.2, 0.14, 0.24, 0.12, 0.28, 0.14, 0.2, 0.12, 0.24, 0.16, 0.32, 0.14],
      },
    ],
  },
  outro: {
    motif: 'Skyline memory fade',
    energy: 0.24,
    transitionChord: ['G4', 'B4', 'D5', 'F#5'],
    transitionLead: ['D6', 'F#6'],
    fillSnare: [0, 0, 0, 0, 0.06, 0, 0.08, 0, 0.12, 0, 0.14, 0, 0.18, 0.22, 0.28, 0.34],
    fillHat: [0.08, 0, 0.1, 0, 0.1, 0, 0.12, 0, 0.12, 0.14, 0.14, 0.16, 0.18, 0.2, 0.22, 0.24],
    bars: [
      {
        chord: ['G3', 'B3', 'D4', 'F#4'],
        sub: ['G1', REST, REST, REST, REST, REST, 'D1', REST, 'G1', REST, REST, REST, REST, REST, 'F#1', REST],
        pluck: ['D5', 'F#5', 'G5', REST, 'B5', 'G5', 'F#5', REST, 'D5', 'F#5', 'G5', REST, 'B4', 'D5', 'F#5', REST],
        lead: Array(16).fill(REST),
        vocal: [REST, REST, CHOP(['D5', 'F#5']), REST, CHOP(['F#5', 'G5']), REST, REST, REST, REST, REST, CHOP(['D5', 'F#5']), REST, CHOP(['B4', 'D5']), REST, CHOP(['A4', 'B4']), REST],
        kick: [0.72, 0, 0, 0, 0.12, 0, 0, 0, 0.42, 0, 0, 0, 0.1, 0, 0, 0],
        snare: [0, 0, 0, 0, 0.06, 0, 0, 0, 0.42, 0, 0, 0, 0.06, 0, 0, 0],
        hat: [0.06, 0, 0.08, 0, 0.06, 0, 0.08, 0, 0.06, 0, 0.08, 0, 0.08, 0, 0.1, 0],
        openHat: [0, 0, 0, 0, 0, 0, 0, 0.1, 0, 0, 0, 0, 0, 0, 0, 0.14],
        sparkle: [0.12, 0, 0.06, 0, 0.08, 0, 0.1, 0, 0.14, 0, 0.08, 0, 0.1, 0, 0.12, 0],
      },
    ],
  },
};
