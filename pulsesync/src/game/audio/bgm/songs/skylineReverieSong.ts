import { BaseProceduralBGMRuntime } from '@/game/audio/bgm/BaseProceduralBGMRuntime';
import type {
  SkylineReverieBarPattern,
  SkylineReverieSection,
} from '@/game/audio/bgm/songs/skylineReverieArrangement';
import { SKYLINE_REVERIE_ARRANGEMENTS } from '@/game/audio/bgm/songs/skylineReverieArrangement';
import type {
  ProceduralBGMSongContext,
  ProceduralBGMSongDefinition,
} from '@/game/audio/bgm/types';
import type { PhaseKey, SyncTier } from '@/game/types/GameTypes';

class SkylineReverieRuntime extends BaseProceduralBGMRuntime {
  private masterBus: any = null;
  private drumsBus: any = null;
  private musicBus: any = null;
  private chorus: any = null;
  private reverb: any = null;
  private delay: any = null;
  private kick: any = null;
  private snareNoise: any = null;
  private snareClap: any = null;
  private hat: any = null;
  private openHat: any = null;
  private sparkle: any = null;
  private subBass: any = null;
  private chordPad: any = null;
  private pluck: any = null;
  private lead: any = null;
  private vocalChop: any = null;
  private currentSection: SkylineReverieSection = SKYLINE_REVERIE_ARRANGEMENTS.boot;
  private phaseStartBar = 0;
  private transitionBars = 0;
  private liftPulse = 0;

  constructor({ Tone, beatGrid }: ProceduralBGMSongContext) {
    super(Tone, beatGrid, {
      kick: true,
      bass: false,
      hat: false,
      arp: false,
      pad: false,
    });

    this.masterBus = new Tone.Gain(0.52).toDestination();
    this.drumsBus = new Tone.Gain(0.86).connect(this.masterBus);
    this.musicBus = new Tone.Gain(0.82).connect(this.masterBus);
    this.chorus = new Tone.Chorus({
      frequency: 0.35,
      delayTime: 4.2,
      depth: 0.36,
      spread: 90,
      wet: 0.34,
    }).start().connect(this.musicBus);
    this.reverb = new Tone.Reverb({
      decay: 4.6,
      wet: 0.24,
      preDelay: 0.03,
    }).connect(this.musicBus);
    this.delay = new Tone.PingPongDelay('8n', 0.2).connect(this.musicBus);

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 4.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.28, sustain: 0.02, release: 0.08 },
    }).connect(this.drumsBus);
    this.snareNoise = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
    }).connect(this.drumsBus);
    this.snareClap = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.08, release: 0.04 },
      harmonicity: 6.2,
      resonance: 3200,
      modulationIndex: 18,
      octaves: 1.1,
    }).connect(this.drumsBus);
    this.snareClap.frequency.value = 260;
    this.hat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.04, release: 0.02 },
      harmonicity: 7.8,
      resonance: 4600,
      modulationIndex: 28,
      octaves: 1.2,
    }).connect(this.drumsBus);
    this.hat.frequency.value = 360;
    this.openHat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.16, release: 0.06 },
      harmonicity: 6.8,
      resonance: 4200,
      modulationIndex: 24,
      octaves: 1.3,
    }).connect(this.drumsBus);
    this.openHat.frequency.value = 280;
    this.sparkle = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.004, decay: 0.14, sustain: 0.04, release: 0.18 },
    }).connect(this.delay);
    this.subBass = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.004, decay: 0.14, sustain: 0.2, release: 0.16 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.1,
        release: 0.12,
        baseFrequency: 70,
        octaves: 1.4,
      },
    }).connect(this.musicBus);
    this.chordPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
      envelope: { attack: 0.04, decay: 0.6, sustain: 0.22, release: 1.1 },
    }).connect(this.chorus);
    this.pluck = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.18, sustain: 0.02, release: 0.14 },
    }).connect(this.delay);
    this.lead = new Tone.MonoSynth({
      oscillator: { type: 'pulse', width: 0.3 },
      envelope: { attack: 0.003, decay: 0.12, sustain: 0.08, release: 0.18 },
      filterEnvelope: {
        attack: 0.002,
        decay: 0.08,
        sustain: 0.1,
        release: 0.12,
        baseFrequency: 900,
        octaves: 2.2,
      },
    }).connect(this.delay);
    this.vocalChop = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.8,
      envelope: { attack: 0.002, decay: 0.1, sustain: 0.06, release: 0.14 },
      modulationEnvelope: { attack: 0.001, decay: 0.08, sustain: 0.03, release: 0.12 },
    }).connect(this.reverb);
    this.onSyncChange('dormant');
  }

  override onPhaseChange(phase: PhaseKey): void {
    super.onPhaseChange(phase);
    this.currentSection = SKYLINE_REVERIE_ARRANGEMENTS[phase];
    this.phaseStartBar = this.getCurrentBarIndex();
    this.transitionBars = phase === 'boot' ? 1 : 2;
    this.liftPulse = 2;
  }

  override onSyncChange(tier: SyncTier): void {
    if (!this.masterBus || !this.musicBus || !this.reverb || !this.chorus) {
      return;
    }

    if (tier === 'overdrive') {
      this.masterBus.gain.rampTo(0.64, 0.2);
      this.musicBus.gain.rampTo(0.9, 0.2);
      this.reverb.wet.rampTo(0.3, 0.3);
      this.chorus.wet.rampTo(0.42, 0.3);
      return;
    }

    if (tier === 'surge') {
      this.masterBus.gain.rampTo(0.58, 0.2);
      this.musicBus.gain.rampTo(0.86, 0.2);
      this.reverb.wet.rampTo(0.27, 0.3);
      this.chorus.wet.rampTo(0.38, 0.3);
      return;
    }

    if (tier === 'aligned') {
      this.masterBus.gain.rampTo(0.54, 0.2);
      this.musicBus.gain.rampTo(0.82, 0.2);
      this.reverb.wet.rampTo(0.24, 0.3);
      this.chorus.wet.rampTo(0.34, 0.3);
      return;
    }

    this.masterBus.gain.rampTo(0.5, 0.2);
    this.musicBus.gain.rampTo(0.78, 0.2);
    this.reverb.wet.rampTo(0.2, 0.3);
    this.chorus.wet.rampTo(0.3, 0.3);
  }

  override onPhrase(): void {
    const phase = this.getCurrentPhase();
    if (phase === 'build' || phase === 'climax' || phase === 'boss') {
      this.liftPulse = 1;
    }
  }

  override onSixteenth(time: number): void {
    const stepInBar = this.getStepInBar();
    const bar = this.currentBar();
    const isFillBar = this.isFillBar();

    const kickLevel = bar.kick[stepInBar];
    if (this.isLayerEnabled('kick', true) && kickLevel > 0) {
      this.kick.triggerAttackRelease(
        'C1',
        '16n',
        this.safeTriggerTime('kick', time),
        kickLevel * (0.8 + this.currentSection.energy * 0.14),
      );
      this.applySidechainPump(time, 0.28 + kickLevel * 0.18);
    }

    const snareLevel = isFillBar
      ? Math.max(bar.snare[stepInBar], this.currentSection.fillSnare[stepInBar])
      : bar.snare[stepInBar];
    if (snareLevel > 0) {
      this.snareNoise.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('snare:noise', time),
        0.16 + snareLevel * 0.42,
      );
      this.snareClap.triggerAttackRelease(
        '32n',
        this.safeTriggerTime('snare:clap', time + 0.004),
        snareLevel * 0.52,
      );
    }

    const hatLevel = isFillBar
      ? Math.max(bar.hat[stepInBar], this.currentSection.fillHat[stepInBar])
      : bar.hat[stepInBar];
    if (this.isLayerEnabled('hat') && hatLevel > 0) {
      this.hat.triggerAttackRelease(
        '64n',
        this.safeTriggerTime('hat', time),
        hatLevel,
      );
      if (hatLevel >= 0.18) {
        const rollOffset = this.sixteenthDurationSeconds() * 0.5;
        this.hat.triggerAttackRelease(
          '64n',
          this.safeTriggerTime('hat:roll', time + rollOffset),
          hatLevel * 0.68,
        );
      }
    }

    const openHatLevel = bar.openHat[stepInBar];
    if (this.isLayerEnabled('hat') && openHatLevel > 0) {
      this.openHat.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('openHat', time),
        openHatLevel,
      );
    }

    const subNote = bar.sub[stepInBar];
    if (this.isLayerEnabled('bass') && subNote) {
      this.subBass.triggerAttackRelease(
        subNote,
        '16n',
        this.safeTriggerTime('sub', time),
        0.48 + this.currentSection.energy * 0.14,
      );
    }

    const pluckNote = bar.pluck[stepInBar];
    if ((this.isLayerEnabled('arp') || this.getCurrentPhase() === 'tutorial') && pluckNote) {
      this.pluck.triggerAttackRelease(
        pluckNote,
        '16n',
        this.safeTriggerTime('pluck', time),
        0.18 + this.currentSection.energy * 0.1,
      );
    }

    const leadNote = bar.lead[stepInBar];
    if (this.shouldPlayLead() && leadNote) {
      this.lead.triggerAttackRelease(
        leadNote,
        '16n',
        this.safeTriggerTime('lead', time),
        0.18 + this.currentSection.energy * 0.12,
      );
    }

    const vocalChord = bar.vocal[stepInBar];
    if ((this.isLayerEnabled('arp') || this.shouldPlayLead()) && vocalChord) {
      this.vocalChop.triggerAttackRelease(
        vocalChord,
        '16n',
        this.safeTriggerTime('vocal', time),
        0.14 + this.currentSection.energy * 0.1,
      );
    }

    if (bar.sparkle[stepInBar] > 0) {
      this.sparkle.triggerAttackRelease(
        ['F#6', 'A6'],
        '32n',
        this.safeTriggerTime('sparkle', time),
        bar.sparkle[stepInBar] * 0.34,
      );
    }

    this.advanceSixteenth();
  }

  override onBar(time: number): void {
    const bar = this.currentBar();
    const phase = this.getCurrentPhase();
    const localBar = this.localBarIndex();

    if (this.isLayerEnabled('pad') || phase === 'boot' || phase === 'outro') {
      this.chordPad.triggerAttackRelease(
        bar.chord,
        phase === 'climax' || phase === 'boss' ? '2n.' : '1m',
        this.safeTriggerTime('chord', time),
        0.16 + this.currentSection.energy * 0.08,
      );
    }

    if (this.transitionBars > 0) {
      const velocity = 0.2 + this.currentSection.energy * 0.12;
      this.chordPad.triggerAttackRelease(
        this.currentSection.transitionChord,
        '2n',
        this.safeTriggerTime('transition:chord', time),
        velocity,
      );
      if (this.currentSection.transitionLead?.length) {
        this.pluck.triggerAttackRelease(
          this.currentSection.transitionLead[0],
          '8n',
          this.safeTriggerTime('transition:lead', time + 0.02),
          velocity + 0.06,
        );
      }
      this.transitionBars -= 1;
    }

    if (this.liftPulse > 0) {
      this.sparkle.triggerAttackRelease(
        ['D6', 'F#6', 'A6'],
        '8n',
        this.safeTriggerTime('lift:sparkle', time),
        0.28,
      );
      this.liftPulse -= 1;
    }

    if (
      localBar > 0 &&
      localBar % this.beatGrid.phraseBars === 0 &&
      (phase === 'build' || phase === 'climax' || phase === 'boss')
    ) {
      this.vocalChop.triggerAttackRelease(
        ['F#5', 'A5', 'B5'],
        '8n',
        this.safeTriggerTime('phrase:vocal', time + 0.02),
        0.24 + this.currentSection.energy * 0.08,
      );
      this.pluck.triggerAttackRelease(
        'D6',
        '8n',
        this.safeTriggerTime('phrase:pluck', time),
        0.22,
      );
    }
  }

  override dispose(): void {
    this.kick?.dispose();
    this.snareNoise?.dispose();
    this.snareClap?.dispose();
    this.hat?.dispose();
    this.openHat?.dispose();
    this.sparkle?.dispose();
    this.subBass?.dispose();
    this.chordPad?.dispose();
    this.pluck?.dispose();
    this.lead?.dispose();
    this.vocalChop?.dispose();
    this.delay?.dispose();
    this.reverb?.dispose();
    this.chorus?.dispose();
    this.drumsBus?.dispose();
    this.musicBus?.dispose();
    this.masterBus?.dispose();
    this.kick = null;
    this.snareNoise = null;
    this.snareClap = null;
    this.hat = null;
    this.openHat = null;
    this.sparkle = null;
    this.subBass = null;
    this.chordPad = null;
    this.pluck = null;
    this.lead = null;
    this.vocalChop = null;
    this.delay = null;
    this.reverb = null;
    this.chorus = null;
    this.drumsBus = null;
    this.musicBus = null;
    this.masterBus = null;
    this.resetTransportCounters();
  }

  private currentBar(): SkylineReverieBarPattern {
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

  private shouldPlayLead(): boolean {
    const phase = this.getCurrentPhase();
    return phase === 'build' || phase === 'climax' || phase === 'boss' || this.liftPulse > 0;
  }

  private applySidechainPump(time: number, amount: number): void {
    if (!this.musicBus) {
      return;
    }

    const floor = Math.max(0.32, 0.82 - amount);
    this.musicBus.gain.cancelAndHoldAtTime(time);
    this.musicBus.gain.setValueAtTime(floor, time);
    this.musicBus.gain.linearRampToValueAtTime(0.82, time + this.sixteenthDurationSeconds() * 0.95);
  }

  private sixteenthDurationSeconds(): number {
    return 60 / this.beatGrid.bpm / 4;
  }
}

export const SKYLINE_REVERIE_SONG: ProceduralBGMSongDefinition = {
  id: 'skyline-reverie',
  title: 'Skyline Reverie',
  description: 'Colorful future bass with half-time drums, warm chord stacks, vocal chops, and sunset nostalgia.',
  bpm: 122,
  createRuntime(context) {
    return new SkylineReverieRuntime(context);
  },
};
