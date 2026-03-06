# The Lonesome Era

這個 repo 目前由三個維度組成：

- `src/`：主要的 Next.js 網站與後台。
- `public/`：對外提供的靜態檔案與 legacy 頁面。
- `androidtest/`、`sox/`：獨立小專案的原始碼。

## 建議維護規則

- 主站功能請改 `src/app`、`src/components`、`src/lib`。
- `androidtest` 請只改 `androidtest/`，不要直接改 `public/dist-androidtest/`。
- `sox` 請只改 `sox/`，不要直接改 `public/sox/`。
- `public/` 裡的 legacy HTML 仍可直接維護，但如果是有獨立來源目錄的子專案，`public/` 應視為發佈結果。
- 目前部署策略為「發佈產物也提交到 Git」；部署前請先在本機完成 build，並提交 `public/dist-androidtest/`、`public/sox/` 與 `cod2/` 的變更，不要在正式機直接修改這些內容。

## 常用指令

```bash
npm run dev
npm run build:androidtest
npm run sync:static
npm run build:standalone
```

更完整的結構說明見 `docs/architecture.md`。
