# Architecture Notes

## 目前結構

### 1. Main app

- `src/app`: Next.js App Router 頁面與 API route
- `src/components`: UI 與區塊元件
- `src/lib`: Prisma、auth、service 等共用邏輯

### 2. Showcase projects

- `showcase/<project>/`: 有建置流程的 demo 原始碼
- `public/showcase/<project>/`: 所有 demo 的對外發佈路徑

### 3. Public static content

- `public/`: 網站部署後直接對外提供的靜態檔案
- `public/*.html`: 歷史頁面、實驗頁面或單檔入口
- `public/uploads/`: 後台上傳內容

### 3. Standalone app sources

| App | Source of truth | Published path | Notes |
| --- | --- | --- | --- |
| Android WebView demo | `showcase/androidtest/` | `public/showcase/androidtest/` | 用 Vite build 發佈 |
| SOX FPS demo | `showcase/sox/` | `public/showcase/sox/` | 用同步腳本發佈 |
| COD2 FPS demo | `showcase/cod2/` | `public/showcase/cod2/` | 用 Vite build 後同步發佈 |
| Room demo | `showcase/room/` | `public/showcase/room/` | 用 Vite build 後同步發佈 |
| PulseSync demo | `showcase/pulsesync/` | `public/showcase/pulsesync/` | 用 Vite build 後同步發佈 |

## 資料庫約定

- Prisma schema 固定放在 `prisma/schema.prisma`。
- 本地開發資料庫固定使用 `prisma/dev.db`。
- 正式機資料庫固定使用 `/var/www/thelonesomeera/prisma/production.db`。
- 只有文章內容使用 Prisma / SQLite；作品列表改由 `src/lib/projects.ts` 維護。
- `.env.local` 若使用 `DATABASE_URL="file:./dev.db"`，這是 Prisma 標準相對路徑，實際會落在 `prisma/dev.db`。
- 不再保留根目錄 `dev.db` 這種第二條路徑。

## 這次整理後的維護規則

1. 不直接修改有 source app 對應的 `public/showcase/<project>/`。
2. 若新增獨立小專案，一律放在 `showcase/<project>/`，並發佈到 `public/showcase/<project>/`。
3. `public/` 根目錄只保留主站共用內容與 legacy 靜態頁面。
5. 靜態輸出目錄一律視為發佈結果，不直接手改。

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
