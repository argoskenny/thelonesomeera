# The Lonesome Era

The Lonesome Era 是一個以 Next.js 建置的個人創作網站，內容集中在作品、前端與遊戲實驗，以及開發文章。主站只保留四個清楚的入口：

- `/`：首頁與精選內容
- `/demo`：Demo、遊戲與 AI 實驗
- `/blog`：文章列表
- `/about`：網站理念與作者介紹

文章內容不使用資料庫或後台。每篇文章都是 `public/blog/` 內可直接閱讀與部署的靜態 HTML。

## Project structure

```text
src/
  app/(site)/          # 首頁、Demo、Blog 列表、About
  components/          # 共用版面與 UI 元件
  data/                # Demo 與 Blog 的靜態 metadata
public/
  blog/                # Blog HTML、共用文章樣式
  showcase/<project>/  # 對外發佈的獨立 Demo 成品
  selfiecat.html       # Selfie Cat 既有產品展示頁
showcase/<project>/    # 有原始碼與建置流程的獨立 Demo
scripts/               # Standalone build 與同步腳本
```

`showcase/<project>/` 是可建置 Demo 的 source of truth；對應的 `public/showcase/<project>/` 是部署輸出。部分早期單檔實驗只有 `public/showcase/` 版本，仍可作為靜態 Demo 維護。

## Development

```bash
npm run dev
npm run lint
npm run build
npm run verify
npm run verify:release
```

`npm run build` 會一併封裝 standalone 所需的 `public/` 與 Next.js static assets；完成後可直接用 `npm start` 驗證 production 產物。

`npm run verify` 會檢查主站與所有具測試／型別檢查的 showcase；`npm run verify:release` 還會重建全部發布輸出，啟動 production standalone server 並檢查主路由、文章與 demo。CI 另以 `npm run check:generated` 確認提交的 `public/showcase/` 沒有落後來源。

常用的獨立 Demo 指令：

```bash
npm run build:androidtest
npm run build:colorful_kart
npm run build:mini_fantasy
npm run sync:static
npm run build:standalone
```

修改有 source project 的 Demo 時，只修改 `showcase/<project>/`，再執行對應 build 或 `npm run build:standalone` 刷新 `public/showcase/<project>/`。不要直接手改產出的 bundle。

`build:standalone` 與 `sync:static` 預設採 fail-closed：缺少任何已登錄的來源或發布入口就會失敗，避免沿用舊 bundle。只有刻意使用不完整的本機 checkout 時，才可加上 `-- --allow-skip` 明確略過缺項；正式發佈不可使用此選項。

## Add a blog post

1. 在 `public/blog/` 新增 kebab-case HTML，例如 `making-a-web-game.html`。
2. 沿用現有文章的語意結構、引用 `/blog/article.css`，並補齊 `<title>`、description、日期、分類、閱讀時間與文章內容。
3. 將文章的標題、slug、日期、摘要、分類與 URL 加入 `src/data/blog-posts.ts`。
4. 確認文章內的返回連結指向 `/blog`，並直接開啟 `/blog/making-a-web-game.html` 檢查桌面與行動版。
5. 若有維護 RSS，同步更新 `public/rss.xml`。

文章不需要 migration、seed、API 或部署前匯入；HTML 與列表 metadata 一起提交即可。

## Production deployment

正式環境沿用 Next.js standalone、PM2 與 Nginx。伺服器上的標準入口是：

```bash
cd /var/www/thelonesomeera
bash deploy.sh
```

`deploy.sh` 會同步指定分支、安裝相依、刷新 standalone Demo、建置 Next.js 並重啟 PM2。若只需要重新建置目前 checkout，可使用：

```bash
bash deploy.sh --skip-sync
```

若正式機站台設定已由 Certbot 加入 SSL，部署腳本會保留該檔案，不會自動覆寫。首次套用本次 Nginx 靜態路由時，請先備份並手動合併 repo 的 `nginx.conf`，再執行 `nginx -t`。

完整邊界與發佈規則見 `docs/architecture.md`。
