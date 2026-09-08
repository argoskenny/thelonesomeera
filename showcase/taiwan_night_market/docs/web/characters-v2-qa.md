# Crowd iteration 2 — 2026-09-08

## Assets and coverage

- Blender MCP inspected the previous four editable rigs, then created a separate crowd studio with 44 rigged designs: original 4 + 30 visitors + 10 workers. The new standalone file was re-opened and saved in Blender 5.0.1.
- Each export contains exactly one mesh primitive, a vertex-color attribute, 16-joint skin, and 8 clips (Idle, Browse, Wave plus five walk variations). GLB hashes match the manifest. No external character meshes or textures were used.
- Walk cycles use analytical leg IK and alternating stance/swing foot paths. Blender samples confirmed stance ankle height 0.13 m and swing peaks approximately 0.175–0.25 m depending on gait, before character scaling.
- Runtime: 102 visitors, 154 workers, 44 designs. Six areas each receive 17 randomly placed visitors. All 116 stalls, 36 shops and 2 public-service buildings are staffed. Residential buildings, townhouses and closed heritage houses are excluded from the shop count.

## Validation

- `npm test`: 10 tests pass, including two full-crowd 15-minute seeded simulations. Seed 2: 2,519 stops / 2,497 departures. Seed 51: 2,419 stops / 2,399 departures. All 102 visitors in each run moved and browsed repeatedly; sampled collision checks found no overlap with exported obstacles, player or other people. All workers remained within their workplace radius.
- `npm run build`: TypeScript and production Vite build pass. The existing large Three.js chunk advisory remains.
- Chromium desktop, 1440×900, Metal backend: all 256 characters loaded, all five walk states appeared at runtime, player walked from the entrance along the north street, workers were visible behind counters, no page errors. Observed runtime counter approximately 120 FPS; this is one local machine and viewport, not a hardware guarantee.
- iPhone 13 browser emulation with 4× CPU throttling: all 256 characters loaded, 73 FPS at the sampled moment, no horizontal overflow or page errors. This is not physical iPhone GPU or thermal testing.
- Pause leaves behavior and animation clocks unchanged. English title remains SAY YACHI. All 239 scene lamps retain static-all-on lighting.
- Geometry/materials are shared per design, skeletal poses remain independent. Dynamic spatial lookup, limited path requests, animation distance update rates and instanced contact shadows control crowd cost.

## Boundaries

Body-circle collision operates on the flat road plane; gestures and fingers do not have separate physics colliders. Stopping to shop is an ambient animation. There are no transactions, family-following AI or vehicles in this iteration.

The original environment and first character assets are preserved. Current assets: `assets/characters-v2/`; assignments: `public/data/staff-placements.json`.

## Forward knee bend correction

All 44 rigs have five revised walk clips. The leg IK now selects the forward knee solution while preserving ankle trajectories and forward locomotion. The Blender source and runtime GLBs are updated together. A Three.js skeletal regression test samples both legs over 24 phases in each exported walk clip and checks knee position ahead of the hip-ankle line, foot height and backward planted-foot motion relative to the forward-facing body. Asset integrity tests and production build pass. Browser smoke check loaded all 256 actors and all five walk states, with no page errors; a Blender side view was visually inspected. Navigation and collision logic were not changed.
