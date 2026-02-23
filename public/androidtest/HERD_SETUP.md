# Herd 環境設定說明

## 概述

這個 Vue 3 專案已經配置為在 Herd 本地開發環境下運行。

## 設定步驟

### 1. 建置 Vue 專案

```bash
cd androidtest
npm install
npm run build
```

### 2. 訪問方式

#### 在瀏覽器中查看

- 直接訪問：`http://thelonesomeera.test/androidtest.html`
- 或使用：`http://localhost/androidtest.html`（如果 herd 配置了 localhost）

#### 在 Android 應用程式中

- Android 應用程式已配置為載入：`http://thelonesomeera.test/androidtest.html`
- 確保 Android 裝置與開發機器在同一網路中

### 3. 檔案結構

```
thelonesomeera/
├── androidtest/           # Vue 3 專案原始碼
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── dist-androidtest/      # 建置後的靜態檔案
│   ├── assets/
│   └── index.html
└── androidtest.html       # Herd 環境下的入口檔案
```

### 4. 開發流程

1. **修改程式碼**：編輯 `androidtest/src/` 下的檔案
2. **建置專案**：執行 `npm run build`
3. **測試**：在瀏覽器中重新整理頁面

### 5. 功能特色

- ✅ 接收 Android WebView 的 `AndroidBridge` 參數
- ✅ 顯示裝置資訊（裝置類型、語言代碼、國家代碼、時區）
- ✅ 響應式設計，適配手機版面
- ✅ 即時狀態監控
- ✅ 在 Herd 環境下正常運行

### 6. 故障排除

#### 如果頁面無法載入

1. 確認 herd 服務正在運行：`herd start`
2. 檢查檔案路徑是否正確
3. 確認建置是否成功

#### 如果 Android 應用程式無法連接

1. 確認 Android 裝置與開發機器在同一網路
2. 檢查防火牆設定
3. 嘗試使用 IP 地址而非域名

### 7. 技術細節

- **Vue 3**：使用 Composition API
- **Vite**：快速建置工具
- **Herd**：本地開發伺服器
- **Android WebView**：透過 JavaScript Interface 進行通訊
