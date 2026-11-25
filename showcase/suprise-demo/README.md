# ELSEWHERE — 場景選集

A scene-selection homepage and ten independently loaded, freely explorable Three.js environments. TypeScript + Vite.

```sh
npm install
npm run dev
```

`npm run build` creates the deployable `dist/` directory. `npm run preview` serves that build.

## Pages

- `/` — ELSEWHERE, the scene-selection homepage.
- `/afterlight/` — 餘光美術館 AFTERLIGHT, the coastal pavilion.
- `/night-market/` — 夜市未眠 NIGHTFALL, the Taiwan-inspired night market without people.
- `/raohe/` — 饒河街夜市 RAOHE, the lantern gate, cooking stalls and wet street reconstructed from the supplied reference.
- `/vertigo/` — 懸城 VERTIGO, a vertical coastal city with suspended walkways and skybridge homes.
- `/ignition/` — 向天 IGNITION, a coastal launch base with a working ground launch switch.
- `/summertide/` — 夏潮 SUMMERTIDE, a summer coastal town with a continuous downhill road, curved beach, surf and a timber lookout.
- `/kowloon/` — 九龍茶餐廳 KOWLOON, a dense courtyard city with an enterable tea room, five skybridges, connected stairs, weathered apartments and wet reflections.
- `/neo-taipei/` — 新台北 NEO TAIPEI, a rain-soaked cyberpunk city with a ramen balcony, a cybercat, elevated roads, cliff gardens, waterfalls and swimming holographic whales.
- `/aurelia/` — 曦光城塞 AURELIA, a Renaissance fantasy citadel with a wisteria loggia, cathedral piazza, valley bridges, waterfalls and celestial rings.
- `/aerie/` — 雲上城 AERIE, a classical city above a moving cloud sea, with connected promenades and flying sailships.

Each scene links back to the homepage. The homepage uses actual scene captures and loads no 3D engine; a scene is initialized only after entering its page. All eleven pages are emitted by the same build. Serve the entire `dist/` directory, including the ten scene subdirectories. Directory URLs and their `index.html` equivalents are supported, also when the whole site is hosted beneath a subdirectory.

## Project layout

```text
index.html                     Scene-selection homepage
src/home/                      Homepage styles
src/scenes/afterlight/          Pavilion world, materials, audio, views and UI configuration
src/scenes/night-market/       Night-market world, props, materials, audio and UI configuration
src/scenes/vertigo/            Vertical city, modular towers, interior, bridges, ocean, weather and audio
src/scenes/ignition/            Launch base, vehicle, sky, effects, sequence, audio and controls
src/scenes/aerie/               City architecture, materials, clouds, skyships, audio and viewpoints
src/scenes/summertide/          Coastal terrain, roads, town, foliage, waves, audio and viewpoints
src/scenes/neo-taipei/         Cyberpunk architecture, roads, wet reflections, rain, holograms and traffic
src/scenes/aurelia/            Renaissance architecture, cliffs, gardens, waterfalls, magic and viewpoints
src/scenes/kowloon/            Courtyard architecture, tea-room interior, circulation, steam, views and audio
src/scenes/raohe/              Raohe gate, food stalls, street architecture, lighting and wet asphalt
src/shared/                    Navigation, scene UI shell, styles, types, asset URLs and texture helpers
afterlight/index.html          Pavilion HTML entry
night-market/index.html        Night-market HTML entry
vertigo/index.html             Vertical-city HTML entry
ignition/index.html            Launch-base HTML entry
aerie/index.html               Sky-city HTML entry
summertide/index.html          Summer-bay HTML entry
neo-taipei/index.html          Neo Taipei HTML entry
aurelia/index.html             Renaissance-citadel HTML entry
kowloon/index.html             Kowloon HTML entry
public/assets/afterlight/      Pavilion-specific textures and preview
public/assets/night-market/    Night-market-specific textures, preview and research credits
public/assets/vertigo/         Generated plaster material, actual preview and credits
public/assets/ignition/        Generated sunset panorama, actual scene preview and credits
public/assets/aerie/           Generated limestone, sky panorama, actual preview and credits
public/assets/summertide/      Generated summer sky, forest texture, actual preview and credits
public/assets/neo-taipei/      Generated facade, portrait, sky, blossoms, browser preview and credits
public/assets/aurelia/         Heraldry, terracotta, cliff and alpine panorama textures, preview and credits
public/assets/kowloon/         Generated plaster, tiles, room atlas, enamel sign, actual preview and credits
public/assets/shared/          Shared concrete textures, water normal and HDR environment
design/aurelia/                Visual brief and concept reference
design/vertigo/                Visual brief and concept reference
design/home/                   Homepage design reference
design/afterlight/              Pavilion design reference
design/night-market/           Night-market design reference
```

Scene entries load independently. KOWLOON reuses VERTIGO material loading and architectural prop helpers without initializing its scene. Shared modules contain no scene-specific defaults; each scene supplies its own viewpoints and UI copy. Shared textures exist once on disk.

## Controls

Click the scene or the explore button to enter first-person controls with pointer lock. Move the mouse to look, use WASD to move, Shift to move faster, F to switch between ground walking and free flight, and Escape to release the mouse and pause. Choose either mode with the visible mode buttons before entry or after pausing. Ground walking follows authored floors, continuous terrain slopes and stairs at eye height with obstacle and ledge checks; free flight follows the view direction and uses Q/E (or Space to ascend) for elevation, allowing passage through geometry within scene bounds. Switching to walking places you on the nearest available walkable surface. Touch devices have a movement joystick, swipe-to-look, and ascent/descent buttons in flight mode. AFTERLIGHT includes four viewpoints. NIGHTFALL includes eight viewpoints and an optional live district map. VERTIGO includes six viewpoints. AERIE includes six viewpoints and two cloud / lighting atmospheres. SUMMERTIDE includes six viewpoints and two daylight atmospheres. AURELIA includes six viewpoints, golden-hour / blue-hour lighting, six animated waterfalls, a connected 70-tread staircase and two bridges. The upper citadel and floating observatory can be reached by viewpoint selection or free flight. NEO TAIPEI includes six viewpoints, rain / mist atmospheres, 145 buildings, 11 animated cascades, two elevated road routes, and a walkable 68-tread stair connecting the balcony to a promenade and the garden bridge. The circular highway and upper citadel can be reached using viewpoint selection or flight. KOWLOON includes six viewpoints, 23 apartment blocks, five bridges, three connected stairs and an enterable tea room. Its highest galleries and rooftops are accessible through viewpoints or flight. RAOHE includes five viewpoints from the gateway to the food counters and rooftops. All scenes include optional synthesized ambient sound, PNG photography and fullscreen where supported.

All architecture and props are real geometry. Design concepts are references only and are not used as scene backgrounds. PBR and HDRI assets are served locally. The night-market audio contains rain, dripping and ventilation without voices.

Asset sources and licenses: [public/assets/CREDITS.md](public/assets/CREDITS.md).

## NIGHTFALL district

The market district spans 144 × 126 metres with six connected blocks, 58 buildings (2–9 floors), 116 stalls representing 36 vendor types, 58 parked scooters and 20 vending machines. No people are included. The layout and module variety reference `taiwan-gta`; this scene retains its own PBR materials, detailed geometry and wet-street rendering.

Night-market modules:

- `district.ts`: building catalog, district layout and bounds.
- `buildings.ts` / `storefronts.ts`: facades, arcades, roofs and trade-specific interiors.
- `vendors.ts`: vendor equipment and displayed goods.
- `street-props.ts`: vending machines, scooters, lanterns and planting.
- `atmosphere.ts` / `lighting.ts`: gateway, steam, wet-surface reflection and static diffuse illumination.
- `world.ts`: scene composition, collisions, spatial detail culling and a fixed-size nearby light pool.
- `map.ts`: live location marker and accessible district navigation.

High viewpoints reduce fog and skip ground-level AO and planar reflection work. Architecture remains visible while fine street props use distance culling. The scene's read-only `window.nightfall.state` and `window.nightfall.layout` diagnostics support checking rendering and street connectivity.

## IGNITION controls

Use “前往發射開關” to reach the ground console, then click its red 3D switch, press R during exploration, or use the accessible launch button. The 10-second countdown can be cancelled. Ignition retracts the service arms and transitions to the liftoff viewpoint; camera following can be toggled, and the vehicle can be reset for another launch. Flight is an authored visual sequence. Hidden tabs pause the sequence. This scene opts into drag-to-look when pointer lock is unavailable; AERIE, SUMMERTIDE, AURELIA, NEO TAIPEI and KOWLOON use the same opt-in fallback. Other scenes retain their existing navigation behavior.
