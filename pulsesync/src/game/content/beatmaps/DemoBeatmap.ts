import { loadBeatmap } from '@/game/content/beatmaps/beatmapLoader';
import {
  createClusterBursts,
  createLanePulseTrain,
  createShieldPairs,
  createThreatAmbush,
} from '@/game/content/enemyPatterns/patternFactory';
import { secondsForBarBeat } from '@/game/utils/math';
import type { LevelDefinition } from '@/game/types/GameTypes';

export const DEFAULT_DEMO_BPM = 126;

const totalBars = 82;

const phases: LevelDefinition['phases'] = [
  {
    key: 'boot',
    label: 'System Boot',
    startBar: 0,
    endBar: 6,
    paletteKey: 'boot',
    intensity: 0.15,
  },
  {
    key: 'tutorial',
    label: 'Signal Primer',
    startBar: 6,
    endBar: 22,
    paletteKey: 'primer',
    intensity: 0.32,
  },
  {
    key: 'build',
    label: 'Cascade',
    startBar: 22,
    endBar: 44,
    paletteKey: 'cascade',
    intensity: 0.56,
  },
  {
    key: 'climax',
    label: 'Overclock',
    startBar: 44,
    endBar: 62,
    paletteKey: 'overclock',
    intensity: 0.82,
  },
  {
    key: 'boss',
    label: 'The Gate of Eden',
    startBar: 62,
    endBar: totalBars,
    paletteKey: 'eden',
    intensity: 1,
  },
];

function createCues(bpm: number): LevelDefinition['cues'] {
  return [
    ...phases.flatMap((phase) => [
      {
        id: `phase-${phase.key}`,
        at: secondsForBarBeat(phase.startBar, 0, bpm),
        kind: 'phase' as const,
        phase: phase.key,
      },
      {
        id: `visual-${phase.key}`,
        at: secondsForBarBeat(phase.startBar, 0, bpm),
        kind: 'visual' as const,
        palette: phase.paletteKey,
      },
    ]),
    {
      id: 'music-kick',
      at: 0,
      kind: 'music',
      layer: 'kick',
      enabled: true,
    },
    {
      id: 'music-bass',
      at: 0,
      kind: 'music',
      layer: 'bass',
      enabled: true,
    },
    {
      id: 'music-pad',
      at: 0,
      kind: 'music',
      layer: 'pad',
      enabled: true,
    },
    {
      id: 'music-arp',
      at: secondsForBarBeat(6, 0, bpm),
      kind: 'music',
      layer: 'arp',
      enabled: true,
    },
    {
      id: 'music-hat',
      at: secondsForBarBeat(22, 0, bpm),
      kind: 'music',
      layer: 'hat',
      enabled: true,
    },
    ...createLanePulseTrain({
      prefix: 'tutorial-drone',
      startBar: 6,
      endBar: 22,
      bpm,
      enemyType: 'pulse-drone',
      everyBeats: 2,
      lanes: [2, 3, 1, 4, 0, 5],
      speedScale: 1,
      drift: 16,
    }),
    ...createShieldPairs({
      prefix: 'tutorial-shield',
      startBar: 10,
      endBar: 22,
      bpm,
      everyBars: 4,
      lanePairs: [
        [1, 4],
        [2, 5],
        [0, 3],
      ],
    }),
    ...createClusterBursts({
      prefix: 'build-clusters',
      startBar: 22,
      endBar: 44,
      bpm,
      everyBars: 3,
      baseLane: [1, 3, 4, 2],
    }),
    ...createLanePulseTrain({
      prefix: 'build-drones',
      startBar: 22,
      endBar: 44,
      bpm,
      enemyType: 'pulse-drone',
      everyBeats: 1,
      lanes: [0, 2, 5, 3, 1, 4],
      speedScale: 1.1,
      drift: 22,
    }),
    ...createShieldPairs({
      prefix: 'build-shield',
      startBar: 24,
      endBar: 44,
      bpm,
      everyBars: 3,
      lanePairs: [
        [0, 5],
        [1, 4],
        [2, 3],
      ],
    }),
    ...createThreatAmbush({
      prefix: 'build-sniper',
      startBar: 28,
      endBar: 44,
      bpm,
      everyBars: 4,
      lanes: [0, 5, 1, 4],
      enemyType: 'sniper-sigil',
    }),
    ...createThreatAmbush({
      prefix: 'build-mine',
      startBar: 30,
      endBar: 44,
      bpm,
      everyBars: 4,
      lanes: [2, 3],
      enemyType: 'distortion-mine',
    }),
    ...createLanePulseTrain({
      prefix: 'climax-drones',
      startBar: 44,
      endBar: 62,
      bpm,
      enemyType: 'pulse-drone',
      everyBeats: 0.5,
      lanes: [0, 5, 1, 4, 2, 3],
      speedScale: 1.25,
      drift: 30,
    }),
    ...createClusterBursts({
      prefix: 'climax-clusters',
      startBar: 45,
      endBar: 62,
      bpm,
      everyBars: 2,
      baseLane: [0, 2, 5, 3, 1, 4],
    }),
    ...createShieldPairs({
      prefix: 'climax-shields',
      startBar: 46,
      endBar: 62,
      bpm,
      everyBars: 2,
      lanePairs: [
        [0, 4],
        [1, 5],
        [2, 3],
      ],
    }),
    ...createThreatAmbush({
      prefix: 'climax-sniper',
      startBar: 46,
      endBar: 62,
      bpm,
      everyBars: 3,
      lanes: [5, 0, 4, 1],
      enemyType: 'sniper-sigil',
    }),
    ...createThreatAmbush({
      prefix: 'climax-mine',
      startBar: 48,
      endBar: 62,
      bpm,
      everyBars: 3,
      lanes: [2, 3, 1, 4],
      enemyType: 'distortion-mine',
    }),
    {
      id: 'boss-start',
      at: secondsForBarBeat(62, 0, bpm),
      kind: 'boss',
      command: 'start',
    },
  ];
}

export function createDemoLevel(bpm = DEFAULT_DEMO_BPM): LevelDefinition {
  return loadBeatmap({
    id: 'pulse-sync-demo',
    title: 'Pulse Sync',
    summary: 'A rail-lock shooter slice staged inside a dormant cognition core.',
    beatGrid: {
      bpm,
      beatsPerBar: 4,
      phraseBars: 4,
    },
    totalBars,
    phases,
    cues: createCues(bpm),
  });
}

export const DEMO_LEVEL = createDemoLevel();
