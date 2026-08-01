# The Lonesome Era

這個 repo 目前由四個清楚的區域組成：

- `src/`：主要的 Next.js 網站與後台。
- `showcase/<project>/`：所有獨立 demo 與 AI 實驗專案的原始碼。
- `public/showcase/<project>/`：對外發佈的 showcase 靜態成品。
- `public/`：主站共用資產與尚未專案化的 legacy 頁面。

## 建議維護規則

- 主站功能請改 `src/app`、`src/components`、`src/lib`。
- 有 source app 的專案請只改 `showcase/<project>/`，不要直接改 `public/showcase/<project>/`。
- `public/` 裡的 legacy HTML 仍可直接維護，但如果是有獨立來源目錄的子專案，`public/` 應視為發佈結果。
- 目前部署策略為「發佈產物也提交到 Git」；部署前請先在本機完成 build，並提交 `showcase/` source 與 `public/showcase/` 發佈成品。

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
npm run build:colorful_kart
npm run build:mini_fantasy
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
