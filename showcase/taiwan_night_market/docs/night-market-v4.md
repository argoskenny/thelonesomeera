# 榕安夜市 — 58 棟獨立建築版

最新版本將六街區及四周全部 **58 棟建築逐棟重新設計**，每棟建築設計只配置一次，搭配 58 個不同建築／店家名稱。原先重複的「榕安大旅社」只保留在 `U14 / B3_SHOP_2` 七層旅社上；原模板強制套用旅社招牌的做法已移除。

維持約 1999–2003 年遊戲的分面造型、低解析度貼圖與繁體中文招牌，保留六街區、58 座攤位、36 種攤販、20 台販賣機與 140 × 126 公尺場地。

![新版街景](../assets/night-market-unique/renders/03_central_street.png)

## 最新檔案

- [Blender 可編輯原檔](../assets/night-market-unique/taiwan_night_market_unique.blend) — 開啟場景 `TW_NightMarket_Unique`，新版相機以 `UNI_` 開頭。
- [GLB 模型](../assets/night-market-unique/taiwan_night_market_unique.glb)
- [58 棟設計對照表](unique-building-catalog.md)
- [完整建築規格與座標](../assets/night-market-unique/building_designs.json)

| 完成預覽 | 內容 |
| --- | --- |
| [全景](../assets/night-market-unique/renders/01_overview.png) | 全區高低層次與屋頂輪廓 |
| [南側店街](../assets/night-market-unique/renders/02_south_shops.png) | 便利商店、拱窗麵包店與高層藥局 |
| [中央街道](../assets/night-market-unique/renders/03_central_street.png) | 電器、美容、修改衣服等店家 |
| [唯一的榕安大旅社](../assets/night-market-unique/renders/04_single_hotel.png) | 七層直立格柵旅社，鄰接水族館 |
| [北側店街](../assets/night-market-unique/renders/05_north_shops.png) | 自行車行、茶莊、鎖匙刻印 |
| [外圍住宅](../assets/night-market-unique/renders/06_outer_housing.png) | 凸窗華廈、交錯陽台住宅與公共建築 |
| [市公所](../assets/night-market-unique/renders/07_civic.png) | 帶狀窗、入口柱廊及階梯山牆 |
| [老街洋樓](../assets/night-market-unique/renders/08_old_street.png) | 德記洋樓拱窗與小吃攤 |

## 本次改造

58 個獨立組合採用 2–9 層量體、九種立面構成、七種窗型、八種屋頂處理、26 種色系／牆面材質組合，以及橫式燈箱、直式招牌、木匾、圓招、雨棚招牌、跑馬燈式雨遮與屋頂看板等不同招牌形式。共用窗框、冷氣與欄杆等小零件，但整棟建築的幾何設計沒有重複配置。

36 間核心店家各有不同名稱，第二批店面改為照相館、鐘錶眼鏡、音響、玩具、文具、花坊、電器、美容、修改衣服、自行車、茶莊、鎖匙刻印、寵物用品、文印、漫畫出租、皮件、寢具及咖啡室。部分店家加入相機、時鐘、音箱、洗衣機、花桶、自行車、茶罐、影印機及縫紉機等陳設。

新增檔案另存於 `assets/night-market-unique/`。上版場景、攤位與外圍住宅擴充記錄見 [v3 記錄](night-market-v3.md)，舊版本檔案仍保留。

## 驗證

- [幾何與配置檢查](../assets/night-market-unique/validation.json)：58 棟名稱皆不同，每棟有自己的招牌；比較移除世界位置、材質、招牌及室內陳設因素後的建築幾何，58 份幾何指紋皆不同。幾何差異檢查不等同主觀視覺差異評分，另以街景渲染檢查造型。
- 原有七條中央道路通道、20 處無攤販店面接近空間、兩處戰鬥預留空地、西側入口及兩處公共建築前庭通過 mesh 世界 AABB 空間檢查。
- [模型統計](../assets/night-market-unique/scene_manifest.json)：341,558 三角面，GLB 為 94 個空間區塊。原檔保留可分別編輯的物件。
- [GLB 結構檢查](../assets/night-market-unique/glb_validation.json)、[重新匯入比對](../assets/night-market-unique/glb_roundtrip.json)、[檔案雜湊](../assets/night-market-unique/checksums.json)。

目前交付靜態環境模型。尚未完成遊戲引擎碰撞、NavMesh、LOD、效能與攤位互動驗證。GLB 將 Area Light 近似為點光源，世界背景需於引擎重建；完成預覽的照明以 Blender 原檔為準。

## 重建

1. 使用含 Pillow 的 Python 執行 `scripts/make_unique_buildings.py`，建立建築規格及原創貼圖。
2. 在 Blender 開啟含 `TW_NightMarket_Expanded` 的上版原檔。
3. 透過 Blender MCP 執行 `scripts/build_unique_district.py`、`scripts/finalize_unique_district.py`、`scripts/render_unique_district.py`、`scripts/validate_unique_export.py`。

重建會替換 `TW_NightMarket_Unique`；若有手動修改請先另存副本。腳本使用本專案絕對路徑。幾何與點陣貼圖為本專案程序化原創，未使用第三方模型或照片貼圖；系統字型只用於招牌點陣化，未散布字型檔。
