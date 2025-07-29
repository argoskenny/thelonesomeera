# Android WebView Vue 專案

這是一個簡單的 Vue 3 專案，用於接收並顯示來自 Android WebView 的參數。

## 功能特色

- 接收 Android WebView 的 `AndroidBridge` 參數
- 顯示裝置資訊（裝置類型、語言代碼、國家代碼、時區）
- 響應式設計，適配手機版面
- 即時狀態監控

## 安裝與執行

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

### 建置專案

```bash
npm run build
```

## Android 整合

此專案設計用於與 Android WebView 整合，透過 `AndroidBridge` 接收以下參數：

- `getAndroidAgent()` - 裝置類型
- `getLanguageCode()` - 語言代碼
- `getCountryCode()` - 國家代碼
- `getTimeZone()` - 時區

## 專案結構

```
androidtest/
├── src/
│   ├── App.vue          # 主要 Vue 元件
│   ├── main.js          # 應用程式入口
│   └── style.css        # 全域樣式
├── index.html           # HTML 模板
├── package.json         # 專案配置
├── vite.config.js       # Vite 配置
└── README.md           # 專案說明
```

## 技術棧

- Vue 3 (Composition API)
- Vite
- CSS3 (響應式設計)
