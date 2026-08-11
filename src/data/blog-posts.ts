export type BlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  date: string;
  dateLabel: string;
  readingTime: string;
};

export const blogPosts: BlogPost[] = [
  {
    title: "🐾 貓掌按快門！我開發「自拍貓 Selfie Cat」App 的小故事",
    slug: "selfie-cat-development",
    excerpt:
      "從一個讓貓咪自己拍照的小點子，走進觸控、相機與產品設計的完整開發過程。",
    category: "iOS 開發",
    date: "2025-05-20",
    dateLabel: "2025 / 05 / 20",
    readingTime: "5 分鐘",
  },
  {
    title: "前端遊戲開發實戰心得：從零打造 Web 遊戲的經驗分享",
    slug: "web-game-development",
    excerpt:
      "整理兩款 Web 遊戲的開發流程，從架構、狀態管理到效能優化。",
    category: "前端開發",
    date: "2024-03-15",
    dateLabel: "2024 / 03 / 15",
    readingTime: "3 分鐘",
  },
  {
    title: "Vue.js 3 Composition API 深度解析",
    slug: "vue3-composition-api",
    excerpt:
      "從實際專案理解 Composition API 的核心概念、組合方式與維護優勢。",
    category: "Vue.js",
    date: "2024-03-10",
    dateLabel: "2024 / 03 / 10",
    readingTime: "12 分鐘",
  },
  {
    title: "CSS Grid 與 Flexbox：何時使用哪一個？",
    slug: "css-grid-vs-flexbox",
    excerpt:
      "比較兩種布局方案的思維模型與實際場景，讓選擇不再只靠習慣。",
    category: "CSS",
    date: "2024-03-05",
    dateLabel: "2024 / 03 / 05",
    readingTime: "10 分鐘",
  },
  {
    title: "Web 效能優化：從載入時間到使用者體驗",
    slug: "web-performance-optimization",
    excerpt:
      "檢視影響效能的關鍵畫面，從資源載入、快取策略到核心指標。",
    category: "效能優化",
    date: "2024-02-28",
    dateLabel: "2024 / 02 / 28",
    readingTime: "13 分鐘",
  },
  {
    title: "響應式設計的進階技巧：超越 Bootstrap",
    slug: "advanced-responsive-design",
    excerpt:
      "用內容驅動斷點、容器查詢與現代 CSS，建立更自然的跨裝置體驗。",
    category: "響應式設計",
    date: "2024-02-20",
    dateLabel: "2024 / 02 / 20",
    readingTime: "11 分鐘",
  },
];

export function getBlogHref(slug: string) {
  return `/blog/${slug}.html`;
}
