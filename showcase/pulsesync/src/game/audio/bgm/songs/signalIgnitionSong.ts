import { BaseProceduralBGMRuntime } from '@/game/audio/bgm/BaseProceduralBGMRuntime';
import type { SongSection } from '@/game/audio/bgm/arrangementTypes';
import type {
  ProceduralBGMSongContext,
  ProceduralBGMSongDefinition,
} from '@/game/audio/bgm/types';
import type { PhaseKey, SyncTier } from '@/game/types/GameTypes';
import { SIGNAL_IGNITION_ARRANGEMENTS } from '@/game/audio/bgm/songs/signalIgnitionArrangement';

class SignalIgnitionRuntime extends BaseProceduralBGMRuntime {
  private musicBus: any = null;
  private reverb: any = null;
  private delay: any = null;
  private kick: any = null;
  private snare: any = null;
  private hat: any = null;
  private openHat: any = null;
  private accent: any = null;
  private bass: any = null;
  private chord: any = null;
  private arp: any = null;
  private lead: any = null;
  private riser: any = null;
  private currentSection: SongSection = SIGNAL_IGNITION_ARRANGEMENTS.boot;
  private phaseStartBar = 0;
  private transitionBars = 0;
  private dropPulse = 0;

  constructor({ Tone, beatGrid }: ProceduralBGMSongContext) {
    super(Tone, beatGrid, {
      kick: true,
      bass: false,
      hat: false,
      arp: false,
      pad: false,
    });

    this.musicBus = new Tone.Gain(0.55).toDestination();
    this.reverb = new Tone.Reverb({ decay: 3.2, wet: 0.22 }).connect(this.musicBus);
    this.delay = new Tone.PingPongDelay('8n', 0.18).connect(this.musicBus);
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.035,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.32, sustain: 0.02, release: 0.08 },
    }).connect(this.musicBus);
    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.03 },
    }).connect(this.musicBus);
    this.hat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.045, release: 0.02 },
      harmonicity: 5.1,
      resonance: 2800,
      modulationIndex: 22,
      octaves: 1.5,
    }).connect(this.musicBus);
    this.hat.frequency.value = 280;
    this.openHat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.2, release: 0.08 },
      harmonicity: 5.4,
      resonance: 3600,
      modulationIndex: 28,
      octaves: 1.5,
    }).connect(this.reverb);
    this.openHat.frequency.value = 220;
    this.accent = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.34, release: 0.12 },
      harmonicity: 3.4,
      resonance: 4200,
      modulationIndex: 18,
      octaves: 2,
    }).connect(this.reverb);
    this.accent.frequency.value = 180;
    this.bass = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.005, decay: 0.14, sustain: 0.28, release: 0.18 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0.24,
        release: 0.22,
        baseFrequency: 70,
        octaves: 2.4,
      },
    }).connect(this.musicBus);
    this.chord = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.4,
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.24, release: 0.7 },
    }).connect(this.reverb);
    this.arp = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.12, sustain: 0.08, release: 0.18 },
    }).connect(this.delay);
    this.lead = new Tone.MonoSynth({
      oscillator: { type: 'pulse', width: 0.22 },
      envelope: { attack: 0.003, decay: 0.08, sustain: 0.1, release: 0.24 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.12,
        release: 0.16,
        baseFrequency: 540,
        octaves: 2.6,
      },
    }).connect(this.delay);
    this.riser = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.02, decay: 0.6, sustain: 0.05, release: 0.3 },
    }).connect(this.reverb);
    this.onSyncChange('dormant');
  }

  override onPhaseChange(phase: PhaseKey): void {
    super.onPhaseChange(phase);
    this.currentSection = SIGNAL_IGNITION_ARRANGEMENTS[phase];
    this.phaseStartBar = this.getCurrentBarIndex();
    this.transitionBars = 2;
    this.dropPulse = 2;
  }

  override onSyncChange(tier: SyncTier): void {
    if (!this.musicBus || !this.reverb) {
      return;
    }

    if (tier === 'overdrive') {
      this.musicBus.gain.rampTo(0.76, 0.2);
      this.reverb.wet.rampTo(0.32, 0.3);
      return;
    }

    if (tier === 'surge') {
      this.musicBus.gain.rampTo(0.68, 0.2);
      this.reverb.wet.rampTo(0.27, 0.3);
      return;
    }

    if (tier === 'aligned') {
      this.musicBus.gain.rampTo(0.6, 0.2);
      this.reverb.wet.rampTo(0.22, 0.3);
      return;
    }

    this.musicBus.gain.rampTo(0.52, 0.2);
    this.reverb.wet.rampTo(0.18, 0.3);
  }

  override onPhrase(): void {
    const phase = this.getCurrentPhase();
    if (phase === 'build' || phase === 'climax' || phase === 'boss') {
      this.dropPulse = 1;
    }
  }

  override onSixteenth(time: number): void {
    const stepInBar = this.getStepInBar();
    const sectionBar = this.currentSectionBar();
    const isFillBar = this.isFillBar();

    if (this.isLayerEnabled('kick', true) && sectionBar.kick[stepInBar] > 0) {
      this.kick.triggerAttackRelease(
        'C1',
        '16n',
        this.safeTriggerTime('kick', time),
        sectionBar.kick[stepInBar] * (0.78 + this.currentSection.energy * 0.18),
      );
    }

    const snareLevel = isFillBar
      ? Math.max(sectionBar.snare[stepInBar], this.currentSection.fillSnare[stepInBar])
      : sectionBar.snare[stepInBar];
    if (snareLevel > 0) {
      this.snare.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('snare', time),
        snareLevel,
      );
    }

    if (this.isLayerEnabled('hat') && sectionBar.hat[stepInBar] > 0) {
      this.hat.triggerAttackRelease(
        '32n',
        this.safeTriggerTime('hat', time),
        sectionBar.hat[stepInBar],
      );
    }

    const openHatLevel = sectionBar.openHat[stepInBar];
    if (this.isLayerEnabled('hat') && openHatLevel > 0) {
      this.openHat.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('openHat', time),
        openHatLevel,
      );
    }

    if (sectionBar.accent[stepInBar] > 0) {
      this.accent.triggerAttackRelease(
        '16n',
        this.safeTriggerTime('accent', time),
        sectionBar.accent[stepInBar] * 0.54,
      );
    }

    const bassNote = sectionBar.bass[stepInBar];
    if (this.isLayerEnabled('bass') && bassNote) {
      this.bass.triggerAttackRelease(
        bassNote,
        '16n',
        this.safeTriggerTime('bass', time),
        0.52 + this.currentSection.energy * 0.14,
      );
    }

    const arpNote = sectionBar.arp[stepInBar];
    if ((this.isLayerEnabled('arp') || this.getCurrentPhase() === 'tutorial') && arpNote) {
      this.arp.triggerAttackRelease(
        arpNote,
        '16n',
        this.safeTriggerTime('arp', time),
        0.18 + this.currentSection.energy * 0.1,
      );
    }

    const leadNote = sectionBar.lead[stepInBar];
    if (this.shouldPlayLead() && leadNote) {
      this.lead.triggerAttackRelease(
        leadNote,
        '16n',
        this.safeTriggerTime('lead', time),
        0.24 + this.currentSection.energy * 0.14,
      );
    }

    if (isFillBar && this.currentSection.fillHat[stepInBar] > 0) {
      this.hat.triggerAttackRelease(
        '64n',
        this.safeTriggerTime('hat', time),
        this.currentSection.fillHat[stepInBar] * 0.62,
      );
    }

    this.advanceSixteenth();
  }

  override onBar(time: number): void {
    const bar = this.currentSectionBar();
    const localBar = this.localBarIndex();
    const phase = this.getCurrentPhase();

    if (this.isLayerEnabled('pad') || phase === 'boot' || phase === 'outro') {
      this.chord.triggerAttackRelease(
        bar.chord,
        phase === 'climax' || phase === 'boss' ? '2n.' : '1m',
        this.safeTriggerTime('chord', time),
        0.16 + this.currentSection.energy * 0.08,
      );
    }

    if (this.transitionBars > 0) {
      const velocity = 0.24 + this.currentSection.energy * 0.12;
      this.chord.triggerAttackRelease(
        this.currentSection.transitionChord,
        '2n',
        this.safeTriggerTime('chord', time),
        velocity,
      );
      if (this.currentSection.transitionLead?.length) {
        this.lead.triggerAttackRelease(
          this.currentSection.transitionLead[0],
          '8n',
          this.safeTriggerTime('lead', time),
          velocity + 0.08,
        );
      }
      this.riser.triggerAttackRelease(
        '2n',
        this.safeTriggerTime('riser', time),
        0.16 + this.currentSection.energy * 0.18,
      );
      this.transitionBars -= 1;
    }

    if (this.dropPulse > 0) {
      this.accent.triggerAttackRelease(
        '8n',
        this.safeTriggerTime('accent', time),
        0.65,
      );
      this.kick.triggerAttackRelease(
        'C1',
        '8n',
        this.safeTriggerTime('kick', time),
        0.96,
      );
      this.dropPulse -= 1;
    }

    if (
      localBar > 0 &&
      localBar % this.beatGrid.phraseBars === 0 &&
      (phase === 'build' || phase === 'climax' || phase === 'boss')
    ) {
      this.riser.triggerAttackRelease(
        '4n',
        this.safeTriggerTime('riser', time),
        0.16 + this.currentSection.energy * 0.12,
      );
      this.accent.triggerAttackRelease(
        '8n',
        this.safeTriggerTime('accent', time + 0.02),
        0.52,
      );
    }
  }

  override dispose(): void {
    this.reverb?.dispose();
    this.delay?.dispose();
    this.kick?.dispose();
    this.snare?.dispose();
    this.hat?.dispose();
    this.openHat?.dispose();
    this.accent?.dispose();
    this.bass?.dispose();
    this.chord?.dispose();
    this.arp?.dispose();
    this.lead?.dispose();
    this.riser?.dispose();
    this.musicBus?.dispose();
    this.reverb = null;
    this.delay = null;
    this.kick = null;
    this.snare = null;
    this.hat = null;
    this.openHat = null;
    this.accent = null;
    this.bass = null;
    this.chord = null;
    this.arp = null;
    this.lead = null;
    this.riser = null;
    this.musicBus = null;
    this.resetTransportCounters();
  }

  private currentSectionBar() {
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
    return phase === 'climax' || phase === 'boss' || this.dropPulse > 0;
  }
}

export const SIGNAL_IGNITION_SONG: ProceduralBGMSongDefinition = {
  id: 'signal-ignition',
  title: 'Signal Ignition',
  description: 'Original synth-driven combat arrangement used by the demo.',
  bpm: 128,
  createRuntime(context) {
    return new SignalIgnitionRuntime(context);
  },
};
