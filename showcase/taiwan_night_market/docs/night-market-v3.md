# 榕安夜市 — 遊戲攤與外圍住宅擴充版

保留既有六街區、36 棟店屋及 24 座攤位，新增 **34 座攤位、22 棟外圍建築**。目前共有 **58 座攤位、36 種攤販、58 棟建築**，地面範圍擴充為 **140 × 126 公尺**。延續約 1999–2003 年遊戲的分面輪廓、低解析度貼圖、繁體中文招牌和夜間局部照明。

![擴充版全景](../assets/night-market-expanded/renders/01_overview.png)

## 開啟最新版本

- [Blender 可編輯原檔](../assets/night-market-expanded/taiwan_night_market_expanded.blend)
- [GLB 模型](../assets/night-market-expanded/taiwan_night_market_expanded.glb)
- [套圈圈與彈珠台](../assets/night-market-expanded/renders/02_rings_pinball.png)
- [棉花糖與射氣球](../assets/night-market-expanded/renders/03_cotton_balloon.png)
- [市公所](../assets/night-market-expanded/renders/04_cityhall.png)
- [外圍住宅](../assets/night-market-expanded/renders/05_residential.png)
- [手機配件與服飾](../assets/night-market-expanded/renders/06_phone_fashion.png)
- [四周配置俯視](../assets/night-market-expanded/renders/07_perimeter_map.png)
- [活動中心](../assets/night-market-expanded/renders/08_community.png)

Blender 開啟後選擇 `TW_NightMarket_Expanded` 場景；相機以 `EXP_` 開頭。初版及六街區版的原始檔案仍分別保留於 `assets/night-market/` 和 `assets/night-market-district/`。

## 新攤販

新增 12 種攤位設計：棉花糖、射氣球、套圈圈、專用彈珠台、手機配件、服飾、撈魚、飛鏢、飾品、包包、雞蛋糕、爆米花。原有彈珠攤保留，此次另做具有完整傾斜機台、釘柱、彈珠及推桿的新版本。

- 六街區內新增 12 座，配置在側街，保留前版無攤販店家的入口。
- 外圍新增 22 座：北側 7、南側 7、東側 4、西側 4，混合新攤型與原有小吃攤。
- 棉花糖攤包含鋼盆、旋轉頭和陳列棉花糖；射氣球攤包含彩色氣球牆、獎品及靜態夜市玩具槍道具。
- 套圈圈使用有中空孔洞的圈環、瓶罐及獎品；彈珠攤有三台斜面機台。
- 手機配件有背卡包裝、手機殼和線材；服飾有衣架、上衣及吊衣桿。
- 原有 20 台販賣機及店面陳設保留。

## 外圍建築

新增九種建築設計，共 22 棟，沿四面道路圍繞核心六街區，西側保留主要入口。

| 新設計 | 建模差異 |
| --- | --- |
| 磁磚公寓 | 5 層、磁磚立面、鐵窗、外掛冷氣 |
| 凸窗華廈 | 8 層、突出窗間量體、狹長立面 |
| 陽台住宅大樓 | 6 層、連續陽台、金屬欄杆 |
| 退縮住宅大樓 | 7 層、上層退縮、露台花槽 |
| 紅磚公寓 | 5 層、磚牆、窗籠與住宅入口 |
| 四層透天厝 | 明確四層、陽台、車庫捲門、屋頂梯間 |
| 榕安市公所 | 3 層、柱廊、寬雨遮、前庭、公告欄 |
| 榕安里活動中心 | 2 層、公共入口、柱廊及前庭 |
| 老街老宅 | 2 層、磚牆、拱廊、木門窗與瓦屋頂 |

建築名稱皆為原創虛構設定，並非特定市公所或真實住宅的測繪重建。

## 檢查與交付界線

[模型統計](../assets/night-market-expanded/scene_manifest.json)、[完整配置](../assets/night-market-expanded/expanded_layout.json)、[幾何檢查](../assets/night-market-expanded/validation.json)、[GLB 位元組檢查](../assets/night-market-expanded/glb_validation.json)、[重新匯入檢查](../assets/night-market-expanded/glb_roundtrip.json)。

幾何檢查保留原有七條 3m 中央道路通道、20 處無攤販店面入口接近空間及兩處路口戰鬥空地，另檢查西側延伸入口、市公所及活動中心的前庭接近空間。使用 mesh 世界 AABB 及 Z=0.16–2.05m 空間比對；不是遊戲引擎碰撞或 NavMesh 測試。新增公寓類型與透天層數亦記錄在配置中。

GLB 依街區、外圍建築組及物件類別分割為 94 個空間模型區塊，保留 UV、材質及平面分面。貼圖打包於 Blender 原檔並嵌入 GLB。glTF 不支援的 Area Light 以點光源近似，世界背景需於引擎重建，最終打光以 Blender 原檔與完成圖為準。

本次完成環境及靜態設備模型，尚未加入玩家、NPC、攤販互動、射擊、套圈、彈珠物理、戰鬥、碰撞、LOD、烘焙光照或引擎效能驗證。俯視配置圖使用 Workbench，其餘完成圖為夜間場景渲染。

## 重建流程

1. 使用含 Pillow 的 Python 執行 `scripts/make_expanded_textures.py`。
2. 在 Blender 開啟前版 `taiwan_night_market_district.blend`，確認存在 `TW_NightMarket_District` 場景。
3. 透過 Blender MCP 執行 `scripts/build_expanded.py` → `scripts/finalize_expanded.py` → `scripts/render_expanded.py`。
4. 執行 `scripts/validate_expanded_export.py`，檢查 GLB 嵌入資源並重新匯入比對幾何數量。

擴充版複製既有物件，沿用其不可變幾何及材質；只對新增 mesh 執行清理。重建會替換 `TW_NightMarket_Expanded`，手動編修版本請先另存副本。腳本目前使用本專案絕對路徑。

幾何、招牌及新道具均為本專案程序化原創製作，未加入第三方模型或照片貼圖。繁體字以系統字型點陣化，字型檔未隨專案散布。原有實景參考與初版製作方式見 [初版紀錄](night-market-v1.md)，六街區擴充見 [前版紀錄](night-market-v2.md)。
