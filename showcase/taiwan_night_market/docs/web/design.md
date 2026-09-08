# 榕安夜市 web interface

Concept: [interface-concept.png](interface-concept.png), generated with the built-in Image Gen tool, referencing the existing `02_north_hotspot.png` Blender render. The concept only specifies the HTML/CSS interface; the environment is the original interactive 3D asset.

## Design system

- Fullscreen canvas. No marketing page, card grid, inventory, or combat UI.
- Ink `#101b20`, ivory `#f4eedf`, vermilion `#d95032`, gold `#e9b768`.
- PingFang TC / Noto Sans TC / Microsoft JhengHei / sans-serif system fonts.
- Large bold left title, brief supporting line, one rectangular primary action, subtle left dark gradient.
- Playing: top-left name and current district, top-right pause, small circular map; translucent touch controls on coarse pointers.
- Responsive: desktop 1280×720 primary layout; mobile 390×844; short landscape fallback.

## Copy inventory

Entry: 榕安夜市 / 放慢腳步，走進台灣的夜晚。 / 開始逛夜市 / WASD 移動 · 滑鼠環顧 · Esc 暫停 / 聲音來源 / 環境音 開啟.
HUD: 榕安夜市 / 北街・攤販熱區 / 暫停 / N.
Necessary functional additions: load progress and errors, Shift/arrow-key help, audio volume, pause/resume/reset, quality selection, attribution dialog, current district labels, drag-look fallback notice. No additional product claims.

## Concept prompt

Create a UI design reference sheet with desktop entry and mobile playing HUD for a Three.js Taiwan night market first person walk. Use the existing Blender street as backdrop without redesigning buildings. Desktop: full bleed, subtle left dark gradient, ivory title 榕安夜市, supporting line 放慢腳步，走進台灣的夜晚。, vermilion 開始逛夜市 button, WASD 移動 · 滑鼠環顧 · Esc 暫停, bottom left 聲音來源, bottom right 環境音 開啟. Mobile: name and 北街・攤販熱區, 暫停, circular minimap, translucent joystick and look pad. Clean Traditional Chinese sans typography; ink/ivory/vermilion/gold palette. HTML/CSS controls; no new gameplay, characters or weapons.

## Final fidelity ledger (2026-09-08)

Inspected the generated concept and actual browser screenshots with `view_image`. Checked entry at 1280×720, touch HUD at 390×844, and landscape at 844×390. The combined concept is 1821×864, containing two panels; each browser state was verified separately at usable viewport dimensions.

| Comparison | Evidence and result |
|---|---|
| Copy | Title, supporting line, start/pause labels, sound source and sound toggle match. Added Shift/arrow hints, volume, loading/errors and pause settings are the required functional states listed above. |
| Layout | Full-bleed street, left-aligned title/action, bottom sound controls, top HUD and right circular minimap retained. No card grid or new product sections. |
| Typography | Bold ivory Traditional Chinese display title, readable body/control scale, responsive title sizing and short landscape layout. |
| Palette / gradient | Ink, ivory, vermilion and gold tokens retained. Left gradient is only present in entry/pause; walking view stays unobscured. |
| Scene treatment | Same v5 GLB, confirmed byte-identical SHA-256 to source. Perspective changes while walking. Realtime Lambert lighting replaces offline Cycles lighting, with reduced local light intensity to correct over-bright counters. |
| Touch controls | Left movement pad and right look pad do not overlap the minimap or pause button. Actual two-touch input verified in Chromium emulation. |

The implemented interface follows the concept's composition and visual system. Intentional differences: exact 3D camera framing and realtime illumination vary from the offline reference; the minimap shows the actual district geometry; functional secondary copy and controls are added as listed. No unresolved clipping or horizontal overflow was found in the tested sizes.

## Requested update: bilingual titles and fixed lighting

The user changed the display name to `逛夜市` (Traditional Chinese) and `SAY YACHI` (English). These supersede the title in the original concept image. The same visual system is retained, with a language button in the menu and responsive English title/control sizing. Menu, HUD, districts, loading/error states, accessible labels and audio attribution are translated. Original 3D storefront signs remain Taiwanese signage.

The former six nearest-light pool is removed. All 239 local lights contribute to a static vertex-light bake before entry. A fixed 256×256 ground illumination map preserves light pools on large road triangles. Neither light selection nor illumination data depends on player position; hemisphere and moon lighting remain fixed. This is static illumination without baked occlusion/shadows, matching the prior no-shadow realtime rendering boundary.

Validation: TypeScript/build and the four collision tests pass. Browser checks cover title and language attributes, query-string language selection, switching while paused, persistence, English attribution, desktop 1280×720 and touch layouts 390×844 / 844×390. Player movement from X=-38 to about -30 leaves all 239 lamps and the baked illumination data unchanged. Screenshots inspected for distant stalls and road illumination, English entry/HUD/pause layout; no JavaScript or shader errors in the checked flow.

Delivery browser note: after repeated preview navigation, the Codex in-app browser reported WebGL context loss followed by `Web page caused context loss and was blocked`. A fresh in-app tab remained blocked. The cause of that browser/GPU interruption was not established. The same final build loaded successfully in Chrome; the working Chrome tab was retained for delivery. Automated Chromium desktop/mobile flows had already passed. No browser security or GPU settings were changed.


### Night sky

Added a procedural equirectangular background with sparse steady stars, six angular cloud wisps and one warm moon. The sky stays fixed under player translation, with the moon visible above the eastward street. No external image assets or additional scene lights. Production build passes; browser visual inspection confirms all three sky elements, unchanged 239 static lamps, 256 loaded characters and no page errors. Preview: `assets/night-sky-preview.png`.
