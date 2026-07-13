# Procedural BGM Guide

This project now treats each procedural BGM as a self-contained song package.

## Directory layout

- `src/game/systems/BGMSystem.ts`
  - Transport-facing system.
  - Loads the selected song runtime and forwards timeline/sync events.
- `src/game/audio/bgm/catalog.ts`
  - Registers all selectable songs.
- `src/game/audio/bgm/selection.ts`
  - Stores the selected song id in the Phaser registry.
- `src/game/audio/bgm/types.ts`
  - Song runtime contract.
- `src/game/audio/bgm/arrangementTypes.ts`
  - Shared arrangement data types for songs that use section/pattern data.
- `src/game/audio/bgm/songs/`
  - One folder-level area for actual song implementations and their data.

## Current song example

The current song is split into two files:

- `src/game/audio/bgm/songs/signalIgnitionSong.ts`
  - Runtime logic, synth graph, transitions, mix behavior.
- `src/game/audio/bgm/songs/signalIgnitionArrangement.ts`
  - Section patterns and musical data.

Use this pair as the reference when adding the next song.

## Add a new song

### 1. Create the arrangement data file

If the new song uses section-based pattern data like the current one, create:

- `src/game/audio/bgm/songs/<songName>Arrangement.ts`

Typical contents:

- per-phase sections (`boot`, `tutorial`, `build`, `climax`, `boss`, `outro`)
- note patterns for `bass`, `arp`, `lead`
- drum pattern arrays for `kick`, `snare`, `hat`, `openHat`, `accent`
- transition chords, fills, and energy values

You can reuse `PhaseArrangementMap` from `src/game/audio/bgm/arrangementTypes.ts`.

If the new song needs a different data shape, that is fine. The song runtime owns its own data contract.

### 2. Create the song runtime file

Create:

- `src/game/audio/bgm/songs/<songName>Song.ts`

Export a `ProceduralBGMSongDefinition`:

```ts
import { BaseProceduralBGMRuntime } from '@/game/audio/bgm/BaseProceduralBGMRuntime';
import type {
  ProceduralBGMSongContext,
  ProceduralBGMSongDefinition,
} from '@/game/audio/bgm/types';

class NeonDriveRuntime extends BaseProceduralBGMRuntime {
  constructor({ Tone, beatGrid }: ProceduralBGMSongContext) {
    super(Tone, beatGrid, {
      kick: true,
      bass: false,
      hat: false,
      arp: false,
      pad: false,
    });

    // Create synths, buses, FX, and any song-specific state here.
  }

  override onPhaseChange(phase) {
    super.onPhaseChange(phase);
    // Swap sections or transition state here.
  }

  override onSyncChange(tier) {
    // Apply song-specific mix behavior here.
  }

  override onPhrase() {
    // Optional phrase reactions here.
  }

  override onSixteenth(time) {
    // Trigger per-step notes here.
    this.advanceSixteenth();
  }

  override onBar(time) {
    // Trigger bar-level chords, risers, transitions here.
  }

  override dispose() {
    // Dispose synths and buses here.
  }
}

export const NEON_DRIVE_SONG: ProceduralBGMSongDefinition = {
  id: 'neon-drive',
  title: 'Neon Drive',
  description: 'Short song description for menu/debug display.',
  createRuntime(context) {
    return new NeonDriveRuntime(context);
  },
};
```

## Runtime contract

`BGMSystem` will call these hooks on the active song runtime:

- `onLayerChange(layer, enabled)`
- `onPhaseChange(phase)`
- `onSyncChange(tier)`
- `onPhrase()`
- `onSixteenth(time)`
- `onBar(time)`
- `dispose()`

This means each song can have:

- different synth graph
- different mix behavior
- different transition logic
- different per-step/per-bar composition logic
- different internal data model

The system does not require all songs to share the same musical logic.

## Register the new song

Add the new song to:

- `src/game/audio/bgm/catalog.ts`

Example:

```ts
import { NEON_DRIVE_SONG } from '@/game/audio/bgm/songs/neonDriveSong';

const SONGS: ProceduralBGMSongDefinition[] = [
  SIGNAL_IGNITION_SONG,
  NEON_DRIVE_SONG,
];
```

Once the song is in `SONGS`, it becomes selectable by id.

## Menu selection

Menu-facing song selection reads from:

- `src/game/audio/bgm/selection.ts`

The selected song id is stored in Phaser registry key:

- `bgm:selected-song-id`

`DemoScene` reads that selection before constructing `BGMSystem`.

When more than one song is registered, the `SELECT BGM` button in `MenuScene` becomes active and cycles through the registered songs.

## Adjust the beatmap if needed

The current beatmap emits music layer cues such as:

- `kick`
- `bass`
- `pad`
- `arp`
- `hat`

Those cues live in:

- `src/game/content/beatmaps/DemoBeatmap.ts`

`MusicLayer` is now `string`, so future songs can use different layer names if needed. If a new song expects different layer toggles, update beatmap music cues to match that song's runtime behavior.

## Recommended workflow for a new song

1. Copy `signalIgnitionSong.ts` and `signalIgnitionArrangement.ts` as a starting point.
2. Rename ids, title, and description.
3. Replace synth graph and arrangement data.
4. Register the song in `catalog.ts`.
5. If the song needs different layer names, update beatmap `music` cues.
6. Run:

```bash
npm run build
npm run lint
npm run test
```

## Editing the existing song

To adjust the current song:

- change musical patterns in `signalIgnitionArrangement.ts`
- change synths, mix, or transition logic in `signalIgnitionSong.ts`

Avoid putting song-specific musical data back into `src/game/systems/` or `src/game/content/config/`.
Keep system code transport-focused and song files self-contained.
