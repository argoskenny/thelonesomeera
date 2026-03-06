# Architecture Notes

## 目前結構

### 1. Main app

- `src/app`: Next.js App Router 頁面與 API route
- `src/components`: UI 與區塊元件
- `src/lib`: Prisma、auth、service 等共用邏輯

### 2. Public static content

- `public/`: 網站部署後直接對外提供的靜態檔案
- `public/*.html`: 歷史頁面、實驗頁面或單檔入口
- `public/uploads/`: 後台上傳內容

### 3. Standalone app sources

| App | Source of truth | Published path | Notes |
| --- | --- | --- | --- |
| Android WebView demo | `androidtest/` | `public/dist-androidtest/` + `public/androidtest.html` | 用 Vite build 發佈 |
| SOX FPS demo | `sox/` | `public/sox/` | 用同步腳本發佈 |

## 這次整理後的維護規則

1. 不直接修改 `public/dist-androidtest/`。
2. 不直接修改 `public/sox/`。
3. `public/` 只保留部署內容與 legacy 靜態頁面，不再放可編輯的 `androidtest` 原始碼副本。
4. 若新增新的獨立小專案，優先放在專屬來源目錄，再用 build 或 sync 輸出到 `public/`。

## 建議工作流程

### Android demo

```bash
npm run build:androidtest
```

### SOX demo

```bash
npm run sync:static
```

### 部署前刷新所有獨立 app

```bash
npm run build:standalone
```

## 後續仍值得考慮的整理

- 把 `public/` 內的 legacy 單頁依主題移到 `public/legacy/` 或獨立資料夾，降低根目錄噪音。
- 為 `public/` 內仍在使用的單檔頁面補最基本的 README 或清單，標記用途與是否仍在維護。
- 若獨立小專案再增加，考慮改成 `apps/` 目錄統一管理。
