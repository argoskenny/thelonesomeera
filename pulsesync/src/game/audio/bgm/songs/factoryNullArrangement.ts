import type { StepNote } from '@/game/audio/bgm/arrangementTypes';
import type { PhaseKey } from '@/game/types/GameTypes';

type StepChord = string[] | null;

export interface FactoryNullBarPattern {
  drone: string[];
  bass: StepNote[];
  stab: StepChord[];
  alarm: StepNote[];
  kick: number[];
  snare: number[];
  hat: number[];
  clang: number[];
  noise: number[];
}

export interface FactoryNullSection {
  motif: string;
  bars: FactoryNullBarPattern[];
  fillKick: number[];
  fillNoise: number[];
  transitionDrone: string[];
  transitionAlarm?: string[];
  energy: number;
}

const REST = null;
const STAB = (notes: string[]): StepChord => notes;

export const FACTORY_NULL_ARRANGEMENTS: Record<PhaseKey, FactoryNullSection> = {
  boot: {
    motif: 'Cold spark ignition',
    energy: 0.28,
    transitionDrone: ['D3', 'F3', 'Ab3', 'C4'],
    transitionAlarm: ['Eb5', 'D5'],
    fillKick: [0, 0, 0, 0, 0.16, 0, 0.18, 0, 0.22, 0, 0.24, 0, 0.28, 0.34, 0.4, 0.48],
    fillNoise: [0, 0, 0, 0, 0, 0, 0.08, 0, 0.12, 0, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36],
    bars: [
      {
        drone: ['D2', 'A2', 'C3', 'Eb3'],
        bass: ['D1', REST, REST, REST, REST, REST, 'D1', REST, 'D1', REST, REST, REST, 'C2', REST, 'D1', REST],
        stab: [STAB(['D4', 'F4', 'Ab4']), REST, REST, REST, REST, REST, REST, STAB(['C4', 'Eb4', 'Gb4']), STAB(['D4', 'F4', 'Ab4']), REST, REST, REST, REST, REST, REST, REST],
        alarm: Array(16).fill(REST),
        kick: [0.96, 0, 0, 0, 0.14, 0, 0.42, 0, 0.88, 0, 0, 0, 0.18, 0, 0.36, 0],
        snare: [0, 0, 0, 0, 0.34, 0, 0, 0, 0, 0, 0, 0, 0.48, 0, 0, 0],
        hat: [0.04, 0, 0.05, 0, 0.04, 0, 0.06, 0, 0.04, 0, 0.05, 0, 0.06, 0, 0.07, 0],
        clang: [0, 0, 0, 0.18, 0, 0, 0.12, 0, 0, 0, 0, 0.22, 0, 0, 0.18, 0],
        noise: [0, 0, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 0.12, 0, 0, 0.18, 0],
      },
      {
        drone: ['Bb1', 'F2', 'Ab2', 'Db3'],
        bass: ['Bb0', REST, REST, REST, REST, REST, 'Bb0', REST, 'F1', REST, REST, REST, 'Db1', REST, 'F1', REST],
        stab: [STAB(['Bb3', 'Db4', 'F4']), REST, REST, REST, REST, REST, REST, STAB(['Ab3', 'C4', 'Eb4']), STAB(['Bb3', 'Db4', 'F4']), REST, REST, REST, REST, REST, REST, REST],
        alarm: Array(16).fill(REST),
        kick: [0.94, 0, 0, 0, 0.16, 0, 0.38, 0, 0.9, 0, 0, 0, 0.18, 0, 0.34, 0],
        snare: [0, 0, 0, 0, 0.32, 0, 0, 0, 0, 0, 0, 0, 0.46, 0, 0, 0],
        hat: [0.04, 0, 0.05, 0, 0.04, 0, 0.06, 0, 0.04, 0, 0.05, 0, 0.06, 0, 0.07, 0],
        clang: [0, 0, 0, 0.16, 0, 0, 0.1, 0, 0, 0, 0, 0.2, 0, 0, 0.16, 0],
        noise: [0, 0, 0, 0, 0, 0, 0.06, 0, 0, 0, 0, 0.12, 0, 0, 0.16, 0],
      },
    ],
  },
  tutorial: {
    motif: 'Assembly line pressure',
    energy: 0.44,
    transitionDrone: ['D3', 'F3', 'A3', 'C4'],
    transitionAlarm: ['F5', 'Eb5', 'D5'],
    fillKick: [0.18, 0, 0.2, 0, 0.24, 0.12, 0.28, 0, 0.32, 0.14, 0.36, 0.18, 0.42, 0.5, 0.58, 0.66],
    fillNoise: [0, 0, 0.1, 0, 0.12, 0.1, 0.14, 0.12, 0.16, 0.14, 0.18, 0.16, 0.22, 0.26, 0.32, 0.38],
    bars: [
      {
        drone: ['D2', 'F2', 'A2', 'C3'],
        bass: ['D1', REST, 'D1', REST, REST, 'A0', REST, REST, 'D1', REST, REST, REST, 'C1', REST, 'D1', REST],
        stab: [STAB(['D4', 'F4', 'A4']), REST, REST, REST, REST, REST, STAB(['Eb4', 'F4', 'Bb4']), REST, STAB(['D4', 'F4', 'A4']), REST, REST, REST, REST, REST, STAB(['C4', 'Eb4', 'G4']), REST],
        alarm: [REST, REST, REST, REST, 'D5', REST, REST, REST, REST, REST, REST, REST, 'F5', REST, REST, REST],
        kick: [1, 0, 0.16, 0, 0.22, 0, 0.4, 0, 0.96, 0, 0.14, 0, 0.24, 0, 0.42, 0],
        snare: [0, 0, 0, 0.1, 0.5, 0, 0, 0, 0, 0, 0, 0.1, 0.62, 0, 0, 0],
        hat: [0.08, 0, 0.12, 0, 0.08, 0.06, 0.12, 0, 0.08, 0.06, 0.12, 0, 0.1, 0.08, 0.14, 0],
        clang: [0, 0, 0.18, 0, 0, 0, 0.14, 0, 0, 0, 0.12, 0, 0, 0, 0.2, 0],
        noise: [0, 0, 0, 0, 0, 0, 0.12, 0, 0, 0, 0, 0.16, 0, 0, 0.22, 0],
      },
      {
        drone: ['C2', 'Eb2', 'G2', 'Bb2'],
        bass: ['C1', REST, 'C1', REST, REST, 'G0', REST, REST, 'C1', REST, REST, REST, 'Bb0', REST, 'C1', REST],
        stab: [STAB(['C4', 'Eb4', 'G4']), REST, REST, REST, REST, REST, STAB(['Bb3', 'Db4', 'F4']), REST, STAB(['C4', 'Eb4', 'G4']), REST, REST, REST, REST, REST, STAB(['Bb3', 'Db4', 'Eb4']), REST],
        alarm: [REST, REST, REST, REST, 'C5', REST, REST, REST, REST, REST, REST, REST, 'Eb5', REST, REST, REST],
        kick: [0.98, 0, 0.16, 0, 0.2, 0, 0.38, 0, 0.94, 0, 0.14, 0, 0.24, 0, 0.4, 0],
        snare: [0, 0, 0, 0.1, 0.48, 0, 0, 0, 0, 0, 0, 0.1, 0.6, 0, 0, 0],
        hat: [0.08, 0, 0.12, 0, 0.08, 0.06, 0.12, 0, 0.08, 0.06, 0.12, 0, 0.1, 0.08, 0.14, 0],
        clang: [0, 0, 0.16, 0, 0, 0, 0.14, 0, 0, 0, 0.12, 0, 0, 0, 0.18, 0],
        noise: [0, 0, 0, 0, 0, 0, 0.12, 0, 0, 0, 0, 0.16, 0, 0, 0.2, 0],
      },
    ],
  },
  build: {
    motif: 'Foundry stampede',
    energy: 0.64,
    transitionDrone: ['Eb3', 'Gb3', 'Bb3', 'Db4'],
    transitionAlarm: ['Gb5', 'F5', 'Eb5'],
    fillKick: [0.22, 0.08, 0.24, 0, 0.28, 0.12, 0.32, 0.16, 0.36, 0.18, 0.4, 0.2, 0.46, 0.54, 0.62, 0.7],
    fillNoise: [0.1, 0, 0.12, 0.08, 0.14, 0.1, 0.16, 0.12, 0.18, 0.14, 0.22, 0.16, 0.26, 0.3, 0.36, 0.42],
    bars: [
      {
        drone: ['D2', 'Ab2', 'C3', 'F3'],
        bass: ['D1', REST, 'D1', REST, 'Ab0', REST, 'C1', REST, 'D1', REST, 'D1', REST, 'F1', REST, 'C1', REST],
        stab: [STAB(['D4', 'F4', 'Ab4']), REST, REST, STAB(['Eb4', 'Gb4', 'Bb4']), REST, REST, STAB(['D4', 'F4', 'Ab4']), REST, STAB(['C4', 'Eb4', 'G4']), REST, REST, STAB(['Bb3', 'Db4', 'F4']), REST, REST, STAB(['D4', 'F4', 'Ab4']), REST],
        alarm: ['D5', REST, REST, REST, 'F5', REST, REST, REST, 'Eb5', REST, REST, REST, 'D5', REST, 'C5', REST],
        kick: [1, 0, 0.22, 0, 0.28, 0.12, 0.44, 0, 0.98, 0, 0.24, 0, 0.3, 0.12, 0.46, 0],
        snare: [0, 0, 0.1, 0.14, 0.56, 0, 0, 0.1, 0, 0, 0.12, 0.14, 0.68, 0, 0, 0.12],
        hat: [0.14, 0.08, 0.16, 0.1, 0.14, 0.08, 0.18, 0.12, 0.14, 0.08, 0.16, 0.1, 0.18, 0.12, 0.22, 0.14],
        clang: [0, 0, 0.18, 0, 0.14, 0, 0.22, 0, 0, 0, 0.18, 0, 0.16, 0, 0.24, 0],
        noise: [0, 0, 0.12, 0, 0, 0.1, 0.18, 0, 0, 0, 0.14, 0, 0, 0.12, 0.24, 0],
      },
      {
        drone: ['Bb1', 'Db2', 'F2', 'Ab2'],
        bass: ['Bb0', REST, 'Bb0', REST, 'F1', REST, 'Ab0', REST, 'Bb0', REST, 'Bb0', REST, 'Db1', REST, 'F1', REST],
        stab: [STAB(['Bb3', 'Db4', 'F4']), REST, REST, STAB(['Ab3', 'C4', 'Eb4']), REST, REST, STAB(['Bb3', 'Db4', 'F4']), REST, STAB(['Gb3', 'Bb3', 'Db4']), REST, REST, STAB(['Ab3', 'C4', 'Eb4']), REST, REST, STAB(['Bb3', 'Db4', 'F4']), REST],
        alarm: ['Bb4', REST, REST, REST, 'Db5', REST, REST, REST, 'F5', REST, REST, REST, 'Eb5', REST, 'Db5', REST],
        kick: [1, 0, 0.2, 0, 0.26, 0.12, 0.42, 0, 0.98, 0, 0.22, 0, 0.28, 0.12, 0.44, 0],
        snare: [0, 0, 0.1, 0.14, 0.58, 0, 0, 0.1, 0, 0, 0.12, 0.14, 0.7, 0, 0, 0.12],
        hat: [0.14, 0.08, 0.16, 0.1, 0.14, 0.08, 0.18, 0.12, 0.14, 0.08, 0.16, 0.1, 0.18, 0.12, 0.22, 0.14],
        clang: [0, 0, 0.16, 0, 0.14, 0, 0.2, 0, 0, 0, 0.18, 0, 0.16, 0, 0.22, 0],
        noise: [0, 0, 0.12, 0, 0, 0.1, 0.16, 0, 0, 0, 0.14, 0, 0, 0.12, 0.22, 0],
      },
    ],
  },
  climax: {
    motif: 'Riot kiln overdrive',
    energy: 0.82,
    transitionDrone: ['D3', 'F3', 'Ab3', 'C4'],
    transitionAlarm: ['A5', 'Gb5', 'F5', 'Eb5'],
    fillKick: [0.28, 0.12, 0.3, 0.16, 0.34, 0.18, 0.38, 0.2, 0.42, 0.24, 0.46, 0.28, 0.52, 0.6, 0.7, 0.82],
    fillNoise: [0.16, 0.1, 0.18, 0.12, 0.22, 0.14, 0.24, 0.16, 0.28, 0.18, 0.32, 0.2, 0.36, 0.42, 0.5, 0.58],
    bars: [
      {
        drone: ['D2', 'F2', 'Ab2', 'C3'],
        bass: ['D1', REST, 'D1', REST, 'D1', REST, 'Ab0', REST, 'D1', REST, 'D1', REST, 'F1', REST, 'C1', REST],
        stab: [STAB(['D4', 'F4', 'Ab4']), REST, STAB(['Eb4', 'Gb4', 'Bb4']), REST, REST, REST, STAB(['D4', 'F4', 'Ab4']), REST, STAB(['C4', 'Eb4', 'Gb4']), REST, STAB(['D4', 'F4', 'Ab4']), REST, REST, REST, STAB(['Bb3', 'Db4', 'F4']), REST],
        alarm: ['D5', REST, 'F5', REST, REST, REST, 'A5', REST, 'Gb5', REST, 'F5', REST, 'Eb5', REST, 'D5', REST],
        kick: [1, 0, 0.28, 0.14, 0.34, 0, 0.46, 0.18, 1, 0, 0.3, 0.16, 0.38, 0.1, 0.5, 0.2],
        snare: [0, 0, 0.12, 0.16, 0.68, 0, 0.1, 0.16, 0, 0, 0.12, 0.18, 0.78, 0, 0.12, 0.18],
        hat: [0.22, 0.14, 0.24, 0.16, 0.22, 0.14, 0.26, 0.18, 0.22, 0.14, 0.24, 0.16, 0.26, 0.18, 0.3, 0.22],
        clang: [0, 0.08, 0.22, 0, 0.16, 0, 0.26, 0, 0, 0.1, 0.22, 0, 0.18, 0, 0.3, 0],
        noise: [0, 0.08, 0.16, 0, 0, 0.1, 0.24, 0.12, 0, 0.08, 0.16, 0, 0, 0.12, 0.3, 0.18],
      },
      {
        drone: ['Eb2', 'Gb2', 'Bb2', 'Db3'],
        bass: ['Eb1', REST, 'Eb1', REST, 'Eb1', REST, 'Bb0', REST, 'Eb1', REST, 'Eb1', REST, 'Gb1', REST, 'Db1', REST],
        stab: [STAB(['Eb4', 'Gb4', 'Bb4']), REST, STAB(['D4', 'F4', 'Ab4']), REST, REST, REST, STAB(['Eb4', 'Gb4', 'Bb4']), REST, STAB(['Db4', 'F4', 'Ab4']), REST, STAB(['Eb4', 'Gb4', 'Bb4']), REST, REST, REST, STAB(['C4', 'Eb4', 'Gb4']), REST],
        alarm: ['Eb5', REST, 'Gb5', REST, REST, REST, 'Bb5', REST, 'A5', REST, 'Gb5', REST, 'F5', REST, 'Eb5', REST],
        kick: [1, 0, 0.28, 0.14, 0.32, 0, 0.44, 0.18, 1, 0, 0.3, 0.16, 0.36, 0.1, 0.48, 0.2],
        snare: [0, 0, 0.12, 0.16, 0.7, 0, 0.1, 0.16, 0, 0, 0.12, 0.18, 0.8, 0, 0.12, 0.18],
        hat: [0.22, 0.14, 0.24, 0.16, 0.22, 0.14, 0.26, 0.18, 0.22, 0.14, 0.24, 0.16, 0.26, 0.18, 0.3, 0.22],
        clang: [0, 0.08, 0.2, 0, 0.16, 0, 0.24, 0, 0, 0.1, 0.22, 0, 0.18, 0, 0.28, 0],
        noise: [0, 0.08, 0.16, 0, 0, 0.1, 0.22, 0.12, 0, 0.08, 0.16, 0, 0, 0.12, 0.28, 0.18],
      },
    ],
  },
  boss: {
    motif: 'Machine god crush',
    energy: 0.96,
    transitionDrone: ['D3', 'Gb3', 'A3', 'C4'],
    transitionAlarm: ['A5', 'F5', 'Eb5', 'D5'],
    fillKick: [0.34, 0.18, 0.36, 0.2, 0.4, 0.22, 0.46, 0.24, 0.5, 0.28, 0.56, 0.32, 0.64, 0.74, 0.86, 1],
    fillNoise: [0.2, 0.12, 0.24, 0.14, 0.28, 0.16, 0.32, 0.18, 0.36, 0.2, 0.4, 0.24, 0.46, 0.54, 0.62, 0.72],
    bars: [
      {
        drone: ['D2', 'Ab2', 'C3', 'F3'],
        bass: ['D1', REST, 'D1', REST, 'Ab0', REST, 'C1', REST, 'D1', REST, 'F1', REST, 'D1', REST, 'C1', REST],
        stab: [STAB(['D4', 'F4', 'Ab4']), REST, STAB(['F4', 'Ab4', 'C5']), REST, REST, STAB(['Eb4', 'Gb4', 'Bb4']), STAB(['D4', 'F4', 'Ab4']), REST, STAB(['C4', 'Eb4', 'Gb4']), REST, STAB(['F4', 'Ab4', 'C5']), REST, REST, STAB(['Bb3', 'Db4', 'F4']), STAB(['D4', 'F4', 'Ab4']), REST],
        alarm: ['D5', REST, 'F5', REST, 'A5', REST, 'Gb5', REST, 'F5', REST, 'Eb5', REST, 'D5', REST, 'C5', REST],
        kick: [1, 0, 0.34, 0.16, 0.4, 0, 0.5, 0.2, 1, 0, 0.36, 0.18, 0.44, 0.12, 0.58, 0.24],
        snare: [0, 0.08, 0.14, 0.18, 0.76, 0, 0.12, 0.18, 0, 0.1, 0.14, 0.18, 0.88, 0, 0.14, 0.2],
        hat: [0.28, 0.18, 0.3, 0.2, 0.28, 0.18, 0.32, 0.22, 0.28, 0.18, 0.3, 0.2, 0.34, 0.24, 0.38, 0.28],
        clang: [0, 0.12, 0.26, 0, 0.2, 0, 0.3, 0, 0, 0.14, 0.26, 0, 0.22, 0, 0.34, 0],
        noise: [0, 0.12, 0.22, 0, 0, 0.14, 0.3, 0.18, 0, 0.12, 0.22, 0, 0, 0.16, 0.38, 0.22],
      },
      {
        drone: ['C2', 'Eb2', 'Gb2', 'Bb2'],
        bass: ['C1', REST, 'C1', REST, 'Gb0', REST, 'Bb0', REST, 'C1', REST, 'Eb1', REST, 'C1', REST, 'Bb0', REST],
        stab: [STAB(['C4', 'Eb4', 'Gb4']), REST, STAB(['Eb4', 'Gb4', 'Bb4']), REST, REST, STAB(['D4', 'F4', 'Ab4']), STAB(['C4', 'Eb4', 'Gb4']), REST, STAB(['Bb3', 'Db4', 'F4']), REST, STAB(['Eb4', 'Gb4', 'Bb4']), REST, REST, STAB(['Ab3', 'C4', 'Eb4']), STAB(['C4', 'Eb4', 'Gb4']), REST],
        alarm: ['C5', REST, 'Eb5', REST, 'Gb5', REST, 'A5', REST, 'F5', REST, 'Eb5', REST, 'D5', REST, 'C5', REST],
        kick: [1, 0, 0.34, 0.16, 0.38, 0, 0.48, 0.2, 1, 0, 0.36, 0.18, 0.42, 0.12, 0.56, 0.24],
        snare: [0, 0.08, 0.14, 0.18, 0.78, 0, 0.12, 0.18, 0, 0.1, 0.14, 0.18, 0.9, 0, 0.14, 0.2],
        hat: [0.28, 0.18, 0.3, 0.2, 0.28, 0.18, 0.32, 0.22, 0.28, 0.18, 0.3, 0.2, 0.34, 0.24, 0.38, 0.28],
        clang: [0, 0.12, 0.24, 0, 0.2, 0, 0.28, 0, 0, 0.14, 0.24, 0, 0.22, 0, 0.32, 0],
        noise: [0, 0.12, 0.22, 0, 0, 0.14, 0.28, 0.18, 0, 0.12, 0.22, 0, 0, 0.16, 0.36, 0.22],
      },
    ],
  },
  outro: {
    motif: 'Cooling iron dust',
    energy: 0.22,
    transitionDrone: ['D3', 'F3', 'Ab3', 'C4'],
    transitionAlarm: ['Eb5', 'D5'],
    fillKick: [0, 0, 0, 0, 0.14, 0, 0.18, 0, 0.22, 0, 0.24, 0, 0.28, 0.34, 0.4, 0.44],
    fillNoise: [0, 0, 0, 0, 0, 0, 0.08, 0, 0.1, 0, 0.14, 0.18, 0.2, 0.24, 0.28, 0.32],
    bars: [
      {
        drone: ['D2', 'A2', 'C3', 'Eb3'],
        bass: ['D1', REST, REST, REST, REST, REST, 'D1', REST, 'C1', REST, REST, REST, REST, REST, 'D1', REST],
        stab: [STAB(['D4', 'F4', 'Ab4']), REST, REST, REST, REST, REST, REST, STAB(['C4', 'Eb4', 'Gb4']), REST, REST, REST, REST, REST, REST, STAB(['D4', 'F4', 'Ab4']), REST],
        alarm: Array(16).fill(REST),
        kick: [0.84, 0, 0, 0, 0.16, 0, 0.3, 0, 0.72, 0, 0, 0, 0.16, 0, 0.26, 0],
        snare: [0, 0, 0, 0, 0.3, 0, 0, 0, 0, 0, 0, 0, 0.42, 0, 0, 0],
        hat: [0.06, 0, 0.08, 0, 0.06, 0, 0.08, 0, 0.06, 0, 0.08, 0, 0.08, 0, 0.1, 0],
        clang: [0, 0, 0, 0.12, 0, 0, 0.1, 0, 0, 0, 0, 0.16, 0, 0, 0.12, 0],
        noise: [0, 0, 0, 0, 0, 0, 0.06, 0, 0, 0, 0, 0.1, 0, 0, 0.14, 0],
      },
    ],
  },
};
