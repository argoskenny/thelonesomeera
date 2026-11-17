## Goal
> Project clarification (2026-11-17): Keep this demo as a single full-screen Hero with no lower section.
> Replace the bottom bar's downward arrow and “Scroll down for more” with a decorative sparkle and
> “Move your cursor to reveal”. On devices with `hover: none`, show “Every detail, uncovered” instead,
> since the moss is already fully visible. This clarification overrides the original bottom-bar copy below.

You're building a single full-screen hero section for a fictional data product called "easylog". A gnarled log floats
across a sky-blue gradient. The log is bare wood, and moss grows on it wherever the visitor's cursor moves, then
slowly fades away behind it. The page opens with a pixelated, zoomed-in preloader that counts to 100% while the log
sharpens and settles into place. Then the navigation, headline and copy blur in one after another. Match everything
below exactly: layout, type, colors, images and motion. Keep the copy and images as given; the user swaps in their own
content afterwards.

## Stack and setup
- Vite + React 19 + TypeScript. Plain CSS: one global tokens file plus CSS Modules per component. No CSS framework.
- Libraries: `gsap` 3.15 (intro timeline only). Nothing else.
- Create and run:
  ```bash
  npm create vite@latest easylog -- --template react-ts
  cd easylog
  npm install gsap
  npm run dev
  ```
- Folder layout:
  ```
  index.html                    fonts, title, empty favicon, preloads for the two log images
  src/main.tsx                  renders <Hero /> and <Cursor />
  src/styles/tokens.css         all design tokens as CSS variables
  src/styles/global.css         reset and base styles
  src/lib/loadImages.ts         image loading with byte progress
  src/components/Hero.tsx       layout, copy, intro timeline (+ Hero.module.css)
  src/components/LogCanvas.tsx  the log canvas (+ LogCanvas.module.css)
  src/components/Nav.tsx        navigation (+ Nav.module.css)
  src/components/Cursor.tsx     custom cursor (+ Cursor.module.css)
  ```
- Delete the scaffold's leftovers that aren't in this layout (`App.tsx`, `App.css`, `index.css`, `src/assets/`, the
  sample icons in `public/`). Keep TypeScript's `"strict": true`.
- Page title: "easylog — Every layer tells a story."; meta description: "EASYLOG transforms historical data into
  structured decisions — without losing the story behind it."
- `index.html` gets `<link rel="icon" href="data:,">` (no favicon 404) and `<link rel="preload" as="fetch" crossorigin>`
  for both log images. They're loaded with `fetch()`, so an `as="image"` preload wouldn't be reused.
- Keep `<StrictMode>` in `main.tsx`. Every effect cleans up after itself (ignore a stale load, revert GSAP with
  `gsap.context().revert()`, cancel animation frames and listeners), because StrictMode runs effects twice in
  development. Don't return a function from the `gsap.context()` callback: GSAP calls it on revert.
- State shared between components: `Hero` owns the intro. It keeps a mutable ref `{ zoom, pixel }` that GSAP tweens
  and passes it to `LogCanvas`, which reads it every frame. The decoded images go to `LogCanvas` as props once loaded.
- Visual values live in `tokens.css`. Motion numbers (durations, the 2.6× zoom, 64 px blocks, brush settings) live as
  named constants at the top of the component that uses them.
- Write `backdrop-filter` unprefixed only. The build adds prefixes where they're needed, and hand-writing both can make
  it drop one.

## Design tokens
**Scale.** All sizes below are design pixels. Desktop (width ≥ 1024 px) is designed at 1440 × 900:
1 design px = `min(100vw / 1440, 100svh / 760)`. Mobile (width < 1024 px) is designed at 415 × 900:
1 design px = `min(100vw / 415, 100svh / 760)`. So the design scales with the viewport width, and shrinks to fit on
screens shorter than 760 design px. Put this in a `--u` variable on `:root`, swap it in a `max-width: 1023px` media
query, and write every size as `calc(N * var(--u))`. The canvas needs the same unit in JS: measure a hidden probe
`div` that is `calc(100 * var(--u))` wide and divide by 100. Borders (1 px) and blur radii (`blur(12px)`,
`blur(4px)`) are CSS pixels, not design pixels.

**Colors**
| Name | Hex | Role |
|---|---|---|
| sky-0 | `#C8E6FF` | gradient centre (bottom middle) |
| sky-1 | `#A3CAE6` | gradient stop |
| sky-2 | `#7EADCD` | gradient stop |
| sky-3 | `#5799CF` | gradient stop |
| sky-4 | `#3085D2` | gradient edge (top corners), page background |
| white | `#FFFFFF` | all text, arrow circle |
| lime | `#D0F24B` | CTA background |
| ink | `#17242B` | CTA text |
| black | `#000000` | arrow glyph |
| glass fill | `rgba(255,255,255,0.06)` | nav pill and menu button fill (desktop) |
| glass fill strong | `rgba(255,255,255,0.15)` | menu button fill (mobile), menu hover |
| glass edge | `rgba(255,255,255,0.75)` → `rgba(255,255,255,0.12)` | 1 px pill border gradient |
| cursor | `rgba(255,255,255,0.5)` | cursor disc |

**Background gradient**
- Desktop: `radial-gradient(ellipse 100% 100% at 50% 100%, sky-0 0%, sky-1 27.5%, sky-2 55%, sky-3 77.5%, sky-4 100%)`.
- Mobile: `radial-gradient(ellipse 263% 100% at 50% 100%, sky-0 0%, sky-1 15.9%, sky-2 31.8%, sky-3 58.4%, sky-4 85%)`.

**Typography.** Two families, both from Google Fonts (SIL Open Font License). Load them in `index.html`:
`https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500&family=Instrument+Serif:ital@1&display=swap`
- Instrument Serif, italic: https://fonts.google.com/specimen/Instrument+Serif
- Instrument Sans: https://fonts.google.com/specimen/Instrument+Sans

| Style | Family | Desktop size | Mobile size | Weight | Tracking | Line height |
|---|---|---|---|---|---|---|
| Display serif ("Every layer") | Instrument Serif italic | 184 | 79.3 | 400 | −0.06em | trimmed (see below) |
| Display sans ("tells a story.", counter) | Instrument Sans | 170 | 73.2 | 400 | −0.06em | trimmed |
| Body | Instrument Sans | 20 | 16 | 500 | −0.02em | 22 (mobile 20) |
| Small (bottom bar) | Instrument Sans | 18 | 16 | 400 | −0.03em | 1 |
| Nav links, menu | Instrument Sans | 14 | 16 | 500 | −0.02em | 1 |
| Button | Instrument Sans | 18 | 18 | 400 | −0.04em | 1 |

Casing as typed. Set `letter-spacing` on the same element as its `font-size`: an `em` value inherited from a parent is
computed at the parent's size.

The display lines, the counter and the body paragraphs use `text-box: trim-both cap alphabetic` (display lines and
counter at `line-height: 1`), so each text box runs from cap height to baseline, and the positions below are measured
to those trimmed edges. `text-box` applies to block containers only, so put it on block elements, not flex containers.
For browsers without it, add the same edges as negative margins inside
`@supports not (text-box: trim-both cap alphabetic)`. Both fonts have a 0.72em cap height:
- display serif: `margin: -0.12em 0 -0.16em`;
- display sans and counter: `margin: -0.14em 0`;
- body: `margin-block: calc(var(--body-size) * 0.36 - var(--body-leading) / 2)`.

**Spacing and shape**
- Page edge: 28 desktop, 20 mobile.
- Right column (desktop): x = 1087 at 1440, anchored to the right edge: the lead is 319 wide, 34 from the right;
  the action block is 325 wide, 28 from the right.
- Pill radius: `99px` (a literal, fully round). Nav height: 50. Cursor: 40 × 40 design px (it scales with the page).

Set all of these up first as CSS variables in `tokens.css`, and use only them.

## Assets
| Asset | URL | Used in |
|---|---|---|
| Bare log (2752 × 1536, transparent) | https://assets.uberdesigner.ai/easylog/log-bare.webp | LogCanvas, always drawn |
| Mossy log (2752 × 1536, transparent) | https://assets.uberdesigner.ai/easylog/log-moss.webp | LogCanvas, drawn through the cursor mask |
| easylog logo (89.65 × 30, white SVG) | https://assets.uberdesigner.ai/easylog/logo.svg | Nav, top left |

Use these URLs as they are; don't substitute or regenerate them. The two log images are an exact pair: same size,
same framing, aligned pixel for pixel. Draw them at the same rectangle. The server sends CORS headers, so they can be
fetched and drawn to a canvas from any origin.

## Layout — section by section
One `<main>`, `height: 100svh`, `overflow: hidden`, with the background gradient. Don't set `overflow: hidden` on
the body. Elements are anchored to the top or the bottom of the screen as noted, so the layout holds on screens shorter
or taller than 900.

Everything except the counter starts hidden in CSS (`opacity: 0` on the nav, headline, lead, action paragraph, CTA and
bottom bar); M2 reveals it.

### 1. Log
- Desktop: the image rectangle is 1482 × 827 (the image's own 2752 : 1536 ratio), but never narrower than 102.92vw
  (`width: max(1482u, 102.92vw)`), so it always bleeds off both sides and its cut ends never show. It's centred
  horizontally, and its centre is 92.5 below the vertical middle of the screen (`top: calc(50% + 92.5u)`, translated
  −50% / −50%). The clip box is the whole hero (`inset: 0`).
- Mobile: the log is drawn inside a clip box 826 × 345 (`width: max(826u, 110vw); aspect-ratio: 826 / 345`), centred
  horizontally, its centre 31.5 below the vertical middle of the screen. The image fills the clip box's width
  (≈ 461 tall at 826) and its top is 22.9% of the clip box's height above the clip box's top (79 at 345). Anything
  outside the clip box isn't drawn.
- Render it on one `<canvas>` that covers the whole hero (`position: absolute; inset: 0; pointer-events: none`) at
  `min(devicePixelRatio, 2)`. Place three invisible (`visibility: hidden`), absolutely positioned `<div>`s: a clip box,
  an image box inside it, and the unit probe. Give them the CSS above, and read their `getBoundingClientRect()` on
  resize (a `ResizeObserver` on the hero) to know where to draw. Behaviour: Motion → M1 and M3.
- Behind all the text (lowest layer above the background).

### 2. Navigation (top, desktop)
- A row at top 28, left 28, right 28: `display: flex; justify-content: space-between; align-items: center`.
- Left: the logo, 89.65 × 30, linking to `#`.
- Centre: a glass pill, height 50, padding 0 28, gap 31, holding seven links: Main, Platform, Use, Cases,
  Integrations, Journal, Contact.
- Right: a glass "menu" button, height 50, padding 0 24, text "menu".
- Glass: background glass fill, `backdrop-filter: blur(12px)`, and a 1 px border drawn as a `::before` with a
  `linear-gradient(100deg, edge 0%, edge-soft 22%, edge-soft 78%, edge 100%)` and the standard mask-composite trick
  (content-box xor border-box), so the border is brightest at both round ends.
- The logo and the menu button differ in width, so the pill sits a couple of pixels off centre. That's the design.
- Links go to `#`. The menu button is a `<button>` that does nothing yet.
- Mobile: the row sits at top 47, left and right 20. The link pill is hidden. The menu button is 43 high, padding
  0 20, background glass fill strong, with the same gradient edge, text 16.
- States: links go to opacity 0.6 on hover; the menu button's fill goes to glass fill strong on hover. Both 200 ms,
  `cubic-bezier(0.22, 1, 0.36, 1)`.

### 3. Headline and lead (top)
- Desktop headline: an `<h1>` at left 28, `top: 114.5`, a column with gap 8:
  - line 1: "Every layer" in the display serif, so its baseline lands at y 247;
  - line 2: "tells a story." in the display sans, its cap top at y 255, baseline at y 377.
  Each line is a `display: block` span with `white-space: nowrap`. The h1 has `aria-label="Every layer tells a story."`.
  Each character is its own `inline-block` span with `white-space: pre`, for the reveal animation, and the line spans
  are `aria-hidden`.
- Desktop lead: "Turn forgotten records, scattered logs, and silent activity into something readable." Body style,
  top 162, width 319, right 34 (so x = 1087 at 1440). It wraps to three lines.
- Mobile (there's no separate tablet design: the phone layout scales up to 1023 px): headline and lead stack in one
  column at left and right 20, top 126.7, gap 28 between the headline and the
  lead. The headline keeps its 8 gap, and each line stays on one line. The lead is full width (two lines).
- The text sits above the log.

### 4. Action block (bottom right)
- Desktop: a column 325 wide, right 28 (x = 1087 at 1440), bottom 89, gap 28, aligned left:
  - paragraph, body style: "EASYLOG transforms historical data into structured decisions — without losing the story
    behind it." (three lines);
  - CTA link "Start uncovering": 207 × 61, radius 99, background lime, text ink in the button style, centred.
- Mobile: left and right 20, bottom 98. The CTA spans the full width (375 at 415), height 61.
- States: the CTA scales to 1.03 on hover, 200 ms, `cubic-bezier(0.22, 1, 0.36, 1)`.

### 5. Bottom bar
- Desktop: a row at left 28, right 28, bottom 28, `justify-content: space-between`, items centred.
  - Left: a 33 × 33 white circle holding a black "↓" (18), then a 12 gap, then "Scroll down for more" (small style).
  - Right: "20–26" (small style, en dash).
- Mobile: bottom 20, text 16. The circle and arrow keep their desktop sizes (33, 18), as does the logo (89.65 × 30).

### 6. Preloader counter (bottom right, only during the intro)
- A `<p>` (`display: block`, `white-space: nowrap`) holding the number and a small "%" span, in white Instrument Sans.
  The number is display sans size (170, mobile 73.2), tracking −0.06em, tabular figures, trimmed to cap height and
  baseline. The "%" is `font-size: 0.25em`, `margin-left: 0.04em`, no tracking, on the same baseline.
- Desktop: right 40, bottom 38. Mobile: right 20, bottom 24.
- Shows at least two digits, padded: "00" at the start, then "04", "50", "100".

### 7. Cursor
- On devices with a mouse (`(hover: hover) and (pointer: fine)`): hide the system cursor (`cursor: none` on body,
  links and buttons). Show a fixed 40 × 40 disc instead, background `rgba(255,255,255,0.5)`,
  `backdrop-filter: blur(4px)`, `pointer-events: none`, on top of everything. Hidden until the first mouse move and
  when the mouse leaves the window (opacity 200 ms, linear). It eases from its last position when the mouse returns.
- On touch devices: no custom cursor.

## Motion
All times in seconds. t = 0 is the moment both log images are loaded and decoded (`createImageBitmap`) and the three
font faces have loaded: wait for `document.fonts.load('italic 400 1em "Instrument Serif"')`,
`document.fonts.load('400 1em "Instrument Sans"')` and `document.fonts.load('500 1em "Instrument Sans"')`, not
`document.fonts.ready`, which can resolve before the fonts have started loading.

### M1 · Preloader (counter, zoom, pixelation)
- Before t = 0: the screen shows only the gradient and the counter. The counter eases toward real loading progress
  (fetch both images with a `ReadableStream` reader and count bytes against `Content-Length`). Display `progress × 0.9`
  through a 0.4 s `power1.out` follow (`gsap.quickTo`), so it never shows 100 before everything is ready. Without a
  `Content-Length` on every file, count finished files instead, and never let the value go backwards. The counter
  shows `Math.round(value × 100)`. If either image fails, log the error, draw no log, and still run M2.
- t = 0 → 0.8: the counter runs from its current value to 100, `power1.out`.
- t = 0 → 0.9: the log scales from 2.6× to 1× around the centre of its image box, `expo.out`.
- t = 0 → 1.0: the log is pixelated with square blocks that shrink from 64 px to 1 px. Tween `log2(blockSize)` from 6
  to 0 with linear easing (so blocks halve at a steady rate). To pixelate, draw the scene into a canvas
  `1 / blockSize` the size, then draw that back up with `imageSmoothingEnabled = false`. Blocks are CSS pixels; the
  whole composed scene (bare log plus moss) is pixelated, on a grid that starts at the canvas's top left. On mobile the
  clip box applies throughout, so only its 826 × 345 band shows during the zoom.
- t = 0.85 → 1.25: the counter fades to 0, `power1.in`.
- The moss reveal (M3) runs during the preloader too, so moss already follows the cursor while the log is pixelated.

### M2 · Reveal sequence
Everything except the counter starts at opacity 0.
- t = 1.0: the nav fades from opacity 0 + `blur(8px)` to 1 + `blur(0)`, 0.5 s, `power2.out`.
- t = 1.3: the headline characters reveal left to right. Each goes from opacity 0, `blur(18px)`, `xPercent: -30` to
  normal, 0.8 s, `power2.out`, stagger 0.035 s. Both lines start together at 1.3, each with its own stagger.
- t = 2.1: the lead blurs in: opacity 0 + `blur(10px)` → 1 + `blur(0)`, 0.6 s, `power2.out`.
- t = 2.5: the bottom bar, same blur-in.
- t = 2.7: the action paragraph, same blur-in.
- t = 2.85: the CTA, same blur-in.
- Every blur-in ends with `clearProps: "filter"`, and the headline characters with `clearProps: "filter,transform"`.
  A leftover `filter: blur(0px)` makes the element a backdrop root, and the glass pills inside the nav stop blurring
  what's behind them.
- It plays once and isn't interrupted.

### M3 · Moss reveal (the hard bit)
The bare log is always drawn. The mossy log is drawn on top, through a mask the cursor paints, so moss grows where the
cursor goes and recedes about a second after it leaves.
- Keep a list of brush stamps `{ x, y, strength, born }` (CSS px relative to the hero, seconds). Every frame, clear the
  mask and redraw it from the list, each stamp at `strength × e^(−age / 1.1)`, and drop stamps weaker than 0.004.
  Don't fade a canvas in place by drawing a translucent `destination-out` over it each frame: 8-bit alpha rounds small
  values back up, so the fade stalls at 10–50% depending on the refresh rate and leaves a permanent ghost trail.
- Add stamps independently of the frame rate:
  - while the cursor moves: one stamp every 0.12 × radius of travel along its path (carry the leftover distance
    between frames), strength 0.5;
  - while it rests inside the window (no movement for 50 ms): one stamp every 50 ms at its position, strength 0.25, so
    moss stays under a still cursor;
  - when it leaves the window (`mouseout` with no `relatedTarget`): no more stamps, and the existing ones fade out.
    When it comes back, start a new path from where it enters.
- Brush: a sprite canvas with a radial gradient, radius 240 design px (× the unit, × 0.5 for the mask): black at 0,
  `rgba(0,0,0,0.85)` at 0.45, transparent at 1.
- Mask: an offscreen canvas at half the hero's CSS size.
- Compose: clear a layer canvas, draw the mossy log into it, draw the mask over it with `destination-in`, then draw the
  layer onto the main canvas over the bare log.
- Touch screens (`hover: none`): draw the mossy log fully, no mask. That's the mobile design. This is its own media
  query, separate from the < 1024 px layout switch: a narrow desktop window gets the mobile layout with the mask, a
  large touch screen gets the desktop layout with full moss.
- Skip any frame where a canvas has zero width or height (hidden tab, not laid out yet).

```ts
const RADIUS = 240 * unit;          // CSS px (unit = probe width / 100)
const r = Math.round(RADIUS * 0.5); // brush sprite half-size in mask px; the sprite is 2r × 2r

// once per frame, if the pointer moved since the last frame (px, py = its position relative to the hero)
const step = RADIUS * 0.12;
const dx = px - lastX, dy = py - lastY, dist = Math.hypot(dx, dy);
for (let d = step - travel; d <= dist; d += step) {
  stamps.push({ x: lastX + (dx * d) / dist, y: lastY + (dy * d) / dist, strength: 0.5, born: now });
}
travel = (travel + dist) % step;
lastX = px; lastY = py;

// every frame: the mask
maskCtx.clearRect(0, 0, mask.width, mask.height);
stamps = stamps.filter((s) => {
  const a = s.strength * Math.exp(-(now - s.born) / 1.1);
  if (a < 0.004) return false;
  maskCtx.globalAlpha = a;
  maskCtx.drawImage(brush, s.x * 0.5 - r, s.y * 0.5 - r);
  return true;
});
maskCtx.globalAlpha = 1;

// every frame: compose (x0, y0, w, h = the log's rectangle, in CSS px)
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
layerCtx.clearRect(0, 0, heroW, heroH);
layerCtx.drawImage(moss, x0, y0, w, h);
layerCtx.globalCompositeOperation = "destination-in";
layerCtx.drawImage(mask, 0, 0, heroW, heroH);
layerCtx.globalCompositeOperation = "source-over";
ctx.clearRect(0, 0, heroW, heroH);
ctx.drawImage(bare, x0, y0, w, h);
ctx.setTransform(1, 0, 0, 1, 0, 0); // the layer is already at device size
ctx.drawImage(layer, 0, 0);
```
Set the transforms at the start of every frame, as above, since the last line resets the main one.

### M4 · Cursor follow
The disc eases toward the pointer, covering 30% of the remaining distance per frame at 60 fps (frame-rate
independent: `k = 1 - 0.7^(dt / 16.67ms)`).

### Reduced motion (`prefers-reduced-motion: reduce`)
No zoom, no pixelation and no counter (hide it): the log appears at its final size. Still wait for t = 0, so the log
doesn't pop in late. Everything that M2 reveals fades in together over 0.4 s, `power1.out`, without blur or stagger. The moss reveal (M3) and the cursor stay, since they follow the user's own
movement.

## Build order
1. Set up the project and install gsap.
2. Add the design tokens (`tokens.css`), the global reset and the fonts.
3. Build the static layout of every section, desktop first. Draw the log at its final size, bare, no motion.
4. Add the mobile layout.
5. Add motion one behaviour at a time: M3 (moss mask), then M1 (preloader), then M2 (reveals), then M4 (cursor).
6. Compare with this description section by section and fix the differences.
After each step: run the project and check it before going on.

## Done when

Verified locally in Chrome/Playwright on 2026-11-17, including touch and reduced-motion emulation; real-device Safari and production deployment remain untested.

- [x] At 1440 × 900 every element sits at the positions above: headline baselines at 247 and 377, lead at 1087 / 162,
      action block 89 from the bottom, bottom bar 28 from the bottom.
- [x] At 1280 × 720, 1920 × 1080, 768 × 1024 and 375 × 667 everything fits on one screen with nothing cut off.
- [x] Instrument Serif italic and Instrument Sans load (no fallback fonts visible).
- [x] The preloader counts to 100 while the log zooms from 2.6× and un-pixelates, then the counter fades.
- [x] The nav, headline (character by character), lead, bottom bar, paragraph and CTA blur in, in that order.
- [x] Moving the mouse grows moss under the cursor; a still cursor keeps its moss; a few seconds after the cursor
      leaves the window the log is completely bare again, with no faint trail left.
- [x] On a phone the log shows full moss, the link pill is hidden, and the mobile layout matches.
- [x] Reduced motion skips the preloader and blur.
- [x] No console errors, no horizontal scroll.

## Make it yours
- **Copy:** the headline, both paragraphs, the CTA label and the nav labels are in `Hero.tsx` and `Nav.tsx`. Keep the
  headline to two short lines: the layout is built around them.
- **Brand:** swap `logo.svg` for your logo (around 90 × 30, white). Change `--lime` / `--ink` for your button, and the
  `--sky-*` stops for your background.
- **Images:** replace the two log images with your own pair: one plain, one "revealed" (moss, frost, paint, rust…),
  generated or shot so they're the same size and framing, aligned pixel for pixel, on transparent backgrounds. Keep
  the 2752 × 1536 ratio, or update the image box's `aspect-ratio`.
- **Reveal feel:** brush radius (240), fade time (1.1 s), stamp spacing (0.12) and strengths (0.5 moving, 0.25
  resting).
