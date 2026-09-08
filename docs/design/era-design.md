# Digital Singularities

Scope: homepage, Demo catalog, Blog index and reading stylesheet, About, shared shell. No showcase runtime changes. AI Hub collection data and interactions retained.

References: era-home-concept.png and era-pages-concept.png, generated with the built-in imagegen tool. Production asset: public/images/era/singularity.webp.

Design system: #08090b background, #f5f5f4 text, #a0a2a7 secondary text, #d8ff62 lime accent, #292b2f rules. Heavy grotesk display, system Chinese body, monospaced utility labels. 1440px maximum content, fluid 24–64px gutters. Open editorial sections, landscape project media, generous journal rows, circular arrows, rounded primary CTA, oversized footer wordmark.

Homepage: compact navigation; two-line MAKE THE / UNEXPECTED.; native Chinese copy 把好奇心，變成可以體驗的世界。; 探索 Demo and 閱讀 Blog; interactive chrome sculpture; scroll link; Selected playgrounds; Field notes; About invitation; footer. Secondary titles PLAY / GROUND., FIELD / NOTES., STAY / CURIOUS.

Intentional adaptations: retain actual catalog projects, previews, descriptions, article dates/titles and author email instead of invented mockup content. Preserve all three featured projects rather than mockup's two. Journal has semantic text rows because existing posts do not supply thumbnails. Add an accessible animation pause control. Responsive mobile uses stacked art and copy rather than shrinking desktop text. No alternate legacy design.

Motion: image float and pointer perspective, intersection-based entrance, image hover zoom and arrow movement. Reduced-motion disables motion; pause control stops sculpture animation and transforms. No scroll interception or custom cursor.

Asset prompt: extract only the reference's iridescent liquid chrome intertwined torus, centered on uniform #08090b, silver with blue/pink reflections, no text/UI/frame. Reference prompts request the homepage and coordinated Demo/Blog/About editorial layouts in the above palette.

## Browser verification — 2026-09-08

Verified in the Codex in-app browser, including production standalone output. Desktop reference dimensions: 1536 × 1024; also checked default 1280 × 720, mobile 393 × 852 and narrow 320 × 740. No Playwright fallback was needed.

Fidelity ledger:
- Copy: MAKE THE / UNEXPECTED. and Chinese supporting sentence match the selected direction. Navigation keeps the existing 首頁 label; secondary CTA is 閱讀 Blog. No invented mockup dates, contact addresses or projects were published.
- Typography: oversized heavy grotesk titles, readable Chinese body, restrained metadata. Fixed title clipping at 320px by lowering mobile minimum display sizes.
- Palette: near-black canvas, white display text, acid-lime calls to action; removed the previous blue/brown article panel treatment.
- Asset treatment: standalone generated chrome sculpture, no color tint, radial edge blend. Adjusted desktop size and pause-button position to avoid the hero footer. WebP source is approximately 168 KiB.
- Containers: open full-width editorial hero, large feature followed by paired previews, ruled article rows. Removed the obsolete article accent span that displaced the new grid columns.
- Responsive: mobile stacks art after copy, large touch targets, full-width navigation overlay; menu collapses on navigation and supports Escape. No horizontal document overflow in checked narrow pages.
- Motion: pause button changes computed animation-play-state to paused; scroll reveals become visible when entered; emulated prefers-reduced-motion yields animation-name none. About sculpture is static.

Intentional compositional differences from the compressed concept board: taller immersive homepage hero, three real featured projects (one wide and two paired), full-width journal rows without invented thumbnail art, and separate About invitation. These support the actual content and requested immersive direction. The reference is art direction rather than a pixel-identical page screenshot.

The concept and final desktop screenshot were inspected with view_image. Secondary-page reference and final Blog screenshot were also compared. Typography, palette, imagery, hierarchy, copy and responsive behavior were reviewed; no known blocking visual defects remain in checked surfaces.

Checks: npm run lint; npm run build (including TypeScript); npm test, 36 passed; git diff --check. All four main navigation destinations and a standalone Blog article were exercised. AI Hub entry and existing collection content checked. Browser console showed no errors/warnings during these checks. Demo runtime files were not edited or rebuilt; runtime gameplay QA and production deployment are outside this change.
