# Mythic Match

一款以魔法生物為主題的記憶配對遊戲，使用原生 HTML、CSS 與 JavaScript 製作。遊戲提供 Easy、Mystic、Mythic 三種難度，包含計時、連擊、分數、音效與最佳成績提示。

## 啟動

這是純靜態專案，不需要安裝相依套件。可直接用本機 HTTP server 開啟：

```bash
python3 -m http.server 4173 --directory .
```

然後開啟 `http://127.0.0.1:4173/`。正式展示路徑為 `/showcase/mma/`；若從 repo 根目錄更新發佈成品，執行：

```bash
npm run sync:static
```

## 操作

- 點擊卡片：翻開卡片並配對魔法生物
- `Restart`：重新開始目前難度
- `Play again`：完成後重新遊玩
- `Change difficulty`：切換難度
- 聲音按鈕：開啟或關閉音效

## 專案結構

```text
index.html                 # 遊戲頁面與可存取的 UI 結構
styles.css                 # 遊戲版面、卡片與響應式樣式
app.js                     # 記憶配對、計時、分數與音效邏輯
assets/                    # 背景與魔法生物 sprite 資產
```

`showcase/mma/` 是 source of truth；`public/showcase/mma/` 是部署用的靜態副本，不直接在 public 目錄修改。
