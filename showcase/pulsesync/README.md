# Pulse Sync

Pulse Sync is a REZ-like 2D rail lock-on shooter demo built with Vite, TypeScript, Phaser, and Tone.js. It is a short vertical slice focused on lock-release feel, beat-synced presentation, a rising Sync system, and a three-phase boss encounter against The Gate of Eden.

## Stack

- Vite
- TypeScript
- Phaser
- Tone.js
- Vitest
- ESLint

## Controls

- Mouse Move: move cursor
- Hold Left Mouse: lock-on sweep
- Release Left Mouse: sequential salvo
- Right Mouse / Space / Shift: Pulse Burst
- Esc: pause
- D: toggle debug overlay

## Demo Structure

- Intro / System Boot
- Tutorial / low-density Pulse Drone and Shield Node waves
- Build / denser mixed waves with Chain Cluster, Sniper Sigil, Distortion Mine
- Climax / high-density lock-and-burst section
- Boss / The Gate of Eden with three phases
- Outro / result handoff

The included placeholder level runs about 2.5 minutes and is authored in a data-driven beatmap so it can be extended to a longer 4-6 minute stage without rewriting scene logic.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the Vite local URL in a desktop browser. Chrome or Edge latest is the target.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
```

## Architecture

Runtime flow:

1. `BeatSystem` uses `Tone.Transport` as the timing source.
2. `TimelineSystem` consumes the beatmap and emits spawn/phase/music/boss cues.
3. Gameplay systems react through `EventBus` instead of one giant scene script.

Key modules:

- `src/game/scenes/`: Boot, Menu, Demo, Result flow
- `src/game/systems/`: beat clock, timeline, audio, FX, camera FX, event bus
- `src/game/gameplay/`: cursor, lock-on, projectiles, combo, sync, enemies, boss, damage
- `src/game/content/`: beatmap, enemy archetypes, palette, central config
- `src/game/rendering/`: background renderer and HUD

## Completed Features

- Procedural texture generation in `BootScene`; no binary art dependency required
- Data-driven beatmap with phase cues, visual theme cues, music layer cues, enemy spawns, and boss phase commands
- Lock-on sweep with queue cap, multi-lock support, and sequential missile release
- Five enemy types:
  - Pulse Drone
  - Shield Node
  - Chain Cluster
  - Sniper Sigil
  - Distortion Mine
- Sync Gauge and Combo that both affect audiovisual intensity
- Pulse Burst with beat window bonus
- Procedural background pulses, screen-space FX, HUD, and debug overlay
- Three-phase boss: The Gate of Eden
- Result screen and replay loop
- Vitest coverage for beat math, combo/sync, lock rules, beatmap load, and beat bonus window

## Placeholder / Replacement Points

- All current visuals are procedural Phaser-generated textures and graphics
- All music is generated with Tone.js synth layers rather than authored tracks
- `src/game/content/beatmaps/DemoBeatmap.ts` is the extension point for longer authored stages
- `src/game/systems/AudioSystem.ts` is the replacement point for richer stems, samples, or authored arrangements

## Manual Acceptance Checklist

- Game boots into menu without missing asset errors
- Menu starts the demo after a click or keyboard input
- Cursor moves smoothly and lock-on requires holding left mouse
- Releasing left mouse fires a visible sequential salvo
- Enemies appear over time from the beatmap instead of hardcoded per-frame spawns
- Combo and Sync Gauge update on hits, destroys, misses, and threat damage
- Pulse Burst triggers on right mouse / space / shift and respects cooldown
- Boss enters, changes phases, and resolves into the result screen
- Esc pauses and resumes the demo
- D toggles the debug overlay
- `npm run build`, `npm run test`, and `npm run lint` pass

## Known Limitations

- This is a placeholder vertical slice: enemy AI and boss scripting are intentionally lightweight
- Visual post-processing is approximated with layered graphics, additive sprites, and camera FX instead of a full bloom pipeline
- Gamepad support is not implemented yet
- Audio is synth-driven and intentionally minimal until real music assets or stems are available

## Next Expansion Targets

- Replace synth placeholders with authored stems and phase-specific arrangements
- Add more authored boss attacks and support enemy waves during boss phases
- Add real lock marker widgets, richer scoring, and better chain-reaction reward accounting
- Add settings for quality, audio balance, and accessibility
