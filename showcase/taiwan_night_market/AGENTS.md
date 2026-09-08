# AGENTS.md

## 專案概要

本專案是以 Three.js、TypeScript 與 Vite 製作的台灣夜市第一人稱網頁漫遊體驗。

執行時的主要資料流如下：

```text
index.html
  -> src/main.ts
      -> public/models/
      -> public/data/
      -> public/audio/
  -> Vite build
      -> dist/
```

`assets/` 是 Blender 與資產製作區，`public/` 是瀏覽器實際載入的執行資產。不要把兩者混用。

## 開發指令

需要 Node.js 20.19+ 或 22.12+。

```bash
npm ci
npm run dev       # 啟動 Vite 開發伺服器
npm test          # 執行 Node 測試
npm run build     # TypeScript 檢查並建立 dist/
npm run preview   # 預覽 dist/
```

`npm run build` 會先執行 `tsc --noEmit`，再執行 Vite build。修改完成後至少執行相關測試與 `npm run build`。

## 目錄與責任邊界

### `src/`

- `main.ts`：應用程式入口、Three.js 場景、GLB/JSON 載入、玩家輸入、相機、HUD、小地圖與主迴圈。
- `characters.ts`：載入路人／工作人員模型、動畫與陰影。
- `npc-behavior.mjs`：NPC 尋路、攤位拜訪、工作人員行為、人群避讓與人物碰撞。
- `collision.mjs`：以碰撞框與空間索引處理玩家及 NPC 的平面碰撞。
- `static-lighting.ts`：將固定燈光預先計算為頂點光照與道路光照貼圖。
- `audio.ts`：環境音載入、循環、淡入淡出、區域混音、音量與暫停。
- `i18n.ts`：繁體中文／英文文案、網址語系與本機語系設定。
- `night-sky.ts`：夜空背景。
- `style.css`：桌面、手機、搖桿、HUD 與設定介面。

### `assets/`

放置 Blender 原始場景、人物原始檔、貼圖、渲染圖、manifest 與驗證結果，例如：

- `assets/night-market/`
- `assets/night-market-district/`
- `assets/night-market-expanded/`
- `assets/night-market-hotspot/`
- `assets/night-market-unique/`
- `assets/characters-v1/`
- `assets/characters-v2/`

這些檔案是可編輯來源，不是網頁直接載入的執行檔。

### `scripts/`

放置 Blender/MCP 建模、場景整理、貼圖製作、渲染、驗證與網頁資產匯出腳本。重要腳本包括：

- `build_*.py`、`finalize_*.py`：建立與整理 Blender 場景。
- `build_crowd.py`：建立人物與人群資產。
- `export_web_colliders.py`：從場景匯出網頁碰撞資料。
- `place_crowd_workers.mjs`：依目前場景重新計算工作人員位置。
- `validate_*_export.py`：驗證 Blender/GLB 匯出結果。

### `public/`

瀏覽器執行時的靜態資產：

- `public/models/night-market.glb`：目前網頁使用的主要夜市場景。
- `public/models/crowd/`：路人與工作人員 GLB。
- `public/data/`：`buildings.json`、`layout.json`、`colliders.json`、人群目錄與工作人員配置。
- `public/audio/`：環境音與 `ATTRIBUTION.md`。

### `tests/` 與 `docs/`

- `tests/`：碰撞、方向、人物與人群行為測試。
- `docs/`：夜市場景版本紀錄、建築目錄、介面設計與瀏覽器 QA 紀錄。

### `dist/`

Vite 產生的部署輸出。除非任務明確要求，請不要手動修改；應透過 `npm run build` 重新產生。

## Blender 與網頁資產流程

若修改 Blender 場景或人物資產，必須同步確認：

1. 重新匯出對應 GLB。
2. 更新 `public/models/` 中的執行資產。
3. 若建築、攤位或道路位置改變，同步更新 `public/data/buildings.json`、`layout.json` 與 `colliders.json`。
4. 若人物位置或店家配置改變，重新產生 `staff-placements.json`，並檢查 `crowd-catalog.json`。
5. 執行 `npm test` 與 `npm run build`。
6. 用瀏覽器實際檢查載入、移動、碰撞、視角、手機控制、音效與畫面構圖。

只更新 GLB 而不更新碰撞或配置資料，可能造成畫面與實際可行走區域不一致。

## Runtime 開發規則

- 保持 Vite 的 `base: './'` 設定，因為 `dist/` 需要支援靜態主機與相對路徑部署。
- 場景碰撞是以平面碰撞框處理，不是完整三角網格物理；不要在沒有產品需求與完整設計前加入跳躍、樓梯或交易系統。
- 玩家碰撞半徑約為 `0.24m`，NPC 碰撞半徑約為 `0.42m`。調整其中一方時，必須重跑碰撞與人群測試。
- 固定場景燈光由 `static-lighting.ts` 預先計算；不要在每一幀重新啟用大量點光源。
- 修改 `i18n.ts` 或 UI 文案時，同時檢查 `zh-Hant` 與 `en`，並確認 `?lang=zh`、`?lang=en`。
- 修改音效時保留 `public/audio/ATTRIBUTION.md` 的授權與來源資訊。
- 不要直接修改 `node_modules/` 或由 build 產生的檔案。
- 不要把大型 Blender 原始檔或渲染中間檔搬到 `public/`；只有瀏覽器需要的執行資產才放入 `public/`。

## 測試與驗證

測試通過只代表程式與資料符合自動化檢查，不代表視覺或實際遊玩流程已完成。涉及場景、碰撞、人物或 UI 的修改，應分別驗證：

- 靜態檢查：`npm test`、`npm run build`。
- 桌面流程：開始遊戲、WASD/方向鍵、滑鼠環顧、快走、暫停、重置、音效與語系切換。
- 行動流程：虛擬搖桿、拖曳環顧、暫停、直向與橫向版面。
- 場景流程：入口、主要街道、攤位周邊、建築邊界與碰撞滑行。
- 資產流程：GLB 可載入、JSON 路徑正確、人物與工作人員沒有錯誤生成位置。

如果只能完成部分驗證，回報時要明確區分「自動化測試通過」、「瀏覽器流程通過」與「尚未驗證的實體裝置／完整視覺 QA」。

## 修改原則

- 先追蹤目前的載入路徑與資料來源，再修改檔案。
- 優先做最小範圍修改，不要順手改動無關的場景版本、文案或資產。
- 保留既有 Blender 原始檔與版本目錄；新版本應放在對應的資產資料夾並留下 manifest 或文件紀錄。
- 遇到場景問題時，同時檢查 Blender 原始場景、GLB、JSON 配置與瀏覽器實際結果，不要只依單一檔案判斷。
