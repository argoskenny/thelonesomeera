import { secondsForBarBeat } from '@/game/utils/math';
import type { EnemyType, SpawnCue } from '@/game/types/GameTypes';

interface PatternWindow {
  prefix: string;
  startBar: number;
  endBar: number;
  bpm: number;
}

interface LanePulseTrainOptions extends PatternWindow {
  enemyType: EnemyType;
  everyBeats: number;
  lanes: number[];
  speedScale?: number;
  drift?: number;
}

export function createLanePulseTrain(options: LanePulseTrainOptions): SpawnCue[] {
  const cues: SpawnCue[] = [];
  const startBeat = options.startBar * 4;
  const endBeat = options.endBar * 4;
  let laneIndex = 0;

  for (let beat = startBeat; beat < endBeat; beat += options.everyBeats) {
    cues.push({
      id: `${options.prefix}-${beat}`,
      at: secondsForBarBeat(0, beat, options.bpm),
      kind: 'spawn',
      enemyType: options.enemyType,
      lane: options.lanes[laneIndex % options.lanes.length],
      speedScale: options.speedScale,
      drift: options.drift,
    });
    laneIndex += 1;
  }

  return cues;
}

interface ShieldPairOptions extends PatternWindow {
  everyBars: number;
  lanePairs: Array<[number, number]>;
}

export function createShieldPairs(options: ShieldPairOptions): SpawnCue[] {
  const cues: SpawnCue[] = [];
  let pairIndex = 0;

  for (let bar = options.startBar; bar < options.endBar; bar += options.everyBars) {
    const [firstLane, secondLane] =
      options.lanePairs[pairIndex % options.lanePairs.length];

    cues.push(
      {
        id: `${options.prefix}-${bar}-a`,
        at: secondsForBarBeat(bar, 0, options.bpm),
        kind: 'spawn',
        enemyType: 'shield-node',
        lane: firstLane,
        speedScale: 0.9,
      },
      {
        id: `${options.prefix}-${bar}-b`,
        at: secondsForBarBeat(bar, 1.5, options.bpm),
        kind: 'spawn',
        enemyType: 'shield-node',
        lane: secondLane,
        speedScale: 1,
      },
    );

    pairIndex += 1;
  }

  return cues;
}

interface ClusterBurstOptions extends PatternWindow {
  everyBars: number;
  baseLane: number[];
}

export function createClusterBursts(options: ClusterBurstOptions): SpawnCue[] {
  const cues: SpawnCue[] = [];
  let clusterIndex = 0;

  for (let bar = options.startBar; bar < options.endBar; bar += options.everyBars) {
    const lane = options.baseLane[clusterIndex % options.baseLane.length];
    const clusterId = `${options.prefix}-cluster-${bar}`;

    for (let node = 0; node < 4; node += 1) {
      cues.push({
        id: `${clusterId}-${node}`,
        at: secondsForBarBeat(bar, node * 0.5, options.bpm),
        kind: 'spawn',
        enemyType: 'chain-cluster',
        lane,
        count: 1,
        spacing: 36,
        drift: (node - 1.5) * 18,
        phaseOffset: node * 0.4,
        clusterId,
      });
    }

    clusterIndex += 1;
  }

  return cues;
}

interface AmbushOptions extends PatternWindow {
  everyBars: number;
  lanes: number[];
  enemyType: 'sniper-sigil' | 'distortion-mine';
}

export function createThreatAmbush(options: AmbushOptions): SpawnCue[] {
  const cues: SpawnCue[] = [];
  let laneIndex = 0;

  for (let bar = options.startBar; bar < options.endBar; bar += options.everyBars) {
    cues.push({
      id: `${options.prefix}-${bar}`,
      at: secondsForBarBeat(bar, 0.5, options.bpm),
      kind: 'spawn',
      enemyType: options.enemyType,
      lane: options.lanes[laneIndex % options.lanes.length],
      speedScale: 0.8,
    });
    laneIndex += 1;
  }

  return cues;
}
