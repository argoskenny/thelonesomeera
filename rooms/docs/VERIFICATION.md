# 驗證紀錄

驗證日期：2026-07-11（Asia/Taipei）

## 環境

- Node.js `v24.14.0`
- npm `11.11.0`
- Three.js `0.185.1`
- Vite `8.1.4`
- TypeScript `7.0.2`
- production preview：`http://127.0.0.1:4273/`（QA 暫用埠）
- 瀏覽器：Codex in-app Chromium
- 桌面 viewport：1280 × 720
- 窄螢幕 viewport：390 × 844

## 命令驗證

| 命令 | 結果 |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test` | PASS；3 files / 7 tests；包含碰撞、集中設定與外部 GLB placement wrapper 回歸 |
| `npm run build` | PASS |

正式 bundle：

- 主程式：gzip 約 269.6 kB
- GLTFLoader：gzip 約 12.8 kB，只有設定 GLB URL 時才動態載入
- SkeletonUtils：gzip 約 0.3 kB，只有實例化 GLB 時才動態載入

Vite 會提示未壓縮主 chunk 超過預設 500 kB；主因是 Three.js runtime。gzip 後約 269.6 kB，且選用 GLB 載入器已拆成 lazy chunks。這是已知建置警告，不是執行錯誤。

## 瀏覽器基本檢查

| 檢查 | 結果 | 證據 |
| --- | --- | --- |
| Page identity | PASS | title 為「書房 Study Room — Three.js Scene」 |
| 非空白頁 | PASS | Canvas、三個相機按鈕、HUD 與場景皆存在 |
| Framework overlay | PASS | 無 Vite 錯誤覆蓋層 |
| Console | PASS | 全新 production 分頁無 error 或 warn |
| 參考視角 | PASS | 中央窗、桌椅、門、左右櫃與吸頂燈同框 |
| 玩家視角 | PASS | 按鈕可切換且 crosshair／操作提示正確 |
| 自由視角 | PASS | Orbit 拖曳後相機由 `1.25, 2.15, 1.18` 變為 `-0.58, 1.12, 1.86` |
| Reset | PASS | 玩家由移動後位置回到 `0.83, 0.00, 1.05` |

## 玩家、重力與碰撞

- 單次 `W` 輕按：玩家由 `0.83, 0.00, 1.05` 移到 `0.83, 0.00, 1.03`。
- 連續朝書桌／右側通道前進：玩家停在約 `0.83, 0.00, 0.08`，沒有穿過大型代理。
- `R`：回到 `0.83, 0.00, 1.05`。
- 跳躍／重力實測：本輪在 120 ms 取樣時 Y 已到 `0.31`；完整軌跡會繼續上升後回到 `0.00`，grounded 恢復為 `YES`。
- 碰撞 debug：牆、窗、門扇、桌、椅、書櫃、收納櫃、入口平台與邊界皆有獨立代理；1.8 m 尺標可同時顯示。
- Pointer Lock API 已由 Canvas 點擊路徑呼叫。in-app Browser 不授予 Pointer Lock；拒絕 Promise 已被捕捉，HUD 顯示「此瀏覽器未允許滑鼠鎖定，請按住拖曳觀看」，console 仍為零 warning／error。同一玩家視角的按住拖曳後備操作已實測會改變渲染畫面，普通支援 Pointer Lock 的桌面瀏覽器仍會優先鎖定滑鼠。

## 效能量測

Debug 關閉、參考視角、1280 × 720：

| 指標 | 實測 |
| --- | --- |
| FPS | 單一 production 分頁暖機後觀察到約 68–100 |
| Draw Calls | 111 |
| Triangles | 22,216 |
| Geometries | 45 |
| Textures | 6 |
| 程序化 fallback | 4 |

390 × 844 的視錐下為 97 draw calls、21,572 triangles、45 geometries、6 textures，沒有水平或垂直頁面 overflow：`scrollWidth = innerWidth = 390`、`scrollHeight = innerHeight = 844`。

## 參考圖 Fidelity Ledger

| 比對點 | 參考圖 | Production render | 結論 |
| --- | --- | --- | --- |
| 房間比例 | 360 × 300 × 270 cm | 3.6 × 3.0 × 2.7 m | MATCH |
| 中央工作軸 | 窗、桌、椅置中 | 三者保持中央軸 | MATCH |
| 左右量體 | 左高窄書櫃、右低寬櫃 | 尺寸與高低關係一致 | MATCH |
| 椅子方向 | 主透視位於入口側 | 入口側且面向窗 | MATCH |
| 門與前景 | 左側近景開門 | 參考相機保留門葉、門框與把手 | MATCH；寬螢幕構圖優先 |
| 窗與捲簾 | 中央雙扇窗、簾布遮上部 | 中央窗、豎框與 0.52 m 捲簾 | MATCH |
| 色彩 | 暖灰、淺木、霧黑、低彩綠 | 相同色階的 PBR 材質 | MATCH |
| 光線 | 柔和窗光＋吸頂補光 | 單一柔影日光、環境光、吸頂燈 | MATCH |
| 前中後景 | 門／椅、桌、窗／樹景 | 四層完整可辨 | MATCH |
| 英雄資產細節 | 寫實椅子與植栽 | 低面數程序化 fallback | INTENTIONAL DEVIATION；可換 GLB |
| 透視圖精度 | 多視圖本身不完全一致 | 明示尺寸優先，主透視作構圖基準 | INTENTIONAL DEVIATION |

Reference screenshot 與最終 production screenshot 已在同一輪以原始解析度直接檢視。HUD 可用 `H` 完全隱藏，不會污染對照截圖。

## 可見文案與 UI 邊界

原始圖沒有遊戲 HUD。新增的「參考／玩家／自由」、操作提示和效能數字皆來自使用者明確要求的操作與 debug 功能；沒有另加故事、任務、分數、行銷文案或與場景無關的 UI。

## 剩餘風險

- 尚未以實體滑鼠在 Safari／Firefox 驗證 Pointer Lock；拖曳後備路徑已在 Chromium 自動化中通過。
- 手機版只驗證視覺收合，沒有觸控虛擬搖桿，因目標平台為一般桌面瀏覽器。
- GLB 失敗 fallback 邏輯有程式路徑與 manifest 契約，但目前預設 URL 為 `null`，最終 QA 沒有刻意製造 Console warning。
- 原圖不是施工圖，門窗及精確家具離牆距離仍是已記錄的合理假設。
