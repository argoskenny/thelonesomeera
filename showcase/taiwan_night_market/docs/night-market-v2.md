# 榕安夜市商圈 — 六街區擴充版

延續初版約 1999–2003 年家用主機遊戲風格，將街道擴充為 **3 × 2、共六個可繞行街區**。場景地面範圍約 **104 × 88 公尺**，以三條橫街和四條縱街串聯。

![六街區俯視](../assets/night-market-district/renders/05_overview.png)

## 最新交付

- [Blender 可編輯原檔](../assets/night-market-district/taiwan_night_market_district.blend)
- [自含貼圖的 GLB](../assets/night-market-district/taiwan_night_market_district.glb)
- [夜市主街](../assets/night-market-district/renders/02_main_street.png)
- [便利商店與麵包店](../assets/night-market-district/renders/03_convenience.png)
- [販賣機街角](../assets/night-market-district/renders/07_vending_corner.png)
- [六街區配置俯視](../assets/night-market-district/renders/06_block_map.png)
- [場景統計](../assets/night-market-district/scene_manifest.json)、[完整店家配置](../assets/night-market-district/district_layout.json)、[幾何檢查](../assets/night-market-district/validation.json)

原始單街版本保留在 `assets/night-market/`，說明見 [初版製作紀錄](night-market-v1.md)。最新 `.blend` 開啟後選擇 `TW_NightMarket_District` 場景，預設為主街相機；檔案亦保留初版場景。

## 增加的內容

| 項目 | 六街區版本 |
| --- | --- |
| 建築 | 36 棟、6 種結構：磁磚公寓、紅磚街屋、混凝土公寓、裝飾藝術街角店屋、鐵皮店屋、狹面旅社 |
| 店家 | 18 種：便利商店、麵包店、藥局、五金行、服飾店、遊樂場、書局、理髮廳、水果行、洗衣店、蔘藥行、唱片行、海產店、旅社、鞋行、雜貨店、機車行、麵店 |
| 攤位 | 24 座、24 種：臭豆腐、章魚燒、玉米、串燒、湯包、糖葫蘆、滷肉飯、地瓜球、魚丸、魷魚、玩具、襪子、花卉、果汁、香腸、潤餅、蚵仔煎、鹽酥雞、胡椒餅、剉冰、牛肉麵、水餃、冬瓜茶、彈珠台 |
| 無攤販店面 | 20 個店面前方不設攤販，保留店面陳列及入口接近空間 |
| 自動販賣機 | 20 台、5 種：罐裝飲料、零食、熱咖啡、冰品、扭蛋；其中五台集中為街角販賣區 |
| 招牌 | 橫燈箱、直立燈箱、圓形突出招牌、雙面招牌、棚布招牌、A 字立牌、櫥窗海報、屋頂大招牌 |

店家和攤位包含不同的幾何陳設：便利商店貨架／冷藏櫃、麵包陳列、衣架、理髮椅、滾筒洗衣機、工具牆、大型電玩、烤網、蒸籠、章魚燒盤、刨冰機、陶爐及彈珠板。沿用低面數輪廓、128px 表面貼圖、最大 512px 招牌與 nearest filtering。所有商號和標誌皆為虛構名稱或通用文字。

## 模型與驗證範圍

Blender 使用公尺、Z-up；GLB 使用 glTF Y-up。GLB 按街區和物件類別分割，方便後續引擎做空間剔除；原始 `.blend` 保留個別道具及 `block_id`、`asset_type` 等自訂屬性。

已檢查六個獨立街廓、模型座標有效性、退化面、貼圖內嵌、七條街道中央 3m 通道、兩處 5 × 5m 路口空地和 20 個無攤販店面入口前方。幾何檢查使用 mesh 世界 AABB 與 Z=0.16–2.05m 的空間比對，**不等於引擎碰撞、NavMesh 或角色實際操作測試**。便利商店等內部陳設是視覺模型，尚未設定可互動購物、門扇開關、販賣、NPC 或戰鬥。

GLB 的 Area Light 以點光源近似，世界背景需在引擎重建，最終打光以 `.blend` 及渲染圖為準。`06_block_map.png` 採 Workbench 俯視，僅用於辨認路網；其餘預覽使用場景夜間光源。尚未進行效能測試、LOD 或烘焙光照。

## 重建

1. 使用含 Pillow 的 Python 執行 `scripts/make_district_textures.py`。
2. 透過 Blender MCP 依序執行 `scripts/build_district.py`、`scripts/finalize_district.py`。
3. 執行 `scripts/render_district.py` 輸出七個視角。

擴充腳本重用初版的幾何與材質 helper，不需要先重建初版。路徑目前固定為本專案絕對路徑。重建會替換 `TW_NightMarket_District` 場景內的物件；手動編修前請另存版本。

本版是在先前已確認的夜市視覺風格上擴張，保留原有實景參考依據，沒有將特定真實夜市直接複製六次，也不是實地測繪模型。材質、幾何與招牌為本專案程序化原創製作；未加入第三方模型或照片貼圖，字型檔不隨資產散布。
