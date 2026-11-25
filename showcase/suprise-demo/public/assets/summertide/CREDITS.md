# SUMMERTIDE / 夏潮

Original real-time coastal environment based on the user's hillside summer-bay reference. The supplied illustration is a composition reference only; it is not used as a background or distributed as a runtime asset. No people are present.

## Generated assets — built-in Image Gen

- `sky.jpg`: JPEG derivative of a generated 360-degree equirectangular summer sky. Prompt: 2:1 photographic sky-only panorama, realistic towering white cumulus, blue-gray cloud undersides, deep blue zenith, pale horizon, diffuse summer sunlight, matching horizontal edges, no land, ocean, buildings, text or sun disc. Used only on the distant sky dome.
- `window.jpg`: generated photographic glass-pane texture, with partly drawn linen curtains, a dim interior and subtle sky / foliage reflections, straight-on, no frame or people. Used on actual window geometry; JPEG runtime derivative.
- `forest.jpg`: JPEG derivative of a generated tileable canopy texture. Prompt: orthographic nadir photograph of dense subtropical broadleaf forest, irregular olive and emerald crowns, diffuse illumination, no buildings or roads, seamless edge-to-edge texture. Used on distant terrain and three-dimensional canopy crowns.
- `design/summertide/concept.png`: generated photographic art direction from the user's image, with a steep yellow-lined coastal road, concrete rails, leafy planting, colorful houses, utility lines, turquoise surf, wooded headlands and white cumulus. Restrained SUMMERTIDE branding and the title “A summer to get lost in.” Concept only, not a scene backdrop.
- Original generated images are retained in the Image Gen output directory. Project runtime derivatives are served locally.

## Reused assets

- Concrete Wall 007, Kloppenheim 06 HDR lighting and Three.js water normal: [shared credits](../shared/CREDITS.md).
- Asphalt 02 color / normal / roughness: existing [NIGHTFALL CC0 materials](../night-market/CREDITS.md).
- Rock Boulder Dry color / normal: existing [AFTERLIGHT CC0 materials](../afterlight/CREDITS.md).
- Alpha-cutout laurel leaf: existing generated [AERIE leaf](../aerie/CREDITS.md), instanced as individual curved leaves. The shared source files are reused without duplicating textures.

Terrain, continuous sloping roads, modular houses, roofs, balconies, windows, utility poles, wires, cars, cafe furniture, palms, pier, rocks, vegetation placement, wave/foam shaders and synthesized surf audio are authored Three.js / Web Audio code. The ocean retains the project's Three.js Water planar reflection technique with additional shoreline-relative displacement, foam and spray. Three.js is MIT licensed.

`preview.png` is an actual browser WebGL capture. It is not the generated concept.
