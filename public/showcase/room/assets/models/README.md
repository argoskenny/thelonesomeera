# Optional GLB assets

將可選英雄模型放在此目錄，再於 `src/config/sceneConfig.ts` 的 `assets` manifest 指定 URL。

範例：

```ts
assets: {
  chair: { url: "/assets/models/chair.glb" },
  deskLamp: { url: "/assets/models/desk-lamp.glb" },
  laptop: { url: "/assets/models/laptop.glb" },
  heroPlant: { url: "/assets/models/trailing-plant.glb" },
}
```

資產契約：

- 公尺制
- Y-up
- pivot 在底部中心
- `sceneConfig` 與外層 wrapper 負責最終世界 position／rotation
- manifest 的 `scale`／`offset` 只修正模型自己的局部比例與原點
- 載入失敗時保留程序化 fallback
