# Black hole visual replacement — 2026-09-09

Replaces the chrome sculpture on Home and About. Layout, copy and showcase projects remain unchanged. Both surfaces now animate and have a pause control.

Asset: `public/images/era/black-hole.webp` (1254 × 1254, 186522 bytes), generated with built-in imagegen, then encoded as WebP. Runtime: `BlackHoleCanvas.tsx`; GLSL texture advection and traveling brightness variations preserve the event horizon and disk orientation. This is an artistic animated image treatment, not a physical ray-traced simulation.

Generation prompt: Production website hero asset; extraordinarily premium cinematic black hole, pitch-black circular event horizon, fine white-hot photon ring, detailed flowing plasma in champagne gold, ivory and restrained amber. Nearly edge-on accretion disk, gravitational-lensing arch above and below the dark center. Fine filaments, controlled bloom and high dynamic range. Near-black #08090b margins, no metallic torus, rainbow chrome, text, UI, planets or spacecraft.

Verification: Codex in-app browser at 1280 × 720 and 393 × 852. Home and About displayed the asset with correct square canvas proportions. Fixed intrinsic canvas resize feedback on mobile by positioning the canvas absolutely inside its ratio-constrained parent. No console warnings/errors in the tested flows.

Motion evidence: in a 200 × 250 black-hole crop, playing frames changed 66542 color channels by more than 2 levels; mean absolute change 5.187. Paused frames were identical. Emulated reduced motion frames were also identical, and the pause control was hidden. Offscreen/background animation scheduling is suspended; WebGL resources and observers are released on unmount; context restoration reinitializes the renderer.

Validation: lint, production build with TypeScript, 36 existing tests, diff whitespace check. No new dependency. No deployment performed.

Screenshots: `black-hole-desktop.png`, `black-hole-mobile.png`. The earlier chrome concept/screenshots document the previous iteration and are superseded for the hero art.
