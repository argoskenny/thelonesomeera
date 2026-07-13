import type { EnemyType } from '@/game/types/GameTypes';
import type { GameEventMap } from '@/game/types/GameEvents';
import { EventBus } from '@/game/systems/EventBus';
import { getTone, type ToneModule } from '@/game/systems/toneRuntime';

export class SFXSystem {
  private tone: ToneModule | null = null;
  private clickBus: any = null;
  private hitBus: any = null;
  private burstBus: any = null;
  private explosionBus: any = null;
  private explosionDelay: any = null;
  private explosionReverb: any = null;
  private clickSynth: any = null;
  private droneHitSynth: any = null;
  private shieldHitSynth: any = null;
  private clusterHitSynth: any = null;
  private sniperHitSynth: any = null;
  private mineHitSynth: any = null;
  private bossHitSynth: any = null;
  private burstSynth: any = null;
  private explosionNoiseSynth: any = null;
  private explosionBodySynth: any = null;
  private explosionTailSynth: any = null;
  private readonly disposers: Array<() => void> = [];
  private initialized = false;
  private readonly lastEventTimes: Record<string, number> = {};

  constructor(private readonly bus: EventBus<GameEventMap>) {
    this.disposers.push(
      this.bus.on('lock:acquired', () => {
        if (!this.clickSynth) {
          return;
        }

        this.clickSynth.triggerAttackRelease(
          'E5',
          '32n',
          this.nextEventTime('click'),
          0.2,
        );
      }),
    );
    this.disposers.push(
      this.bus.on('enemy:hit', (payload) => {
        this.playHit(payload.owner, payload.enemyType, payload.destroyed, payload.onBeat);
      }),
    );
    this.disposers.push(
      this.bus.on('burst:used', ({ perfect }) => {
        if (!this.burstSynth) {
          return;
        }

        this.burstSynth.triggerAttackRelease(
          perfect ? ['E4', 'G4', 'B4', 'D5'] : ['E4', 'B4'],
          perfect ? '2n' : '4n',
          this.nextEventTime('burst'),
          perfect ? 0.34 : 0.22,
        );
      }),
    );
    this.disposers.push(
      this.bus.on('player:explode', () => {
        this.playPlayerExplosion();
      }),
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const Tone = await getTone();
    this.tone = Tone;
    this.clickBus = new Tone.Gain(0.7).toDestination();
    this.hitBus = new Tone.Gain(0.91).toDestination();
    this.burstBus = new Tone.Gain(0.74).toDestination();
    this.explosionBus = new Tone.Gain(0.95).toDestination();
    this.explosionDelay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.45,
      wet: 0.35,
    });
    this.explosionReverb = new Tone.Reverb({
      decay: 2.6,
      wet: 0.3,
      preDelay: 0.04,
    });
    this.explosionDelay.connect(this.explosionReverb);
    this.explosionReverb.connect(this.explosionBus);
    this.clickSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
    }).connect(this.clickBus);
    this.droneHitSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.06 },
    }).connect(this.hitBus);
    this.shieldHitSynth = new Tone.FMSynth({
      harmonicity: 2.2,
      modulationIndex: 10,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0.05, release: 0.08 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 },
    }).connect(this.hitBus);
    this.clusterHitSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 },
    }).connect(this.hitBus);
    this.sniperHitSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 1.8, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0.05, release: 0.09 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.1,
        release: 0.08,
        baseFrequency: 700,
        octaves: 2.4,
      },
    }).connect(this.hitBus);
    this.mineHitSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.05 },
    }).connect(this.hitBus);
    this.bossHitSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.002, decay: 0.18, sustain: 0.08, release: 0.15 },
    }).connect(this.hitBus);
    this.burstSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.6 },
    }).connect(this.burstBus);
    this.explosionNoiseSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.55, sustain: 0, release: 1.2 },
    }).connect(this.explosionDelay);
    this.explosionBodySynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth6' },
      filter: { Q: 1.4, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.45, sustain: 0.08, release: 1.4 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.6,
        sustain: 0,
        release: 1.2,
        baseFrequency: 90,
        octaves: 4.3,
      },
    }).connect(this.explosionDelay);
    this.explosionTailSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.04, decay: 0.8, sustain: 0.12, release: 2.1 },
    }).connect(this.explosionReverb);
    this.initialized = true;
  }

  dispose(): void {
    this.disposers.forEach((dispose) => dispose());
    this.clickSynth?.dispose();
    this.droneHitSynth?.dispose();
    this.shieldHitSynth?.dispose();
    this.clusterHitSynth?.dispose();
    this.sniperHitSynth?.dispose();
    this.mineHitSynth?.dispose();
    this.bossHitSynth?.dispose();
    this.burstSynth?.dispose();
    this.explosionNoiseSynth?.dispose();
    this.explosionBodySynth?.dispose();
    this.explosionTailSynth?.dispose();
    this.clickBus?.dispose();
    this.hitBus?.dispose();
    this.burstBus?.dispose();
    this.explosionDelay?.dispose();
    this.explosionReverb?.dispose();
    this.explosionBus?.dispose();
    this.clickSynth = null;
    this.droneHitSynth = null;
    this.shieldHitSynth = null;
    this.clusterHitSynth = null;
    this.sniperHitSynth = null;
    this.mineHitSynth = null;
    this.bossHitSynth = null;
    this.burstSynth = null;
    this.explosionNoiseSynth = null;
    this.explosionBodySynth = null;
    this.explosionTailSynth = null;
    this.clickBus = null;
    this.hitBus = null;
    this.burstBus = null;
    this.explosionDelay = null;
    this.explosionReverb = null;
    this.explosionBus = null;
    Object.keys(this.lastEventTimes).forEach((key) => delete this.lastEventTimes[key]);
    this.initialized = false;
  }

  playBossDefeatStart(): void {
    if (!this.tone) {
      return;
    }

    const time = this.nextEventTime('boss:defeat:start');
    this.explosionNoiseSynth?.triggerAttackRelease('1n', time, 1);
    this.explosionBodySynth?.triggerAttackRelease('C1', '2n', time, 0.96);
    this.explosionTailSynth?.triggerAttackRelease(
      ['E3', 'G3', 'B3', 'D4'],
      '1n',
      time + 0.05,
      0.42,
    );
    this.bossHitSynth?.triggerAttackRelease(['E4', 'A4', 'C5', 'E5'], '2n', time + 0.02, 0.34);
  }

  playBossDefeatBurst(variant: number): void {
    if (!this.tone) {
      return;
    }

    const time = this.nextEventTime(`boss:defeat:burst:${variant}`);
    const cycle = variant % 4;

    if (cycle === 0) {
      this.explosionNoiseSynth?.triggerAttackRelease('4n', time, 0.88);
      this.explosionBodySynth?.triggerAttackRelease('G1', '8n', time, 0.76);
      this.explosionTailSynth?.triggerAttackRelease(['D4', 'G4', 'A4'], '8n', time + 0.04, 0.24);
      return;
    }

    if (cycle === 1) {
      this.explosionNoiseSynth?.triggerAttackRelease('8n', time, 0.72);
      this.explosionBodySynth?.triggerAttackRelease('E1', '16n', time, 0.68);
      this.bossHitSynth?.triggerAttackRelease(['B4', 'D5'], '16n', time + 0.01, 0.22);
      return;
    }

    if (cycle === 2) {
      this.explosionNoiseSynth?.triggerAttackRelease('8n', time, 0.8);
      this.explosionBodySynth?.triggerAttackRelease('A1', '8n', time, 0.74);
      this.explosionTailSynth?.triggerAttackRelease(['A3', 'C4', 'E4'], '8n', time + 0.03, 0.26);
      return;
    }

    this.explosionNoiseSynth?.triggerAttackRelease('16n', time, 0.64);
    this.mineHitSynth?.triggerAttackRelease('16n', time + 0.01, 0.5);
    this.explosionTailSynth?.triggerAttackRelease(['F4', 'A4'], '16n', time + 0.02, 0.2);
  }

  private playHit(
    owner: 'enemy' | 'boss',
    enemyType: EnemyType | undefined,
    destroyed: boolean,
    onBeat: boolean,
  ): void {
    if (!this.tone) {
      return;
    }

    const emphasis = destroyed ? 1.12 : 1;
    const beatBoost = onBeat ? 1.08 : 1;
    const velocity = Math.min(0.95, 0.24 * emphasis * beatBoost);

    if (owner === 'boss') {
      const time = this.nextEventTime('hit:boss');
      this.bossHitSynth?.triggerAttackRelease(
        destroyed ? ['E4', 'A4', 'C5'] : ['E4', 'B4'],
        destroyed ? '8n' : '16n',
        time,
        Math.min(0.98, velocity * 1.1),
      );
      return;
    }

    switch (enemyType) {
      case 'shield-node':
        this.shieldHitSynth?.triggerAttackRelease(
          destroyed ? 'C4' : 'G3',
          destroyed ? '8n' : '16n',
          this.nextEventTime('hit:shield'),
          velocity,
        );
        return;
      case 'chain-cluster':
        this.clusterHitSynth?.triggerAttackRelease(
          destroyed ? 'A5' : 'E5',
          destroyed ? '32n' : '64n',
          this.nextEventTime('hit:cluster'),
          Math.min(0.98, velocity * 1.05),
        );
        return;
      case 'sniper-sigil':
        this.sniperHitSynth?.triggerAttackRelease(
          destroyed ? 'C5' : 'G4',
          destroyed ? '8n' : '16n',
          this.nextEventTime('hit:sniper'),
          Math.min(0.98, velocity * 1.12),
        );
        return;
      case 'distortion-mine':
        this.mineHitSynth?.triggerAttackRelease(
          destroyed ? '8n' : '16n',
          this.nextEventTime('hit:mine'),
          Math.min(0.98, velocity * 1.1),
        );
        return;
      case 'pulse-drone':
      default:
        this.droneHitSynth?.triggerAttackRelease(
          destroyed ? 'B5' : 'E5',
          destroyed ? '16n' : '32n',
          this.nextEventTime('hit:drone'),
          velocity,
        );
        return;
    }
  }

  private nextEventTime(channel: string): number {
    if (!this.tone) {
      return 0;
    }

    const now = this.tone.now();
    const previous = this.lastEventTimes[channel] ?? 0;
    const next = Math.max(now + 0.001, previous + 0.005);
    this.lastEventTimes[channel] = next;
    return next;
  }

  private playPlayerExplosion(): void {
    if (!this.tone) {
      return;
    }

    const time = this.nextEventTime('player:explode');
    this.explosionNoiseSynth?.triggerAttackRelease('2n', time, 0.95);
    this.explosionBodySynth?.triggerAttackRelease('E1', '1n', time, 0.82);
    this.explosionTailSynth?.triggerAttackRelease(
      ['E3', 'B3', 'D4'],
      '2n.',
      time + 0.08,
      0.34,
    );
    this.explosionTailSynth?.triggerAttackRelease(
      ['C3', 'G3', 'A3'],
      '1n',
      time + 0.38,
      0.22,
    );
  }
}
