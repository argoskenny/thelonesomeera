import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

// @ts-expect-error turndown 無型別定義
import TurndownService from "turndown";

const prisma = new PrismaClient();
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// 保留程式碼區塊的語言標記
turndown.addRule("codeBlock", {
  filter: (node: HTMLElement) =>
    node.nodeName === "PRE" && node.querySelector("code") !== null,
  replacement: (_content: string, node: HTMLElement) => {
    const code = node.querySelector("code");
    if (!code) return _content;
    const langMatch = code.className?.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1] : "";
    const text = code.textContent || "";
    return `\n\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
  },
});

/** 從 HTML 檔案中提取 .article-content 區塊並轉為 Markdown */
function extractArticleContent(filename: string): string {
  const filepath = join(process.cwd(), "public", "tech", filename);
  try {
    const html = readFileSync(filepath, "utf-8");
    const match = html.match(
      /<div class="article-content">([\s\S]*?)<\/div>\s*<\/div>\s*<\/body>/
    );
    if (!match) return "";
    return turndown.turndown(match[1]).trim();
  } catch {
    console.warn(`無法讀取檔案: ${filepath}`);
    return "";
  }
}

interface ArticleSeed {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
}

const articleMeta: Omit<ArticleSeed, "content">[] = [
  {
    title: "貓掌按快門！我開發「自拍貓 Selfie Cat」App 的小故事",
    slug: "selfie-cat-development",
    excerpt:
      "分享開發寵物 App 的完整過程，從技術挑戰到商業模式，用 SwiftUI 讓貓咪變身攝影師！",
    category: "iOS 開發",
    published: true,
  },
  {
    title: "前端遊戲開發實戰心得：從零打造 Web 遊戲的經驗分享",
    slug: "web-game-development",
    excerpt:
      "分享開發《Hell Rider》和《Sox 射擊遊戲》的完整經驗，從架構設計到效能優化的實戰心得。",
    category: "前端開發",
    published: true,
  },
  {
    title: "Vue.js 3 Composition API 深度解析",
    slug: "vue3-composition-api",
    excerpt:
      "從實際專案角度分析 Vue 3 的 Composition API，如何讓程式碼更具可維護性和重用性。",
    category: "Vue.js",
    published: true,
  },
  {
    title: "CSS Grid 與 Flexbox：何時使用哪一個？",
    slug: "css-grid-vs-flexbox",
    excerpt:
      "詳細比較 CSS Grid 和 Flexbox 的使用場景，透過實際案例說明如何選擇合適的布局方案。",
    category: "CSS",
    published: true,
  },
  {
    title: "Web 效能優化：從載入時間到使用者體驗",
    slug: "web-performance-optimization",
    excerpt:
      "分享實際專案中的效能優化經驗，包含圖片優化、程式碼分割和快取策略。",
    category: "效能優化",
    published: true,
  },
  {
    title: "響應式設計的進階技巧：超越 Bootstrap",
    slug: "advanced-responsive-design",
    excerpt:
      "探討現代響應式設計的最佳實踐，如何創造更好的跨裝置使用體驗。",
    category: "響應式設計",
    published: true,
  },
];

const htmlFileMap: Record<string, string> = {
  "selfie-cat-development": "selfie-cat-development.html",
  "web-game-development": "web-game-development.html",
  "vue3-composition-api": "vue3-composition-api.html",
  "css-grid-vs-flexbox": "css-grid-vs-flexbox.html",
  "web-performance-optimization": "web-performance-optimization.html",
  "advanced-responsive-design": "advanced-responsive-design.html",
};

async function main() {
  console.log("Seeding database...");

  for (const meta of articleMeta) {
    const htmlFile = htmlFileMap[meta.slug];
    const content = htmlFile
      ? extractArticleContent(htmlFile)
      : `# ${meta.title}\n\n${meta.excerpt}`;

    const contentLength = content.length;
    console.log(
      `  [${meta.slug}] content: ${contentLength} chars ${htmlFile ? "(from HTML)" : "(fallback)"}`
    );

    const article: ArticleSeed = { ...meta, content };

    await prisma.article.upsert({
      where: { slug: meta.slug },
      update: article,
      create: article,
    });
  }
  console.log(`Seeded ${articleMeta.length} articles`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
