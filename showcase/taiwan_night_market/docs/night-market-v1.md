# 榕安夜市 — Taiwan Night Market / 2000

透過 Blender MCP 建立的原創台灣夜市場景，作為第三人稱冒險動作遊戲的第一階段環境資產。視覺方向為約 1999–2003 年家用主機遊戲：低面數輪廓、平面分面、低解析度材質與夜間局部光源。

![夜市入口](../assets/night-market/renders/01_entrance.png)

## 開啟與交付

- `assets/night-market/taiwan_night_market.blend`：完整可編輯模型、打光與四台相機。以 Blender 5.0.1 製作，貼圖已打包進檔案。
- `assets/night-market/taiwan_night_market.glb`：自含貼圖的靜態場景；按街道、街屋、攤位、道具、牌樓小廟合併成 5 個 mesh 節點、81 個材質 primitive。原始 `.blend` 保留個別零件。
- `assets/night-market/renders/`：入口、街內、攤位近景、配置俯視圖。
- `assets/night-market/textures/`：128 × 128 表面貼圖、512 × 128 橫招牌、128 × 512 直招牌，採 nearest filtering。
- `assets/night-market/scene_manifest.json`：模型統計與尺寸規格。
- `assets/night-market/validation.json`：Blender 幾何與通道檢查。
- `assets/night-market/glb_validation.json`：實際 GLB 位元組檢查；不代表引擎效能驗證。

Blender 開啟後選擇 `TW_NightMarket_2000` 場景。相機依序為 `CAM_01_Entrance`、`CAM_02_Street`、`CAM_03_FoodStalls`、`CAM_04_Layout`。數字鍵盤 0 進入相機視角；Shift + ` 可使用 Blender Walk Navigation（這是編輯器檢視，並非遊戲角色控制器）。

## 場景內容

- 約 40 公尺的原創夜市主街，兩側街屋與騎樓、側巷和遠景建築。
- 12 座攤位：臭豆腐、蚵仔煎、鹽酥雞、冬瓜茶、胡椒餅、炭烤香腸、牛肉麵、豆花剉冰、烤魷魚、果汁、水餃與彈珠台攤位的外觀配置。
- 不鏽鋼攤車、車輪、鍋具、展示架、飲料桶、杯子、瓦斯桶、排煙設備。
- 鐵窗、外掛冷氣、排水管、鐵捲門、屋頂水塔、電線、電表、燈籠與繁體中文招牌。
- 5 台機車、塑膠凳、摺疊桌、貨箱、保麗龍箱、垃圾桶、盆栽、遮陽傘。
- 原創入口牌樓及街尾福德祠。

## 空間與遊戲銜接

Blender 單位為公尺、Z 軸朝上，主街沿 +Y。GLB 採 glTF 標準 Y-up。

- 建議出生點：`(0, -12, 0)`。
- 中央連續通道：X = -1.5 至 1.5，Y = -12 至 23。
- 戰鬥空地：X = -3.3 至 3.3，Y = 6 至 12。
- `08_Gameplay_Guides` 裡有出生點、主街、側巷和戰鬥區的 Empty 標記，預設不渲染。

通道檢查以所有可見 mesh 的世界座標 AABB，與高度 Z = 0.12 至 2.05 公尺的區域比對。這可排除明顯物件侵入，但不等同角色膠囊碰撞、地面可行走性、NavMesh 或實際操作測試。尚未製作角色、NPC、敵人 AI、戰鬥、任務或碰撞體。

GLB 是靜態環境交付，未配置 LOD、烘焙光照與碰撞。glTF 不支援 Blender Area Light，匯出時以點光源近似；Blender 世界背景也需在引擎重建。最終美術打光以 `.blend` 與渲染圖為準。個別可互動道具應從 `.blend` 分別匯出。

## 實景依據與還原範圍

1. [樂頤飯店：寧夏夜市實景照片](https://www.laclehotel.com.tw/spot/ins.php?index_id=188&index_m_id=15)：直接觀看照片，參考白色攤位燈、黃色直立燈箱、不鏽鋼攤車和街屋的層次。
2. [臺北旅遊網：饒河街觀光夜市](https://travel.taipei/zh-tw/attraction/details/1538)：參考街道型夜市的地方背景與入口意象；頁面搜尋摘要可取得，詳細頁本次回傳 403。
3. [交通部觀光署：饒河街觀光夜市](https://www.taiwan.net.tw/m1.aspx?id=r177&sno=0001090)：街道型夜市背景參考。

這是以真實台灣夜市特徵設計的「榕安夜市」，不是饒河街或寧夏夜市的逐棟測繪重建。通道寬度、街尾小廟和牌樓配置是為動作遊戲設計的改編。約 2000 年指的是遊戲美術風格，並非 2000 年城市街景的歷史考據。

參考照片僅用於觀察，沒有下載進專案、投影至模型或作為貼圖。幾何、表面紋理與招牌版面均在本任務原創製作。繁體字使用系統 Arial Unicode 字型點陣化；專案未附帶字型檔。招牌名稱為虛構或一般小吃品名，價格僅為場景裝飾。

## 重建

1. 使用含 Pillow 的 Python 執行 `scripts/make_textures.py`。
2. 在 Blender 建立並選取名為 `TW_NightMarket_2000` 的場景。
3. 在**同一段** Blender Python/MCP 執行環境依序 `exec` 以下檔案：`scripts/build_night_market.py` → `scripts/refine_night_market.py` → `scripts/finalize_night_market.py`。refine 依賴 build 定義的函式。
4. 選擇相機並 Render Image；輸出路徑位於 `assets/night-market/renders/`。

腳本目前使用本專案絕對路徑，移到其他目錄時先調整 `ROOT`。建模固定亂數種子以利重現。重建會替換專用場景中的物件，勿直接在已手動修改過的版本執行，請先另存副本。初始預設 Blender 場景會保留。

本次以已連線的 Blender MCP 完成生成、修整、儲存與匯出；本機未在 PATH 發現 `game-dev` CLI，因此交付為一般資產目錄，未聲稱通過該工具的 canonical package 驗證。
