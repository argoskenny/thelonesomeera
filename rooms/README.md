# Three.js 書房場景

依照 `ref.png` 與 `docs/SCENE_ANALYSIS.md` 重建的可操作 3D 書房。專案使用 Vite、TypeScript 與 Three.js，場景單位統一為公尺，並以模組化場景建構器、簡化碰撞代理和程序化替代資產作為後續遊戲開發基礎。

## 快速開始

需求：Node.js `^20.19.0` 或 `>=22.12.0`。

```bash
npm install
npm run dev
```

預設網址為 `http://127.0.0.1:5173/`。若該埠已被其他專案占用，可使用：

```bash
npm run dev -- --port 5174
```

正式檢查：

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## 操作方式

| 操作 | 功能 |
| --- | --- |
| `1` | 設計圖參考視角 |
| `2` | 第一人稱玩家視角 |
| `3` | 自由 Orbit 視角 |
| `C` | 循環切換視角 |
| `W A S D` | 玩家移動 |
| `Shift` | 加速移動 |
| `Space` | 跳躍；重力會將玩家帶回可行走地面 |
| 滑鼠點擊 | 玩家模式下嘗試 Pointer Lock |
| 滑鼠按住拖曳 | 玩家模式的視角控制後備方案；自由模式則旋轉 Orbit 相機 |
| 滾輪／拖曳 | 自由模式縮放／旋轉 |
| `R` | 玩家或目前相機回到起始位置 |
| `H` / `F3` | 顯示或隱藏 HUD |
| `G` / `F4` | 顯示碰撞代理、地面格線與 1.8 m 尺標 |
| `Esc` | 解除 Pointer Lock |

## 場景尺度與配置

- `1 Three.js unit = 1 meter`
- 房間淨尺寸：`3.6 × 3.0 × 2.7 m`
- 玩家高度：`1.8 m`；眼高 `1.65 m`；碰撞半徑 `0.22 m`
- X 軸：房間左至右；Y 軸：向上；Z 軸：窗戶為負、入口為正
- 窗戶置於後牆中央；門位於入口牆偏左並固定開啟
- 書桌置中略靠窗；椅子採主透視圖配置，位於書桌入口側
- `0.8 × 0.3 × 2.0 m` 書櫃靠左後；`1.2 × 0.4 × 0.75 m` 收納櫃靠右中

所有大型物件、相機、玩家和可替換資產的尺寸／位置集中在 `src/config/sceneConfig.ts`，不要把新的場景座標散落在動畫迴圈中。

## 專案結構

```text
src/
├── app/RoomApp.ts                 # 組裝系統、固定更新與渲染迴圈
├── config/
│   ├── sceneConfig.ts             # 公尺制尺寸、位置、相機與資產 manifest
│   └── sceneTypes.ts
├── core/
│   ├── AssetManager.ts            # GLB 快取、clone、失敗 fallback
│   ├── CameraSystem.ts             # 參考／玩家／自由三相機
│   ├── ControlsSystem.ts           # 輸入、移動、重力與 reset
│   └── RendererSystem.ts
├── physics/CollisionSystem.ts      # 圓形 footprint 對靜態 AABB
├── scene/
│   ├── SceneSystem.ts
│   ├── builders/
│   │   ├── Terrain.ts             # 程序化地板與可行走區
│   │   ├── Buildings.ts           # 房殼、門窗、捲簾、收邊
│   │   ├── Furniture.ts           # 書桌、椅子與兩座櫃體
│   │   ├── Props.ts               # 書籍、筆電、燈、相框與小物
│   │   ├── Vegetation.ts          # 室內植栽與窗外綠景
│   │   └── Lighting.ts
│   └── shared/                    # 共用材質、幾何、批次合併工具
├── debug/DebugSystem.ts            # FPS、renderer.info、碰撞顯示
├── ui/Hud.ts
└── styles.css
```

`RoomApp` 只負責生命週期與系統協調；一次性場景內容由 builders 建立。視覺模型和碰撞代理完全分離，替換 GLB 不會改變玩家通行性。

## 修改場景設定

`src/config/sceneConfig.ts` 內可直接調整：

- 房間、牆厚、門窗尺寸
- 書桌、椅子、書櫃與收納櫃位置
- 玩家高度、速度、半徑與出生點
- 三種相機的 FOV、position 與 target
- 可選 GLB 的 URL、scale 與 offset

家具尺寸以圖上明示數值為優先。參考圖的俯視圖和主透視圖並非完全一致，因此只應微調未標註的前後位置，不應為了像素重合而改壞已明示的尺寸。

## 資產放置與替換

目前所有內容都有可直接執行的程序化版本，專案不依賴外部模型即可啟動。要替換英雄資產：

1. 將 `.glb` 放入 `public/assets/models/`。
2. 在 `src/config/sceneConfig.ts` 的 `assets` 填入 URL，例如 `/assets/models/chair.glb`。
3. 模型契約：公尺制、Y-up、pivot 位於物件底部中心，面向專案設定的局部正面。
4. 如來源模型比例或原點不同，使用 manifest 的 `scale` 與 `offset` 修正。

manifest 的 `scale`／`offset` 只修正模型自己的局部座標；資產外層 wrapper 仍會依 `sceneConfig` 的世界座標放置。這能避免替換 GLB 後，模型原點修正意外覆蓋筆電、工作燈、椅子或垂吊植物在房間中的正確位置。

`AssetManager` 會快取同一 URL 的載入 Promise，以 `SkeletonUtils.clone` 建立實例；單一資產載入失敗時會保留程序化替代物，不會中止整個場景。最適合替換為 GLB 的物件是辦公椅、工作燈、筆電與書櫃頂垂吊植物。房殼、桌櫃、書籍、地板與窗簾仍適合基本幾何或程序化產生。

## 碰撞與玩家活動範圍

- 固定 `60 Hz` 物理更新，frame delta 上限 `0.05 s`
- 玩家使用直立圓柱／capsule 的水平圓形 footprint
- 牆、門、玻璃、書桌、椅子、書櫃與收納櫃使用獨立 AABB 代理
- 水平移動依 X、Z 分軸解析，可沿障礙物滑動；長位移會切為不超過 `0.08 m` 的小步進
- 地板與入口小平台是 walkable proxy；離開可行走區跌落時自動 reset
- 書本、盆栽、相框等小物不參與碰撞

## 效能策略

- 木地板、書本、盆器、葉簇及窗外樹木使用 `InstancedMesh`
- Box geometry、材質與主要 primitive 皆共用
- 靜態非透明 Mesh 依材質、陰影與 cutaway 狀態批次合併
- GLTFLoader 和 SkeletonUtils 只在設定了 GLB URL 時動態載入
- 只有一個 DirectionalLight 產生即時陰影；小物不投影
- renderer pixel ratio 上限為 `1.75`
- 動畫迴圈重用向量，HUD 每 250 ms 才更新 DOM

目前參考環境的乾淨啟動量測為 `111 draw calls`、`22,216 triangles`、`45 geometries`、`6 textures`；只保留一個 production 分頁時觀察到約 `68–100 FPS`。量測來自 1280 × 720 的桌面內嵌 Chromium；實際數據會依 GPU、視窗、背景分頁與 device pixel ratio 改變。

## 已知限制

- 原始圖是設計示意，不是完全一致的施工圖；門窗尺寸與家具精確前後距離是合理補完。
- 辦公椅、植物和窗外樹景目前是低面數程序化資產，適合作為遊戲基礎與 GLB fallback，不是最終高寫實模型。
- 門維持完全開啟，尚未加入門扇動畫與 OBB 動態碰撞。
- 小型室內場景總三角形很低，因此未增加不必要的室內 LOD；窗外內容已使用低面數實例並由視錐剔除。
- 目標平台是桌面瀏覽器；窄螢幕 HUD 會收合，但目前沒有觸控虛擬搖桿。
- 某些 WebView 不允許 Pointer Lock；拒絕結果會被安全處理並顯示提示，不會留下未處理的 Promise error，玩家視角仍可用按住拖曳控制方向。

詳細實作假設、原始圖對照與驗證紀錄見：

- `docs/SCENE_IMPLEMENTATION.md`
- `docs/VERIFICATION.md`
