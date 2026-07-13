# Sky Texture Prompts

目前專案的天空策略已改成：

- `SkyGradientDome` 當天空底色
- `晴天白天` 之後再疊加獨立雲朵 sprite
- `晴天夜晚` 直接用程式生成星點
- `陰天` 先不做

所以這份文件現在不再是「整張天空貼圖」提示詞，而是：

- `晴天白天雲朵素材` 提示詞

## 素材用途

這些圖不是整片天空背景，也不是 tile。

用途是：

- 做成幾張 `cloud sprite` / `billboard`
- 分散放在 `SkyGradientDome` 裡的上半部
- 每局隨機擺放
- 雲朵本身不動或只做很輕微漂移

## 建議生成規格

- 比例：`1:1`
- 尺寸：`1024x1024` 或 `1536x1536`
- 背景：`transparent background` 優先
- 如果工具不支援透明背景：
  - 改用純黑背景
  - 雲本體保持白色到淡灰白
  - 之後在程式或素材處理時去背

## 核心要求

每張圖都應該是：

- 單一或單團雲層
- 邊緣柔和
- 不要帶整片藍天背景
- 不要有地平線
- 不要有太陽
- 不要有戲劇化夕陽染色
- 不要有太厚重的暴風雲

目標是「可疊在漸層天空上的白天雲朵素材」，不是風景照。

## 通用提示詞

每次生成前，建議附上這段：

```text
Create a game-ready isolated cloud sprite for a first-person shooter training arena.
This asset will be placed inside a three.js sky gradient dome as a billboard cloud layer.
Single cloud cluster only, centered composition, soft feathered edges, natural daytime cloud shape.
Bright white to light gray cloud tones, realistic but simplified, readable silhouette.
No sky background, no horizon, no ground, no mountains, no buildings, no sun.
No dramatic sunset colors, no storm cloud, no lightning, no rain.
Transparent background.
Original and generic, suitable for a stylized-realistic indie game.
Square image.
```

## 通用負面提示詞

```text
blue sky background, horizon, landscape, ground, mountains, buildings, city, ocean, trees, sun, sunlight rays, god rays, dramatic storm, lightning, rain, dark thundercloud, sunset orange, pink sunset, text, logo, watermark, multiple unrelated cloud groups, cluttered composition, hard cutout edge
```

## 雲朵變體建議

建議先生成 4 張：

- `cloud_sunny_day_01.png`
- `cloud_sunny_day_02.png`
- `cloud_sunny_day_03.png`
- `cloud_sunny_day_04.png`

差異重點：

- 外形不同
- 雲量不同
- 但都維持同樣的材質感與亮度

---

## 1. Thin Wispy Cloud

建議檔名：`cloud_sunny_day_01.png`

```text
Create a game-ready isolated cloud sprite for a first-person shooter training arena.
Single wispy daytime cloud cluster, centered, soft feathered edges, light and airy shape.
Bright white with subtle pale gray variation, natural calm weather cloud.
Readable silhouette, not too dense, not too dramatic.
No sky background, no horizon, no sun, no landscape.
Transparent background.
Square image.
```

## 2. Broad Soft Cloud

建議檔名：`cloud_sunny_day_02.png`

```text
Create a game-ready isolated cloud sprite for a first-person shooter training arena.
Single broad soft daytime cloud cluster, centered, gentle rounded form, soft edges.
Bright white to light gray tone, realistic but clean and simplified.
Moderate volume, calm clear-weather look, suitable for layering in a sky dome.
No sky background, no horizon, no sun, no landscape.
Transparent background.
Square image.
```

## 3. Broken Cloud Patch

建議檔名：`cloud_sunny_day_03.png`

```text
Create a game-ready isolated cloud sprite for a first-person shooter training arena.
Single broken daytime cloud patch with a few connected soft cloud masses, centered composition.
Natural white cloud texture, soft feathered edges, light density, calm weather.
Readable silhouette with slight irregularity, suitable as a modular billboard cloud sprite.
No sky background, no horizon, no sun, no landscape.
Transparent background.
Square image.
```

## 4. Puffy Medium Cloud

建議檔名：`cloud_sunny_day_04.png`

```text
Create a game-ready isolated cloud sprite for a first-person shooter training arena.
Single medium-sized puffy daytime cloud cluster, centered, soft billowy volume, gentle edge fade.
Bright white and light gray tones, calm ordinary sunny weather, not stormy.
Readable shape for use as a cloud billboard inside a sky gradient dome.
No sky background, no horizon, no sun, no landscape.
Transparent background.
Square image.
```

## 如果生圖工具不支援透明背景

把每個 prompt 補成：

```text
Pure black background, isolated cloud only, no background detail.
```

之後再把黑底去掉。

## 選圖原則

優先挑：

1. 邊緣最柔和的
2. 沒有殘留天空背景的
3. 雲朵主體清楚但不過度厚重的
4. 四張風格一致但輪廓不同的

## 後續放置建議

生成完成後，建議放到：

- `public/textures/sky/clouds/`

例如：

- `public/textures/sky/clouds/cloud_sunny_day_01.png`
- `public/textures/sky/clouds/cloud_sunny_day_02.png`
- `public/textures/sky/clouds/cloud_sunny_day_03.png`
- `public/textures/sky/clouds/cloud_sunny_day_04.png`

等這批圖放進專案後，下一步再接：

- 白天雲朵 sprite layer
- 每局固定的隨機分布
- 雲朵大小、透明度、位置變化
