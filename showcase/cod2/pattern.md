# FPS Pattern Prompts

這份文件整理了可直接貼到 web 版 GPT 生圖的材質提示詞，用來生成：

- 地面材質
- 通風格柵材質
- 牆面材質
- 障礙物材質
- 補充道具材質

目標是給目前這個 FPS 專案使用。風格上要偏：

- 現代軍事訓練場
- 原創、無版權風險
- 遊戲可用
- 可重複平鋪
- 可混搭，讓每關能隨機換材質

## 通用生成規則

每次生成前，建議把這段規則一起附上：

```text
Create a game-ready material texture for a first-person shooter training arena.
The result must be original and generic, with no copyrighted franchise references.
Make it suitable for a stylized-realistic indie game.
No text, no logos, no numbers, no warning labels, no watermarks.
No perspective view, no environment shot, no object mockup, no dramatic shadows.
Use flat neutral lighting.
Texture only, full-frame, centered, edge-to-edge.
If this is a wall/floor/cover texture, it must be seamless and tileable.
Square image, high clarity, readable medium detail, not photobashed noise.
```

## 建議輸出規格

- 比例：`1:1`
- 建議尺寸：`1024x1024` 或更高
- 地面 / 牆壁 / 障礙物：要求 `seamless tileable`
- 補給道具：可做透明背景版本

---

## 1. 地面材質

### Ground A: Painted Concrete

建議檔名：`ground_concrete_bluegray_01.png`

```text
Create a seamless tileable ground material for a modern military training range floor.
Top-down material swatch, full frame texture only.
Painted concrete slab floor with subtle wear, fine cracks, dusty scuffs, faint exposed aggregate.
Game-ready PBR-inspired stylized realism texture concept art.
Orthographic top-down, centered, edge-to-edge, no perspective.
Flat neutral studio lighting.
Cool gray and muted blue-gray palette with restrained contrast.
Material details: concrete, worn floor paint, fine grit.
No objects, no decals, no text, no logos, no watermark.
Avoid dramatic lighting, large stains, puddles, debris piles, borders, repeated obvious motifs.
Must be seamless and tileable.
```

### Ground B: Tactical Rubber Panels

建議檔名：`ground_rubber_panel_01.png`

```text
Create a seamless tileable ground material for a compact FPS arena floor.
Top-down material swatch, full frame texture only.
Rubberized tactical flooring with interlocking industrial panels and subtle grit.
Game-ready stylized realism texture concept art.
Orthographic top-down, edge-to-edge, no perspective.
Flat neutral lighting.
Charcoal, slate, and muted olive accent palette.
Material details: rubber mat, composite panel, fine dust.
No objects, no text, no logos, no watermark.
Avoid bevelled fake 3D tiles, dramatic highlight streaks, heavy scratches, puddles, perspective, borders.
Must be seamless and tileable.
```

### Ground C: Weathered Tarmac

建議檔名：`ground_tarmac_worn_01.png`

```text
Create a seamless tileable ground material for a training complex exterior floor.
Top-down material swatch, full frame texture only.
Sun-faded tarmac concrete with worn painted lane markings blended into the surface.
Game-ready stylized realism texture concept art.
Orthographic top-down, edge-to-edge, no perspective.
Flat and even lighting.
Warm gray, tan dust, and muted faded yellow palette.
Material details: tarmac, concrete dust, weathered paint.
No objects, no text, no logos, no watermark.
Avoid large arrows, readable signage, perspective shadows, giant cracks, clutter.
Must be seamless and tileable.
```

---

## 2. 牆面材質

### Wall A: Poured Concrete Wall

建議檔名：`wall_concrete_cast_01.png`

```text
Create a seamless tileable wall material for a modern FPS training arena.
Front-facing material swatch, full frame texture only.
Poured concrete wall with modular cast seams, subtle repair patches, restrained wear.
Game-ready stylized realism texture concept art.
Straight-on orthographic view, edge-to-edge, no perspective.
Flat neutral lighting.
Cool gray cement palette with slight steel-blue undertones.
Material details: poured concrete, repair patch, mineral staining.
No posters, no text, no logos, no watermark.
Avoid deep dramatic shadows, moss, graffiti, visible room corners, large unique damage.
Must be seamless and tileable.
```

### Wall B: Painted Cinder Block

建議檔名：`wall_cinderblock_painted_01.png`

```text
Create a seamless tileable wall material for an indoor shoot house.
Front-facing material swatch, full frame texture only.
Painted cinder block wall with subtle chipping, light grime, and faint repaint passes.
Game-ready stylized realism texture concept art.
Orthographic straight-on, edge-to-edge, no perspective.
Flat even lighting.
Desaturated sand, gray, and muted khaki palette.
Material details: cinder block, matte paint, dust.
No signage, no text, no logos, no watermark.
Avoid high-contrast shadows, graffiti, broken holes, perspective distortion, large stains.
Must be seamless and tileable.
```

### Wall C: Reinforced Metal Panels

建議檔名：`wall_metal_panel_01.png`

```text
Create a seamless tileable wall material for a futuristic military range without branding.
Front-facing material swatch, full frame texture only.
Reinforced metal wall panels with bolts, seams, subtle abrasion, and restrained dirt.
Game-ready stylized realism texture concept art.
Orthographic straight-on, edge-to-edge, no perspective.
Flat studio-neutral lighting.
Gunmetal, dark gray, and muted cyan undertones.
Material details: brushed steel panel, painted metal, abrasion.
No logos, no text, no warning labels, no watermark.
Avoid heavy rust, sci-fi neon glow, perspective lighting, embossed symbols, unique hero panels.
Must be seamless and tileable.
```

---

## 3. 通風格柵材質

這組材質是給「鋪在地面上的通風格柵跑道」使用，不是單一大塊裝飾板。

使用情境：

- 每塊都是正方形模組
- 多塊連接後可形成長條主線
- 可以直角轉彎
- 可以接出支線
- 要能和一般地板混鋪，不會看起來像獨立道具

所以 prompt 要特別避免：

- 中央單一大圖樣
- 單一 hero prop 視角
- 明顯上下方向性過強，導致轉角時破綻很重
- 過多文字、編號、警告標誌

### Vent A: Industrial Steel Grate

建議檔名：`vent_grate_industrial_01.png`

```text
Create a seamless tileable square floor material for a modular ventilation grate path in a first-person shooter training arena.
Top-down material swatch, full frame texture only.
Industrial steel floor grate with repeated square vent modules, narrow support ribs, dark recessed slats, subtle dust buildup, and restrained edge wear.
Designed for a grid-based runway or maintenance lane made from many connected square tiles.
Game-ready stylized realism texture concept art.
Orthographic top-down, centered, edge-to-edge, no perspective.
Flat neutral lighting.
Gunmetal gray, dark graphite, and muted steel-blue palette.
Material details: painted steel grate, vent slots, metal frame, light abrasion.
No text, no logos, no arrows, no warning labels, no watermark.
Avoid a single centered emblem, unique hero panel layout, dramatic highlights, deep rust, or directional composition that breaks 90-degree turns.
Must be seamless and tileable on all four edges.
```

### Vent B: Composite Utility Grille

建議檔名：`vent_grate_composite_01.png`

```text
Create a seamless tileable square floor material for a modular utility vent runway in a military FPS arena.
Top-down material swatch, full frame texture only.
Composite ventilation floor panel with square maintenance grille sections, inset mesh vents, reinforced corners, subtle grime, and muted industrial coating.
Designed to connect in long lines, right-angle corners, and branch paths across a floor grid.
Game-ready stylized realism texture concept art.
Orthographic top-down, edge-to-edge, no perspective.
Flat even lighting.
Muted olive gray, charcoal, and dusty khaki palette.
Material details: composite panel, recessed vent mesh, maintenance access plate, subtle wear.
No text, no logos, no numbers, no watermark.
Avoid hero prop rendering, oversized bolts in one focal point, strong one-way directional pattern, or large unique stains.
Must be seamless and tileable on all four edges.
```

### Vent C: Heavy Concrete-Framed Drain Grate

建議檔名：`vent_grate_concrete_frame_01.png`

```text
Create a seamless tileable square floor material for a modular drainage or ventilation grate strip in an outdoor FPS training compound.
Top-down material swatch, full frame texture only.
Heavy square grate modules set into concrete frames, with dark interior slots, worn cast metal bars, subtle sand dust, and restrained weathering.
Designed for repeated placement so many tiles can form a straight path, a corner, or a side branch like a runway service trench.
Game-ready stylized realism texture concept art.
Orthographic top-down, edge-to-edge, no perspective.
Flat neutral daylight.
Warm gray concrete, dark iron, and dusty tan palette.
Material details: cast drain grate, concrete frame, shallow grime, weathered surface.
No text, no logos, no signage, no watermark.
Avoid puddles, leaves, dramatic cracks, cinematic shadows, centered composition, or any large feature that becomes obvious when repeated.
Must be seamless and tileable on all four edges.
```

---

## 4. 障礙物材質

### Cover A: Ballistic Composite Cover

建議檔名：`cover_composite_olive_01.png`

```text
Create a seamless tileable obstacle material for a waist-high cover block in a military FPS range.
Material swatch only, no scene.
Painted ballistic cover composite with worn edges, subtle dust, and controlled abrasion.
Game-ready stylized realism texture concept art.
Orthographic material swatch, edge-to-edge, no perspective.
Flat neutral lighting.
Olive drab, gray composite, and muted sand dust palette.
Material details: ballistic composite, textured coating, chipped paint.
No logos, no text, no props, no watermark.
Avoid dramatic directional light, hero object render, perspective view, excessive rust.
Must be seamless and tileable.
```

### Cover B: Steel Crate Surface

建議檔名：`cover_steel_crate_01.png`

```text
Create a seamless tileable obstacle material for industrial crate-like cover in an FPS arena.
Material swatch only, no scene.
Stackable steel crate surface with recessed panels, worn paint, scuffs, and corner wear.
Game-ready stylized realism texture concept art.
Orthographic, edge-to-edge, no perspective.
Flat and even lighting.
Desaturated blue-gray steel with muted warning-yellow accents kept abstract.
Material details: painted steel, scuffed coating, edge wear.
No readable markings, no numbers, no labels, no logos, no watermark.
Avoid dramatic shadows, perspective render, unique front-face composition.
Must be seamless and tileable.
```

### Cover C: Concrete Barricade

建議檔名：`cover_concrete_barrier_01.png`

```text
Create a seamless tileable obstacle material for concrete barricade cover in a training arena.
Material swatch only, no scene.
Rough precast concrete barrier texture with subtle edge wear, dust, and visible aggregate.
Game-ready stylized realism texture concept art.
Orthographic texture swatch, full frame, no perspective.
Flat neutral lighting.
Cement gray and warm dust beige palette.
Material details: precast concrete, exposed aggregate, dust.
No text, no graffiti, no logos, no watermark.
Avoid giant cracks, dramatic shadows, perspective render, hero prop presentation, puddles.
Must be seamless and tileable.
```

### Cover D: Reinforced Rubber Barrier

建議檔名：`cover_rubber_barrier_01.png`

```text
Create a seamless tileable obstacle material for modular rubberized barrier blocks in a modern FPS training arena.
Material swatch only, no scene.
Dense reinforced rubber barrier surface with molded panel seams, shallow impact scuffs, subtle dust, and restrained industrial wear.
Game-ready stylized realism texture concept art.
Orthographic material swatch, edge-to-edge, no perspective.
Flat neutral lighting.
Dark charcoal, muted olive-black, and dusty gray palette.
Material details: ballistic rubber, molded reinforcement ribs, matte industrial coating.
No text, no logos, no labels, no watermark.
Avoid glossy wet highlights, hero prop framing, deep tears, dramatic lighting, or unique central composition.
Must be seamless and tileable.
```

### Cover E: Sand-Filled Fabric Bastion

建議檔名：`cover_fabric_bastion_01.png`

```text
Create a seamless tileable obstacle material for military training range bastion-style cover.
Material swatch only, no scene.
Heavy-duty woven fabric barrier with packed fill tension, stitched seams, subtle sag, dust staining, and restrained abrasion.
Game-ready stylized realism texture concept art.
Orthographic swatch, full frame, no perspective.
Flat even lighting.
Muted tan, faded khaki, and dust-brown palette.
Material details: woven ballistic fabric, stitched reinforcement, dusty field wear.
No text, no logos, no printed markings, no watermark.
Avoid dramatic folds, large tears, perspective shadows, cinematic staging, or one-off hero details.
Must be seamless and tileable.
```

### Cover F: Ceramic Armor Panel

建議檔名：`cover_ceramic_panel_01.png`

```text
Create a seamless tileable obstacle material for modular armored cover panels in a compact FPS arena.
Material swatch only, no scene.
Ceramic composite armor surface with segmented plates, subtle impact pitting, restrained edge wear, and fine dust in panel seams.
Game-ready stylized realism texture concept art.
Orthographic material swatch, edge-to-edge, no perspective.
Flat neutral lighting.
Slate gray, muted blue-gray, and pale ceramic undertones.
Material details: ceramic armor tiles, composite backing, sealed seams, light scuffing.
No logos, no text, no serial numbers, no watermark.
Avoid sci-fi glowing elements, oversized bolts, unique centerpiece panels, strong directional lighting, or broken repetition.
Must be seamless and tileable.
```

### Cover G: Corrugated Utility Shielding

建議檔名：`cover_corrugated_shield_01.png`

```text
Create a seamless tileable obstacle material for rugged utility shielding used as FPS arena cover.
Material swatch only, no scene.
Corrugated protective shielding with layered metal-composite ribs, worn painted coating, subtle grime, and controlled abrasion.
Game-ready stylized realism texture concept art.
Orthographic texture swatch, full frame, no perspective.
Flat neutral lighting.
Desaturated steel gray, muted navy-gray, and faint sand dust palette.
Material details: corrugated panel, painted metal, composite backing, shallow grime.
No text, no logos, no labels, no watermark.
Avoid dramatic rust streaks, hero object presentation, strong directional highlights, perspective render, or unique single-panel composition.
Must be seamless and tileable.
```

---

## 5. 補充道具材質

這類不一定要 tileable，但要依 3D 模型型態分開處理：

- `health` / `ammo`：
  長方形方塊用的六面展開貼圖，一張圖裡包含 front / back / left / right / top / bottom 六個面
- `utility`：
  單張 icon / decal，適合貼到六角盾牌形模型正面

如果是 `health` / `ammo`，建議在 prompt 裡明確要求：

- flat texture sheet
- box texture atlas
- six-face layout
- no perspective
- clean panel separation

這樣比較不會生出單張圖示，卻無法套到立方體六個面上。

### Pickup A: Health Pickup

建議檔名：`pickup_health_01.png`

```text
Create a game-ready flat texture sheet for a rectangular health pickup box in a first-person shooter.
This is not a single icon. It must be a six-face box texture atlas for a simple cuboid 3D model.
Show all six faces laid out flat in one image: front, back, left, right, top, bottom.
Use a clean box-net or texture-atlas layout with clear panel separation and no perspective.
The design should fit a compact medical supply box with slightly longer width than height.
Generic health pickup styling with a white medical cross, muted red casing accents, steel gray structural parts, and subtle utilitarian panel details.
Clean stylized-realistic game prop texture.
Orthographic flat texture sheet, square canvas, high readability, no environment.
Soft neutral lighting baked into the texture style only, with restrained shading.
White, muted red, dark gray, and brushed steel palette.
Material details: painted metal, matte polymer, panel seams, light scuffs, simple latches, controlled wear.
No text, no logos, no watermark, no brand packaging, no realistic product photography.
Avoid transparent background, perspective renders, hero prop presentation, clutter, or a single centered emblem without side/top/bottom faces.
```

### Pickup B: Ammo Pickup

建議檔名：`pickup_ammo_01.png`

```text
Create a game-ready flat texture sheet for a rectangular ammo pickup box in a first-person shooter.
This is not a single icon. It must be a six-face box texture atlas for a simple cuboid 3D model.
Show all six faces laid out flat in one image: front, back, left, right, top, bottom.
Use a clean box-net or texture-atlas layout with clear panel separation and no perspective.
The design should fit a compact ammunition supply box with practical industrial casing and clear face-to-face continuity.
Generic ammo pickup styling with abstract bullet symbols, muted brass accents, olive or dark tactical casing, and simple crate-like panel details.
Clean stylized-realistic game prop texture.
Orthographic flat texture sheet, square frame, high readability, no environment scene.
Soft neutral lighting style with restrained shading and consistent panel treatment.
Dark olive, muted brass, charcoal gray, and worn steel palette.
Material details: painted metal, reinforced corners, latch plates, subtle stencil-like markings without readable text, light scuffs.
No text, no logos, no watermark, no readable caliber labels, no brand packaging.
Avoid transparent background, perspective renders, clutter, cinematic composition, or a single centered symbol with missing side faces.
```

### Pickup C: Armor / Utility Pickup

建議檔名：`pickup_utility_01.png`

```text
Create a centered game-ready pickup texture for an armor or utility item in a first-person shooter.
Single pickup emblem or decal on a transparent background.
Generic shield utility module symbol with layered plate shapes and subtle cyan accent lights.
Clean stylized-realistic game prop texture.
Centered square icon with crisp silhouette and strong readability.
Soft studio lighting.
Steel gray, muted cyan, and dark charcoal palette.
Material details: composite armor plate, matte metal.
Transparent background.
No text, no logos, no watermark.
Avoid futuristic brand marks, heavy glow, perspective environments, clutter.
```

---

## 6. 如果 web GPT 生出來不夠像「材質」

可以在原 prompt 最後補這些句子：

```text
This must look like a material texture sample, not a prop render.
No perspective, no background scene, no cinematic composition.
Texture only.
```

如果平鋪感不好，再補：

```text
The pattern must be seamless and tileable on all four edges.
No obvious center composition.
No unique large features that break repetition.
```

如果細節太亂，再補：

```text
Use restrained medium detail with clean readable surface information.
Avoid noisy photoreal clutter and oversharpened micro-detail.
```

## 7. 建議你拿圖回來後的命名方式

建議放在之後的材質資料夾，例如：

```text
assets/textures/
  ground_concrete_bluegray_01.png
  ground_rubber_panel_01.png
  ground_tarmac_worn_01.png
  vent_grate_industrial_01.png
  vent_grate_composite_01.png
  vent_grate_concrete_frame_01.png
  wall_concrete_cast_01.png
  wall_cinderblock_painted_01.png
  wall_metal_panel_01.png
  cover_composite_olive_01.png
  cover_steel_crate_01.png
  cover_concrete_barrier_01.png
  cover_rubber_barrier_01.png
  cover_fabric_bastion_01.png
  cover_ceramic_panel_01.png
  cover_corrugated_shield_01.png
  pickup_health_01.png
  pickup_ammo_01.png
  pickup_utility_01.png
```

## 8. 下一步

等你把圖生好放回來後，我可以直接幫你：

- 把材質圖片接進 `index.html`
- 把地面上的中線改成通風格柵跑道，並支援每關隨機生成直線 / 轉角 / 支線
- 做每關隨機地板 / 牆壁 / 障礙物材質切換
- 幫補給道具套上對應圖片或 billboard sprite
