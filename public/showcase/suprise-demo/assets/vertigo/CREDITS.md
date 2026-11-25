# VERTIGO assets

- Art direction: the user-supplied reference screenshot, provided on 2026-09-20. It is used as a composition and environmental reference, not redistributed as a runtime backdrop.
- `plaster-color.png`: original seamless off-white plaster / faded teal paint material generated with OpenAI Image Gen for this project. Neutral illumination, peeling paint, concrete exposure, hairline cracks and moisture damage. The generated surface is used as PBR albedo and fine bump; structural depth comes from mesh geometry.
- `preview.png`: actual VERTIGO WebGL scene capture from the browser's photograph control.
- `design/vertigo/concept.png`: original Image Gen visual concept, based on the supplied reference and the existing exhibition interface. Design reference only; not part of runtime scene content.
- Rock albedo and normal maps reuse the locally served CC0 rocks from [AFTERLIGHT credits](../afterlight/CREDITS.md), without duplicating the image files.
- Shared concrete maps, water normal and HDR environment: see [shared credits](../shared/CREDITS.md).
- Rust, timber, foliage geometry, building modules, bridges, rooms, weather and synthesized wind / sea ambience are authored locally for this project. No people, voices, downloaded building models or third-party photographs are included.

- Ocean rendering uses the Three.js `Water` implementation (MIT), retaining AFTERLIGHT’s planar scene-reflection approach. VERTIGO adds four directional Gerstner swells, crest foam, a shoreline distance field extracted from its actual rock meshes, and wave-triggered spray sheets / droplets / mist. All wave, foam and particle logic is authored locally.
