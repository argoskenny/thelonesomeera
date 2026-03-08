import { BaseProceduralBGMRuntime } from '@/game/audio/bgm/BaseProceduralBGMRuntime';
import type {
  MidnightTransitBarPattern,
  MidnightTransitSection,
} from '@/game/audio/bgm/songs/midnightTransitArrangement';
import { MIDNIGHT_TRANSIT_ARRANGEMENTS } from '@/game/audio/bgm/songs/midnightTransitArrangement';
import type {
  ProceduralBGMSongContext,
  ProceduralBGMSongDefinition,
} from '@/game/audio/bgm/types';
import type { PhaseKey, SyncTier } from '@/game/types/GameTypes';

class MidnightTransitRuntime extends BaseProceduralBGMRuntime {
  private static readonly ENABLE_PAD = true;
  private masterBus: any = null;
  private drumsBus: any = null;
  private musicBus: any = null;
  private ambienceBus: any = null;
  private reverb: any = null;
  private delay: any = null;
  private ambienceFilter: any = null;
  private kick: any = null;
  private snare: any = null;
  private ghost: any = null;
  private hat: any = null;
  private ride: any = null;
  private rim: any = null;
  private subBass: any = null;
  private piano: any = null;
  private pad: any = null;
  private lead: any = null;
  private drone: any = null;
  private chime: any = null;
  private rain: any = null;
  private air: any = null;
  private currentSection: MidnightTransitSection = MIDNIGHT_TRANSIT_ARRANGEMENTS.boot;
  private phaseStartBar = 0;
  private transitionBars = 0;
  private motionLift = 0;

  constructor({ Tone, beatGrid }: ProceduralBGMSongContext) {
    super(Tone, beatGrid, {
      kick: true,
      bass: false,
      hat: false,
      arp: false,
      pad: false,
    });

    this.masterBus = new Tone.Gain(0.5).toDestination();
    this.drumsBus = new Tone.Gain(0.86).connect(this.masterBus);
    this.musicBus = new Tone.Gain(0.84).connect(this.masterBus);
    this.ambienceBus = new Tone.Gain(0.5).connect(this.masterBus);
    this.reverb = new Tone.Reverb({
      decay: 7.2,
      wet: 0.3,
      preDelay: 0.04,
    }).connect(this.musicBus);
    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n.',
      feedback: 0.28,
      wet: 0.2,
    }).connect(this.reverb);
    this.ambienceFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 2600,
      rolloff: -24,
      Q: 0.4,
    }).connect(this.ambienceBus);

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.045,
      octaves: 5.2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.24, sustain: 0.02, release: 0.08 },
    }).connect(this.drumsBus);
    this.snare = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
    }).connect(this.drumsBus);
    this.ghost = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
    }).connect(this.drumsBus);
    this.hat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
      harmonicity: 6.8,
      resonance: 4200,
      modulationIndex: 26,
      octaves: 1.1,
    }).connect(this.drumsBus);
    this.hat.frequency.value = 330;
    this.ride = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.14, release: 0.06 },
      harmonicity: 5.9,
      resonance: 3600,
      modulationIndex: 18,
      octaves: 1.3,
    }).connect(this.drumsBus);
    this.ride.frequency.value = 280;
    this.rim = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, release: 0.03 },
      harmonicity: 3.4,
      resonance: 2600,
      modulationIndex: 14,
      octaves: 0.8,
    }).connect(this.drumsBus);
    this.rim.frequency.value = 440;
    this.subBass = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.16, sustain: 0.24, release: 0.18 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.12,
        sustain: 0.16,
        release: 0.16,
        baseFrequency: 60,
        octaves: 1.4,
      },
    }).connect(this.musicBus);
    this.piano = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.4,
      envelope: { attack: 0.01, decay: 0.28, sustain: 0.1, release: 0.4 },
      modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.03, release: 0.24 },
    }).connect(this.reverb);
    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 22 },
      envelope: { attack: 0.18, decay: 1.6, sustain: 0.18, release: 3.8 },
    }).connect(this.delay);
    this.lead = new Tone.MonoSynth({
      portamento: 0.045,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.14, sustain: 0.18, release: 0.34 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.14,
        sustain: 0.18,
        release: 0.26,
        baseFrequency: 680,
        octaves: 2.2,
      },
    }).connect(this.delay);
    this.drone = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.18, decay: 1.2, sustain: 0.48, release: 2.8 },
    }).connect(this.reverb);
    this.chime = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.1,
      envelope: { attack: 0.01, decay: 0.16, sustain: 0.08, release: 0.5 },
      modulationEnvelope: { attack: 0.01, decay: 0.12, sustain: 0.04, release: 0.28 },
    }).connect(this.delay);
    this.rain = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.05, release: 0.34 },
    }).connect(this.ambienceFilter);
    this.air = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.04, decay: 0.42, sustain: 0.06, release: 0.52 },
    }).connect(this.ambienceFilter);
    this.onSyncChange('dormant');
  }

  override onPhaseChange(phase: PhaseKey): void {
    super.onPhaseChange(phase);
    this.currentSection = MIDNIGHT_TRANSIT_ARRANGEMENTS[phase];
    this.phaseStartBar = this.getCurrentBarIndex();
    this.transitionBars = phase === 'boot' ? 1 : 2;
    this.motionLift = phase === 'build' || phase === 'climax' || phase === 'boss' ? 2 : 1;
  }

  override onSyncChange(tier: SyncTier): void {
    if (!this.masterBus || !this.musicBus || !this.reverb || !this.delay || !this.ambienceBus || !this.ambienceFilter) {
      return;
    }

    if (tier === 'overdrive') {
      this.masterBus.gain.rampTo(0.64, 0.2);
      this.musicBus.gain.rampTo(0.9, 0.2);
      this.reverb.wet.rampTo(0.38, 0.3);
      this.delay.wet.rampTo(0.26, 0.3);
      this.ambienceBus.gain.rampTo(0.62, 0.3);
      this.ambienceFilter.frequency.rampTo(3200, 0.3);
      return;
    }

    if (tier === 'surge') {
      this.masterBus.gain.rampTo(0.58, 0.2);
      this.musicBus.gain.rampTo(0.86, 0.2);
      this.reverb.wet.rampTo(0.34, 0.3);
      this.delay.wet.rampTo(0.22, 0.3);
      this.ambienceBus.gain.rampTo(0.56, 0.3);
      this.ambienceFilter.frequency.rampTo(2900, 0.3);
      return;
    }

    if (tier === 'aligned') {
      this.masterBus.gain.rampTo(0.54, 0.2);
      this.musicBus.gain.rampTo(0.82, 0.2);
      this.reverb.wet.rampTo(0.3, 0.3);
      this.delay.wet.rampTo(0.18, 0.3);
      this.ambienceBus.gain.rampTo(0.5, 0.3);
      this.ambienceFilter.frequency.rampTo(2600, 0.3);
      return;
    }

    this.masterBus.gain.rampTo(0.48, 0.2);
    this.musicBus.gain.rampTo(0.76, 0.2);
    this.reverb.wet.rampTo(0.26, 0.3);
    this.delay.wet.rampTo(0.14, 0.3);
    this.ambienceBus.gain.rampTo(0.44, 0.3);
    this.ambienceFilter.frequency.rampTo(2200, 0.3);
  }

  override onPhrase(): void {
    const phase = this.getCurrentPhase();
    if (phase === 'build' || phase === 'climax' || phase === 'boss') {
      this.motionLift = 2;
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
        this.safeTriggerTime('kick', time + this.stepOffset(stepInBar, 'kick')),
        kickLevel * (0.8 + this.currentSection.energy * 0.16),
      );
    }

    const snareLevel = bar.snare[stepInBar];
    if (snareLevel > 0) {
      const snareTime = this.safeTriggerTime('snare', time + this.stepOffset(stepInBar, 'snare'));
      if (snareLevel >= 0.44) {
        this.ghost.triggerAttackRelease(
          'D4',
          '64n',
          this.safeTriggerTime('snare:drag', snareTime - this.sixteenthDurationSeconds() * 0.18),
          snareLevel * 0.2,
        );
      }
      this.snare.triggerAttackRelease(
        '16n',
        snareTime,
        0.16 + snareLevel * 0.48,
      );
    }

    const ghostLevel = isFillBar
      ? Math.max(bar.ghost[stepInBar], this.currentSection.fillGhost[stepInBar])
      : bar.ghost[stepInBar];
    if (ghostLevel > 0) {
      this.ghost.triggerAttackRelease(
        stepInBar % 4 === 2 ? 'F#4' : 'E4',
        '64n',
        this.safeTriggerTime('ghost', time + this.stepOffset(stepInBar, 'ghost')),
        ghostLevel * 0.46,
      );
    }

    const hatLevel = isFillBar
      ? Math.max(bar.hat[stepInBar], this.currentSection.fillHat[stepInBar])
      : bar.hat[stepInBar];
    if (this.isLayerEnabled('hat') && hatLevel > 0) {
      const hatTime = this.safeTriggerTime('hat', time + this.stepOffset(stepInBar, 'hat'));
      this.hat.triggerAttackRelease('64n', hatTime, hatLevel);
      if (hatLevel >= 0.16 || stepInBar % 8 === 7) {
        this.hat.triggerAttackRelease(
          '64n',
          this.safeTriggerTime('hat:roll', hatTime + this.sixteenthDurationSeconds() * 0.42),
          hatLevel * 0.66,
        );
      }
    }

    if (this.isLayerEnabled('hat') && bar.ride[stepInBar] > 0) {
      this.ride.triggerAttackRelease(
        '32n',
        this.safeTriggerTime('ride', time + this.stepOffset(stepInBar, 'ride')),
        bar.ride[stepInBar] * 0.82,
      );
    }

    if (bar.rim[stepInBar] > 0) {
      this.rim.triggerAttackRelease(
        '64n',
        this.safeTriggerTime('rim', time + this.stepOffset(stepInBar, 'rim')),
        bar.rim[stepInBar] * 0.7,
      );
    }

    const subNote = bar.sub[stepInBar];
    if (this.isLayerEnabled('bass') && subNote) {
      this.subBass.triggerAttackRelease(
        subNote,
        '16n',
        this.safeTriggerTime('sub', time),
        0.5 + this.currentSection.energy * 0.14,
      );
    }

    const pianoChord = bar.piano[stepInBar];
    if ((this.isLayerEnabled('pad') || this.getCurrentPhase() === 'boot') && pianoChord) {
      this.piano.triggerAttackRelease(
        pianoChord,
        stepInBar % 4 === 3 ? '16n' : '8n',
        this.safeTriggerTime('piano', time),
        0.18 + this.currentSection.energy * 0.12,
      );
    }

    const leadNote = bar.lead[stepInBar];
    if ((this.isLayerEnabled('arp') || this.shouldPlayLead()) && leadNote) {
      this.lead.triggerAttackRelease(
        leadNote,
        stepInBar % 2 === 0 ? '8n' : '16n',
        this.safeTriggerTime('lead', time + this.stepOffset(stepInBar, 'lead')),
        0.18 + this.currentSection.energy * 0.12,
      );
    }

    const chimeNote = bar.chime[stepInBar];
    if ((this.isLayerEnabled('arp') || this.shouldPlayLead()) && chimeNote) {
      this.chime.triggerAttackRelease(
        chimeNote,
        '8n',
        this.safeTriggerTime('chime', time + this.stepOffset(stepInBar, 'lead') + 0.01),
        0.12 + this.currentSection.energy * 0.08,
      );
    }

    if (bar.rain[stepInBar] > 0) {
      this.rain.triggerAttackRelease(
        stepInBar % 4 === 0 ? '8n' : '16n',
        this.safeTriggerTime('rain', time + this.stepOffset(stepInBar, 'ambience')),
        bar.rain[stepInBar] * 0.36,
      );
    }

    if (bar.air[stepInBar] > 0) {
      this.air.triggerAttackRelease(
        '8n',
        this.safeTriggerTime('air', time + this.stepOffset(stepInBar, 'ambience') + 0.01),
        bar.air[stepInBar] * 0.28,
      );
    }

    this.advanceSixteenth();
  }

  override onBar(time: number): void {
    const bar = this.currentBar();
    const localBar = this.localBarIndex();
    const phase = this.getCurrentPhase();

    this.drone.triggerAttackRelease(
      this.lowerChord(bar.chord, 2),
      '1m',
      this.safeTriggerTime('drone', time),
      0.06 + this.currentSection.energy * 0.08,
    );

    if (
      MidnightTransitRuntime.ENABLE_PAD &&
      (this.isLayerEnabled('pad') || phase === 'boot' || phase === 'outro') &&
      localBar % 2 === 0
    ) {
      this.pad.triggerAttackRelease(
        bar.chord,
        phase === 'climax' || phase === 'boss' ? '2m' : '1m',
        this.safeTriggerTime('pad', time),
        0.11 + this.currentSection.energy * 0.06,
      );
    }

    if (this.transitionBars > 0) {
      const velocity = 0.18 + this.currentSection.energy * 0.12;
      this.piano.triggerAttackRelease(
        this.currentSection.transitionChord,
        '2n',
        this.safeTriggerTime('transition:piano', time),
        velocity,
      );
      this.triggerTransitionLead(time + 0.02, velocity);
      this.transitionBars -= 1;
    }

    if (this.motionLift > 0) {
      this.triggerLiftFigure(time + this.sixteenthDurationSeconds(), 0.16 + this.currentSection.energy * 0.04);
      this.motionLift -= 1;
    }

    if (
      localBar > 0 &&
      localBar % this.beatGrid.phraseBars === 0 &&
      (phase === 'build' || phase === 'climax' || phase === 'boss')
    ) {
      this.air.triggerAttackRelease(
        '2n',
        this.safeTriggerTime('phrase:air', time),
        0.22,
      );
      this.rain.triggerAttackRelease(
        '4n',
        this.safeTriggerTime('phrase:rain', time + 0.03),
        0.18,
      );
      this.chime.triggerAttackRelease(
        ['D6', 'F#6'],
        '8n',
        this.safeTriggerTime('phrase:chime', time + 0.05),
        0.16,
      );
    }
  }

  override dispose(): void {
    this.kick?.dispose();
    this.snare?.dispose();
    this.ghost?.dispose();
    this.hat?.dispose();
    this.ride?.dispose();
    this.rim?.dispose();
    this.subBass?.dispose();
    this.piano?.dispose();
    this.pad?.dispose();
    this.lead?.dispose();
    this.drone?.dispose();
    this.chime?.dispose();
    this.rain?.dispose();
    this.air?.dispose();
    this.ambienceFilter?.dispose();
    this.delay?.dispose();
    this.reverb?.dispose();
    this.drumsBus?.dispose();
    this.musicBus?.dispose();
    this.ambienceBus?.dispose();
    this.masterBus?.dispose();
    this.kick = null;
    this.snare = null;
    this.ghost = null;
    this.hat = null;
    this.ride = null;
    this.rim = null;
    this.subBass = null;
    this.piano = null;
    this.pad = null;
    this.lead = null;
    this.drone = null;
    this.chime = null;
    this.rain = null;
    this.air = null;
    this.ambienceFilter = null;
    this.delay = null;
    this.reverb = null;
    this.drumsBus = null;
    this.musicBus = null;
    this.ambienceBus = null;
    this.masterBus = null;
    this.resetTransportCounters();
  }

  private currentBar(): MidnightTransitBarPattern {
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
    return phase === 'tutorial' || phase === 'build' || phase === 'climax' || phase === 'boss' || this.motionLift > 0;
  }

  private sixteenthDurationSeconds(): number {
    return 60 / this.beatGrid.bpm / 4;
  }

  private stepOffset(
    step: number,
    lane: 'kick' | 'snare' | 'ghost' | 'hat' | 'ride' | 'rim' | 'lead' | 'ambience',
  ): number {
    const sixteenth = this.sixteenthDurationSeconds();
    const swing = step % 2 === 1 ? sixteenth * 0.08 : 0;

    switch (lane) {
      case 'kick':
        return (step % 8 === 3 ? -sixteenth * 0.03 : 0) + swing * 0.18;
      case 'snare':
        return (step % 8 === 4 ? sixteenth * 0.02 : 0) + swing * 0.4;
      case 'ghost':
        return swing * 0.7;
      case 'hat':
        return swing;
      case 'ride':
        return swing * 0.8 + (step % 4 === 3 ? sixteenth * 0.02 : 0);
      case 'rim':
        return swing * 0.9 - (step % 8 === 6 ? sixteenth * 0.03 : 0);
      case 'lead':
        return step % 4 === 3 ? sixteenth * 0.03 : 0;
      case 'ambience':
        return swing * 0.5;
    }
  }

  private lowerChord(notes: string[], octaves: number): string[] {
    return notes.map((note) =>
      note.replace(/(-?\d+)$/, (_match, octave: string) => String(Number(octave) - octaves)),
    );
  }

  private triggerTransitionLead(time: number, velocity: number): void {
    if (!this.currentSection.transitionLead?.length) {
      return;
    }

    const step = this.sixteenthDurationSeconds() * 2;
    this.currentSection.transitionLead.forEach((note, index) => {
      const triggerTime = time + step * index;
      this.lead.triggerAttackRelease(
        note,
        '8n',
        this.safeTriggerTime(`transition:lead:${index}`, triggerTime),
        Math.max(0.12, velocity - index * 0.02),
      );
    });
  }

  private triggerLiftFigure(time: number, velocity: number): void {
    const phrase = this.getCurrentPhase() === 'boss'
      ? ['F#5', 'A5', 'B5', 'D6']
      : ['A5', 'B5', 'D6'];
    const step = this.sixteenthDurationSeconds() * 2;

    phrase.forEach((note, index) => {
      const triggerTime = time + step * index;
      this.lead.triggerAttackRelease(
        note,
        '8n',
        this.safeTriggerTime(`lift:${index}`, triggerTime),
        Math.max(0.12, velocity - index * 0.02),
      );
      if (index === phrase.length - 1) {
        this.chime.triggerAttackRelease(
          note,
          '8n',
          this.safeTriggerTime(`lift:chime:${index}`, triggerTime + 0.01),
          velocity * 0.8,
        );
      }
    });
  }
}

export const MIDNIGHT_TRANSIT_SONG: ProceduralBGMSongDefinition = {
  id: 'midnight-transit',
  title: 'Midnight Transit',
  description: 'Rain-soaked liquid transit with broken drum patterns, continuous melodic lines, sub bass, station drones, and nocturnal ambience.',
  bpm: 126,
  createRuntime(context) {
    return new MidnightTransitRuntime(context);
  },
};
