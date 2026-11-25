# NEO TAIPEI assets

Art direction: the user-provided image “霓虹新台北：賽博貓與孤影.png”. The supplied image is a reference only and is not used as a scene backdrop.

Generated for this scene with OpenAI Image Generation, 2026-11-06:
- `portrait.jpg`: fictional adult woman, cyan/violet holographic portrait, no lettering. In-world billboard artwork.
- `facade.jpg`: front-facing tiled night office windows with warm/cool interiors, no people. Applied to real three-dimensional architecture.
- `sky.jpg`: cloud-only blue-hour equirectangular panorama, no city or terrain.
- `blossom.png`: transparent photographic sakura cluster for instanced foliage.

Reused local PBR maps: `../shared/` concrete and water normals; `../night-market/` metal and asphalt maps; `../aurelia/cliff.jpg`. Their original credits remain in those asset directories.

Architecture, bridges, cliffs, waterfall ribbons, vehicle and cybercat meshes, procedural Chinese signs, and holographic whale geometry are authored in `src/scenes/neo-taipei/`. All movement, water, rain, mist, and hologram animation is rendered in real time. Ambient audio is synthesized locally in Web Audio after the sound control is activated.

`preview.png` is a capture of the actual browser-rendered environment, not a generated concept image.
