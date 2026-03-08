import type { GameEventMap } from '@/game/types/GameEvents';
import type { BeatGrid } from '@/game/types/GameTypes';
import { EventBus } from '@/game/systems/EventBus';
import {
  getBeatSnapshot,
  type BeatChannel,
  type BeatSnapshot,
  scanBeatTransitions,
} from '@/game/systems/beatMath';
import { getTone, type ToneModule } from '@/game/systems/toneRuntime';

const CHANNEL_TO_EVENT: Record<BeatChannel, keyof GameEventMap> = {
  quarter: 'beat:quarter',
  half: 'beat:half',
  beat: 'beat:beat',
  bar: 'beat:bar',
  phrase: 'beat:phrase',
};

export class BeatSystem {
  private tone: ToneModule | null = null;
  private running = false;
  private paused = false;
  private lastElapsedSeconds = 0;
  private snapshot: BeatSnapshot;

  constructor(
    private readonly grid: BeatGrid,
    private readonly bus: EventBus<GameEventMap>,
    ) {
    this.snapshot = getBeatSnapshot(0, this.grid);
  }

  async start(): Promise<void> {
    const Tone = await getTone();
    this.tone = Tone;
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    Tone.Transport.bpm.value = this.grid.bpm;
    Tone.Transport.start();
    this.running = true;
    this.paused = false;
    this.lastElapsedSeconds = 0;
    this.snapshot = getBeatSnapshot(0, this.grid);
  }

  pause(): void {
    if (!this.running || this.paused || !this.tone) {
      return;
    }

    this.tone.Transport.pause();
    this.paused = true;
  }

  resume(): void {
    if (!this.running || !this.paused || !this.tone) {
      return;
    }

    this.tone.Transport.start();
    this.paused = false;
  }

  stop(): void {
    if (this.tone) {
      this.tone.Transport.stop();
      this.tone.Transport.cancel();
      this.tone.Transport.position = 0;
    }
    this.running = false;
    this.paused = false;
    this.lastElapsedSeconds = 0;
    this.snapshot = getBeatSnapshot(0, this.grid);
  }

  update(): BeatSnapshot {
    if (!this.running) {
      return this.snapshot;
    }

    const elapsedSeconds =
      this.paused || !this.tone
        ? this.lastElapsedSeconds
        : this.tone.Transport.seconds;
    const transitions = scanBeatTransitions(
      this.lastElapsedSeconds,
      elapsedSeconds,
      this.grid,
    );

    transitions.forEach((transition) => {
      const event = CHANNEL_TO_EVENT[transition.channel];
      this.bus.emit(event, {
        index: transition.index,
        at: transition.at,
        grid: this.grid,
      });
    });

    this.lastElapsedSeconds = elapsedSeconds;
    this.snapshot = getBeatSnapshot(elapsedSeconds, this.grid);
    return this.snapshot;
  }

  getSnapshot(): BeatSnapshot {
    return this.snapshot;
  }
}
