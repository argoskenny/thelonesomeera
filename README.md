# The Lonesome Era

這個 repo 目前由三個維度組成：

- `src/`：主要的 Next.js 網站與後台。
- `public/`：對外提供的靜態檔案與 legacy 頁面。
- `androidtest/`、`sox/`、`cod2/`、`pulsesync/`：獨立小專案的原始碼。

## 建議維護規則

- 主站功能請改 `src/app`、`src/components`、`src/lib`。
- `androidtest` 請只改 `androidtest/`，不要直接改 `public/dist-androidtest/`。
- `sox` 請只改 `sox/`，不要直接改 `public/sox/`。
- `cod2` 請只改 `cod2/`，不要直接改 `public/cod2/`。
- `pulsesync` 請只改 `pulsesync/`，不要直接改 `public/pulsesync/`。
- `public/` 裡的 legacy HTML 仍可直接維護，但如果是有獨立來源目錄的子專案，`public/` 應視為發佈結果。
- 目前部署策略為「發佈產物也提交到 Git」；部署前請先在本機完成 build，並提交 `public/dist-androidtest/`、`public/sox/`、`public/cod2/`、`public/pulsesync/` 與對應 source app 的變更，不要在正式機直接修改這些內容。

## 資料庫規則

- 本地開發只使用 `prisma/dev.db`。
- `.env.local` 在本地請寫 `DATABASE_URL="file:./dev.db"`；這是 Prisma 的標準寫法，會對應到 `prisma/dev.db`。
- 正式機只使用絕對路徑 `file:/var/www/thelonesomeera/prisma/production.db`。
- 作品列表改為程式內靜態資料，只有文章內容使用 Prisma / SQLite。
- 不要在 repo 根目錄建立 `dev.db` 或 `production.db`。

## 常用指令

```bash
npm run dev
npm run build:androidtest
npm run sync:static
npm run build:standalone
```

## 正式機部署

正式機請不要手動執行 `git pull`。標準流程是直接在伺服器執行：

```bash
cd /var/www/thelonesomeera
bash deploy.sh
```

`deploy.sh` 會先執行 `git fetch origin`、`git reset --hard origin/main`、`git clean -fd`，再安裝相依、建置並重啟 PM2。若只想重跑建置而不重新同步 Git，可使用：

```bash
bash deploy.sh --skip-sync
```

更完整的結構說明見 `docs/architecture.md`。
