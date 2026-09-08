# 榕安夜市 — 攤販熱區與街燈配置版

本版將攤位由 58 座增加為 **116 座**，加入 **10 種新攤型，總計 46 種攤販**。以北側道路形成兩側緊密相連的熱區，其他道路保留不均勻、疏密不同的分布。58 棟獨立建築設計保留。

![北側攤販熱區](../assets/night-market-hotspot/renders/02_north_hotspot.png)

## 最新檔案

- [Blender 可編輯原檔](../assets/night-market-hotspot/taiwan_night_market_hotspot.blend)，場景 `TW_NightMarket_Hotspot`；新版相機以 `HOT_` 開頭。
- [GLB 模型](../assets/night-market-hotspot/taiwan_night_market_hotspot.glb)
- [攤位、販賣機群組與路燈配置資料](../assets/night-market-hotspot/hotspot_layout.json)
- [保留的 58 棟建築設計對照](unique-building-catalog.md)

## 攤販配置

新增滷味、蚵仔大腸麵線、鐵板牛排、泰式香蕉煎餅、花生捲冰淇淋、鳥蛋、烤地瓜、麻將賓果、沙威瑪及麻糬；每種新增設計配置三座，含對應商品與設備模型。另增加原有攤型，合計新增 58 座。攤位名稱以原本繁體中文點陣招牌呈現，維持約 2000 年代復古遊戲風格。

| 街段 | 攤位數 | 分布 |
| --- | ---: | --- |
| 北側熱區 | 29 | 內側 15、外側 14，雙排連續，路口及市公所前留缺口 |
| 南側道路 | 23 | 內側 10、外側 13，多個密集段落 |
| 西側道路 | 18 | 兩側各 9 座，保留穿越缺口 |
| 東側道路 | 14 | 內側 6、外側 8，較疏的段落 |
| 街區內 | 32 | 中央道路 16 座，兩條內部縱向道路共 16 座 |
| 合計 | 116 | 外圍道路 84 座，內部 32 座 |

攤位完整外包絡調整為寬 3.85m、深 1.70m。熱區密集段的攤位中心間距 4m，相鄰外包絡約留 15cm 間隔；道路中央保留至少 3m 檢查通道，交叉路口及公共建築前留較寬缺口。攤位後方仍留店面接近空間。

## 販賣機與路燈

20 台販賣機的機種與各機種數量保持不變：飲料 5、零食 4、咖啡 4、冰品 4、扭蛋 3。

- 四組三台、三組兩台，另有兩台獨立配置，共九處。
- 成組機台中心間距 1.18m，混合不同機種；主要集中在外圍路邊的攤位後方。
- 路燈共 18 盞，均設在道路邊緣，燈臂朝道路中央延伸。
- 燈頭與 Spot 光源方向對準道路中央，GLB 保留 Spot 方向；舊的路中央光源已替換。
- 低掛路名牌提高 0.9m，以避開攤棚；公用電桿與線路保留。

## 預覽

| 視圖 | 內容 |
| --- | --- |
| [全景](../assets/night-market-hotspot/renders/01_overview.png) | 全區攤位與建築分布 |
| [熱區街景](../assets/night-market-hotspot/renders/02_north_hotspot.png) | 北側道路雙排攤位 |
| [熱區高視角](../assets/night-market-hotspot/renders/03_hotspot_elevated.png) | 連續攤位及路口缺口 |
| [新增小吃](../assets/night-market-hotspot/renders/04_new_foods.png) | 新攤位設備與商品 |
| [北側販賣機群](../assets/night-market-hotspot/renders/05_vending_bank.png) | 三台連排配置 |
| [西側販賣機群](../assets/night-market-hotspot/renders/06_west_bank.png) | 不同機種組合 |
| [路邊街燈](../assets/night-market-hotspot/renders/07_curb_lights.png) | 朝向路中央的燈臂、燈頭 |
| [南側街景](../assets/night-market-hotspot/renders/08_south_street.png) | 較不均勻的攤位分布 |
| [配置俯視](../assets/night-market-hotspot/renders/09_layout_map.png) | Workbench 全區配置圖 |

## 驗證與交付界線

[幾何與配置驗證](../assets/night-market-hotspot/validation.json)包含攤位數量／類型、販賣機數量與群組、58 棟建築幾何及座標保留、18 盞燈具實際朝向、道路與入口通道、攤位彼此外包絡及販賣機碰撞檢查。

模型共 438,624 三角面，GLB 分為 90 個空間區塊。

[模型統計](../assets/night-market-hotspot/scene_manifest.json)、[GLB 結構驗證](../assets/night-market-hotspot/glb_validation.json)、[GLB 重新匯入](../assets/night-market-hotspot/glb_roundtrip.json)、[檔案雜湊](../assets/night-market-hotspot/checksums.json)。

目前為靜態環境模型；AABB 空間檢查不等同遊戲引擎碰撞、NavMesh、人流或效能驗證。攤位及販賣機尚無互動功能。GLB 支援本版路燈 Spot；其他原有 Area Light 仍以點光源近似，世界背景需由引擎設定。渲染預覽以 Blender 原檔為準。

## 重建

1. 使用含 Pillow 的 Python 執行 `scripts/make_hotspot_textures.py`。
2. Blender 開啟含 `TW_NightMarket_Unique` 的前版原檔。
3. 透過 Blender MCP 執行 `scripts/build_hotspot.py` → `scripts/finalize_hotspot.py` → `scripts/render_hotspot.py` → `scripts/validate_hotspot_export.py`。渲染配置圖時指定 `RENDER_MAP=True`。

重建腳本只替換 `TW_NightMarket_Hotspot`，手動編輯版本請先另存副本。腳本使用本專案絕對路徑。前版記錄與檔案保留：[v4 獨立建築版](night-market-v4.md)、[v3 外圍建築與遊戲攤版](night-market-v3.md)。

新幾何、招牌及商品為程序化原創製作，未加入第三方模型或照片貼圖；系統字型僅用於招牌點陣化，字型檔未散布。
