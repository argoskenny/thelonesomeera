# easylog

A standalone React 19 + TypeScript + Vite hero based on `docs/new_demo.md`.

## Run and build

From the repository root:

```sh
npm --prefix showcase/easylog ci
npm run dev:easylog
npm run build:easylog
```

The development URL is `http://localhost:5173/showcase/easylog/`. The production URL is `/showcase/easylog/` on the main site. Vite writes directly to `public/showcase/easylog/`; edit this source directory, never the generated files. The main standalone build and showcase installation scripts include this project.

## Implementation

- Original remote log pair and logo; original Google Fonts, copy, palette and sizing rules.
- Streamed byte progress with completed-file fallback, decoded images and explicit font loading before the intro.
- GSAP intro, pixelation, zoom, character reveals and reduced-motion alternative.
- Canvas moss mask reconstructed from exponentially decaying brush stamps, with distance-based moving stamps and time-based resting stamps.
- Full moss on touch devices, independently of the responsive layout breakpoint.
- StrictMode cleanup for image loading, bitmaps, GSAP, observers, event listeners and animation frames.
- Pointer stamps persist across image decoding, so the moss trail is already present when the log appears.
- Pixel blocks retain square CSS-pixel dimensions, including partial blocks at viewport edges.
- Navigation and CTA retain `#`; the menu intentionally has no action, as specified.
- A single full-screen Hero: the bottom hint describes cursor reveal (or the already revealed detail on touch devices), with no downward arrow or promise of more content below.

The images and fonts require network access. If a log image fails, the text intro still runs and the error is logged.

## Verification

Verified on 2026-11-17: TypeScript, Vite production build, root lint and Next.js production build passed. Generated public output and standalone assets were refreshed.

Local Chrome/Playwright checks passed for the production route, the Demo card, all four main navigation routes, and all five specified viewport sizes. Verified loaded fonts, headline baselines, intro order, moving/resting moss and complete visual fade, emulated touch, reduced motion, StrictMode development, and image-failure fallback. No overflow or unexpected console/network errors. Real-device Safari and production deployment were not tested.
