# Character iteration 1 — 2026-09-08

- Built four original geometric low-poly humans using Blender 5.0.1 through MCP. Each has one skinned mesh, 16 bones and Idle, Walk, Browse, Wave clips. Editable standalone Blender file re-opened and saved successfully.
- Export validation: no unrelated environment meshes; GLB skin attributes, animation clips and SHA-256 hashes checked against manifest.
- Seven automated tests pass. Three seeded 15-minute simulations verify repeated browsing/departure, collision with exported static geometry, a moving player and other characters, and vendor confinement. Player movement also tested against NPC tunneling.
- Production TypeScript/Vite build passes. Existing large Three.js chunk advisory remains.
- Chromium WebGL runtime: four characters loaded, skeletal thigh poses and animation clocks advance, pedestrians browse and resume, workers visibly raise hands above counters. No page errors observed.
- Pause leaves behavior positions and animation times unchanged. English title remains SAY YACHI. iPhone 13 viewport emulation loads four characters with no horizontal overflow; this is browser emulation, not physical-device performance testing.
- All 239 scene lamps retain static-all-on lighting. Characters use skeletal Lambert shading and simple ground shadows.
- Only four characters are instantiated. Shopping is ambient animation, not a transaction system. Body-circle collision does not simulate fingers/individual limbs. No vehicles added.

Preview: http://127.0.0.1:4173/?lang=zh
