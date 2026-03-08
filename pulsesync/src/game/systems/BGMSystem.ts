import { getProceduralBGMSong } from '@/game/audio/bgm/catalog';
import type { ProceduralBGMRuntime, ProceduralBGMSongDefinition } from '@/game/audio/bgm/types';
import type { GameEventMap } from '@/game/types/GameEvents';
import type { BeatGrid } from '@/game/types/GameTypes';
import { EventBus } from '@/game/systems/EventBus';
import { getTone } from '@/game/systems/toneRuntime';

export class BGMSystem {
  private runtime: ProceduralBGMRuntime | null = null;
  private loops: any[] = [];
  private readonly disposers: Array<() => void> = [];
  private initialized = false;
  private readonly song: ProceduralBGMSongDefinition;

  constructor(
    private readonly bus: EventBus<GameEventMap>,
    private readonly beatGrid: BeatGrid,
    songId?: string,
  ) {
    this.song = getProceduralBGMSong(songId);
    this.disposers.push(
      this.bus.on('timeline:music', ({ cue }) => {
        this.runtime?.onLayerChange(cue.layer, cue.enabled);
      }),
    );
    this.disposers.push(
      this.bus.on('timeline:phase', ({ cue }) => {
        this.runtime?.onPhaseChange(cue.phase);
      }),
    );
    this.disposers.push(
      this.bus.on('sync:changed', (syncState) => {
        this.runtime?.onSyncChange(syncState.tier);
      }),
    );
    this.disposers.push(
      this.bus.on('beat:phrase', () => {
        this.runtime?.onPhrase();
      }),
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const Tone = await getTone();
    this.runtime = this.song.createRuntime({ Tone, beatGrid: this.beatGrid });

    this.loops = [
      new Tone.Loop((time: number) => {
        this.runtime?.onSixteenth(time);
      }, '16n').start(0),
      new Tone.Loop((time: number) => {
        this.runtime?.onBar(time);
      }, '1m').start(0),
    ];

    this.initialized = true;
  }

  dispose(): void {
    this.disposers.forEach((dispose) => dispose());
    this.loops.forEach((loop) => loop.dispose());
    this.runtime?.dispose();
    this.loops = [];
    this.runtime = null;
    this.initialized = false;
  }
}
