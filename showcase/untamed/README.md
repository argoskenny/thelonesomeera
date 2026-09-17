# UNTAMED

A cinematic, interactive exploration of creative development. Built with TypeScript, Vite, GSAP and Three.js.

## Run

Requires Node.js 24 or newer.

```sh
npm ci
npm run dev
```

## Build and check

```sh
npm test
npm run build
npm run preview
```

The static production site is generated in `dist/`.

When published through The Lonesome Era, the Demo is served from
`/showcase/untamed/`; the parent project's `build:untamed` command builds and
syncs the output to `public/showcase/untamed/`.

## Interactions

- Scroll through the forest, editorial scenes and kinetic typography.
- In the living lab, drag the fern or focus it and use the arrow keys.
- Switch between Growth, Flow and Spores; adjust Energy and Complexity; regenerate a unique specimen.
- Expand the field notes to explore each technology family.
- Enable the procedural forest soundscape with the header sound control.
- Pause motion in the footer. The site also respects the system's reduced-motion preference.

The jungle uses a depth-displaced WebGL landscape, four photograph-matched foliage planes, a reconstructed background plate, and one reversible 0–1 ScrollTrigger state. A shared perspective camera moves through the layers while the typography parts and mist blends into the next section. Waterfall flow, drifting haze, spores and pointer response add subtle life. Phone framing gradually turns toward the waterfall. Reduced motion, paused motion, or unavailable WebGL retains the original static hero without the extended scroll sequence.

Both renderers rest when offscreen; the lab renderer loads near its section. A botanical image replaces it when WebGL is unavailable. All images and fonts are served locally; no API keys, external image hosts or backend are required.

## Source

- `src/main.ts`: page composition and field-note interaction
- `src/style.css`: responsive visual system
- `src/motion.ts`: site-wide scroll choreography and motion preferences
- `src/hero-journey.ts`: scroll state, typography, lifecycle and static fallback
- `src/hero-scene.ts`: shared perspective camera, depth mesh, shaders and foliage projection
- `src/hero-layers.ts`: registered foreground mattes
- `src/hero-state.ts`: deterministic camera and typography poses
- `src/fern.ts`: deterministic procedural botanical geometry
- `src/lab.ts`: WebGL shaders and accessible specimen controls
- `src/sound.ts`: opt-in procedural Web Audio soundscape
- `public/images/`: original AI-generated jungle and botanical imagery, optimized as WebP / JPEG
