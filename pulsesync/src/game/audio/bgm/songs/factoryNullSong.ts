import { BaseProceduralBGMRuntime } from '@/game/audio/bgm/BaseProceduralBGMRuntime';
import type {
  FactoryNullBarPattern,
  FactoryNullSection,
} from '@/game/audio/bgm/songs/factoryNullArrangement';
import { FACTORY_NULL_ARRANGEMENTS } from '@/game/audio/bgm/songs/factoryNullArrangement';
import type {
  ProceduralBGMSongContext,
  ProceduralBGMSongDefinition,
} from '@/game/audio/bgm/types';
import type { PhaseKey, SyncTier } from '@/game/types/GameTypes';

class FactoryNullRuntime extends BaseProceduralBGMRuntime {
  private masterBus: any = null;
  private masterFilter: any = null;
  private compressor: any = null;
  private distortion: any = null;
  private reverb: any = null;
  private delay: any = null;
  private kick: any = null;
  private bodyHit: any = null;
  private shardHat: any = null;
  private hammer: any = null;
  private gritNoise: any = null;
  private bass: any = null;
  private stab: any = null;
  private drone: any = null;
  private alarm: any = null;
  private currentSection: FactoryNullSection = FACTORY_NULL_ARRANGEMENTS.boot;
  private phaseStartBar = 0;
  private transitionBars = 0;
  private pressureHits = 0;

  constructor({ Tone, beatGrid }: ProceduralBGMSongContext) {
    super(Tone, beatGrid, {
      kick: true,
      bass: false,
      hat: false,
      arp: false,
      pad: false,
    });

    this.masterBus = new Tone.Gain(0.5).toDestination();
    this.compressor = new Tone.Compressor(-18, 4).connect(this.masterBus);
    this.distortion = new Tone.Distortion(0.76).connect(this.compressor);
    this.masterFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 900,
      rolloff: -24,
      Q: 0.9,
    }).connect(this.distortion);
    this.reverb = new Tone.Reverb({
      decay: 4.8,
      wet: 0.18,
      preDelay: 0.02,
    }).connect(this.masterBus);
    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.25,
      wet: 0.16,
    }).connect(this.reverb);

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.06,
      octaves: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0.02, release: 0.12 },
    }).connect(this.masterFilter);
    this.bodyHit = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.05 },
    }).connect(this.masterFilter);
    this.shardHat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.07, release: 0.04 },
      harmonicity: 7.2,
      resonance: 4600,
      modulationIndex: 40,
      octaves: 1.3,
    }).connect(this.masterFilter);
    this.shardHat.frequency.value = 420;
    this.hammer = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.28, release: 0.12 },
      harmonicity: 3.2,
      resonance: 3000,
      modulationIndex: 18,
      octaves: 1.8,
    }).connect(this.reverb);
    this.hammer.frequency.value = 180;
    this.gritNoise = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.22, sustain: 0.02, release: 0.18 },
    }).connect(this.delay);
    this.bass = new Tone.MonoSynth({
      oscillator: { type: 'square4' },
      filter: { Q: 1.2, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.002, decay: 0.16, sustain: 0.18, release: 0.1 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.14,
        release: 0.14,
        baseFrequency: 65,
        octaves: 1.8,
      },
    }).connect(this.masterFilter);
    this.stab = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.002, decay: 0.12, sustain: 0.04, release: 0.12 },
    }).connect(this.masterFilter);
    this.drone = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.8, sustain: 0.2, release: 1.2 },
    }).connect(this.reverb);
    this.alarm = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0.06, release: 0.12 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0.1,
        release: 0.1,
        baseFrequency: 800,
        octaves: 2.8,
      },
    }).connect(this.delay);
    this.onSyncChange('dormant');
  }

  override onPhaseChange(phase: PhaseKey): void {
    super.onPhaseChange(phase);
    this.currentSection = FACTORY_NULL_ARRANGEMENTS[phase];
    this.phaseStartBar = this.getCurrentBarIndex();
    this.transitionBars = phase === 'boot' ? 1 : 2;
    this.pressureHits = 2;
  }

  override onSyncChange(tier: SyncTier): void {
    if (!this.masterBus || !this.reverb || !this.masterFilter) {
      return;
    }

    if (tier === 'overdrive') {
      this.masterBus.gain.rampTo(0.64, 0.2);
      this.masterFilter.frequency.rampTo(1500, 0.3);
      this.reverb.wet.rampTo(0.24, 0.3);
      return;
    }

    if (tier === 'surge') {
      this.masterBus.gain.rampTo(0.58, 0.2);
      this.masterFilter.frequency.rampTo(1280, 0.3);
      this.reverb.wet.rampTo(0.2, 0.3);
      return;
    }

    if (tier === 'aligned') {
      this.masterBus.gain.rampTo(0.52, 0.2);
      this.masterFilter.frequency.rampTo(1080, 0.3);
      this.reverb.wet.rampTo(0.18, 0.3);
      return;
    }

    this.masterBus.gain.rampTo(0.46, 0.2);
    this.masterFilter.frequency.rampTo(860, 0.3);
    this.reverb.wet.rampTo(0.14, 0.3);
  }

  override onPhrase(): void {
    const phase = this.getCurrentPhase();
    if (phase === 'build' || phase === 'climax' || phase === 'boss') {
      this.pressureHits = 1;
    }
  }

  override onSixteenth(time: number): void {
    const stepInBar = this.getStepInBar();
    const bar = this.currentBar();
    const isFillBar = this.isFillBar();

    const kickLevel = isFillBar
      ? Math.max(bar.kick[stepInBar], this.currentSection.fillKick[stepInBar])
      : bar.kick[stepInBar];
    if (this.isLayerEnabled('kick', true) && kickLevel > 0) {
      this.kick.triggerAttackRelease(
        'C1',
        '16n',
        this.safeTriggerTime('kick', time),
        kickLevel * (0.82 + this.currentSection.energy * 0.16),
      );
    }

    const snareLevel = bar.snare[stepInBar];
    if (snareLevel > 0) {
      this.bodyHit.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('snare', time),
        0.36 + snareLevel * 0.5,
      );
      this.hammer.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('hammer', time + 0.005),
        snareLevel * 0.42,
      );
    }

    if (this.isLayerEnabled('hat') && bar.hat[stepInBar] > 0) {
      this.shardHat.triggerAttackRelease(
        '32n',
        this.safeTriggerTime('hat', time),
        bar.hat[stepInBar],
      );
    }

    if (this.isLayerEnabled('hat') && bar.clang[stepInBar] > 0) {
      this.hammer.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('clang', time),
        bar.clang[stepInBar] * 0.9,
      );
    }

    const noiseLevel = isFillBar
      ? Math.max(bar.noise[stepInBar], this.currentSection.fillNoise[stepInBar])
      : bar.noise[stepInBar];
    if ((this.isLayerEnabled('arp') || this.isHighPressurePhase()) && noiseLevel > 0) {
      this.gritNoise.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('noise', time),
        0.14 + noiseLevel * 0.5,
      );
    }

    const bassNote = bar.bass[stepInBar];
    if (this.isLayerEnabled('bass') && bassNote) {
      this.bass.triggerAttackRelease(
        bassNote,
        '16n',
        this.safeTriggerTime('bass', time),
        0.52 + this.currentSection.energy * 0.16,
      );
    }

    const stabChord = bar.stab[stepInBar];
    if ((this.isLayerEnabled('pad') || this.isHighPressurePhase()) && stabChord) {
      this.stab.triggerAttackRelease(
        stabChord,
        '16n',
        this.safeTriggerTime('stab', time),
        0.18 + this.currentSection.energy * 0.12,
      );
    }

    const alarmNote = bar.alarm[stepInBar];
    if ((this.isLayerEnabled('arp') || this.isHighPressurePhase()) && alarmNote) {
      this.alarm.triggerAttackRelease(
        alarmNote,
        '16n',
        this.safeTriggerTime('alarm', time),
        0.16 + this.currentSection.energy * 0.1,
      );
    }

    this.advanceSixteenth();
  }

  override onBar(time: number): void {
    const bar = this.currentBar();
    const phase = this.getCurrentPhase();
    const localBar = this.localBarIndex();

    if (this.isLayerEnabled('pad') || phase === 'boot' || phase === 'outro') {
      this.drone.triggerAttackRelease(
        bar.drone,
        phase === 'climax' || phase === 'boss' ? '2n.' : '1m',
        this.safeTriggerTime('drone', time),
        0.12 + this.currentSection.energy * 0.08,
      );
    }

    if (this.transitionBars > 0) {
      const velocity = 0.22 + this.currentSection.energy * 0.14;
      this.stab.triggerAttackRelease(
        this.currentSection.transitionDrone,
        '8n',
        this.safeTriggerTime('transition:stab', time),
        velocity,
      );
      if (this.currentSection.transitionAlarm?.length) {
        this.alarm.triggerAttackRelease(
          this.currentSection.transitionAlarm[0],
          '16n',
          this.safeTriggerTime('transition:alarm', time + 0.02),
          velocity,
        );
      }
      this.gritNoise.triggerAttackRelease(
        '8n',
        this.safeTriggerTime('transition:noise', time),
        0.18 + this.currentSection.energy * 0.18,
      );
      this.transitionBars -= 1;
    }

    if (this.pressureHits > 0) {
      this.kick.triggerAttackRelease(
        'C1',
        '8n',
        this.safeTriggerTime('pressure:kick', time),
        0.98,
      );
      this.hammer.triggerAttackRelease(
        '8n',
        this.safeTriggerTime('pressure:hammer', time + 0.01),
        0.58,
      );
      this.pressureHits -= 1;
    }

    if (
      localBar > 0 &&
      localBar % this.beatGrid.phraseBars === 0 &&
      this.isHighPressurePhase()
    ) {
      this.gritNoise.triggerAttackRelease(
        '4n',
        this.safeTriggerTime('phrase:noise', time),
        0.24 + this.currentSection.energy * 0.22,
      );
      this.hammer.triggerAttackRelease(
        '8n',
        this.safeTriggerTime('phrase:hammer', time + 0.03),
        0.62,
      );
    }
  }

  override dispose(): void {
    this.kick?.dispose();
    this.bodyHit?.dispose();
    this.shardHat?.dispose();
    this.hammer?.dispose();
    this.gritNoise?.dispose();
    this.bass?.dispose();
    this.stab?.dispose();
    this.drone?.dispose();
    this.alarm?.dispose();
    this.delay?.dispose();
    this.reverb?.dispose();
    this.masterFilter?.dispose();
    this.distortion?.dispose();
    this.compressor?.dispose();
    this.masterBus?.dispose();
    this.kick = null;
    this.bodyHit = null;
    this.shardHat = null;
    this.hammer = null;
    this.gritNoise = null;
    this.bass = null;
    this.stab = null;
    this.drone = null;
    this.alarm = null;
    this.delay = null;
    this.reverb = null;
    this.masterFilter = null;
    this.distortion = null;
    this.compressor = null;
    this.masterBus = null;
    this.resetTransportCounters();
  }

  private currentBar(): FactoryNullBarPattern {
    const bars = this.currentSection.bars;
    return bars[this.localBarIndex() % bars.length];
  }

  private localBarIndex(): number {
    return Math.max(0, this.getCurrentBarIndex() - this.phaseStartBar);
  }

  private isFillBar(): boolean {
    const localBar = this.localBarIndex();
    return localBar % this.beatGrid.phraseBars === this.beatGrid.phraseBars - 1;
  }

  private isHighPressurePhase(): boolean {
    const phase = this.getCurrentPhase();
    return phase === 'build' || phase === 'climax' || phase === 'boss';
  }
}

export const FACTORY_NULL_SONG: ProceduralBGMSongDefinition = {
  id: 'factory-null',
  title: 'Factory Null',
  description: 'Dark industrial techno with distorted kicks, metallic impacts, and cold dystopian stabs.',
  bpm: 132,
  createRuntime(context) {
    return new FactoryNullRuntime(context);
  },
};
