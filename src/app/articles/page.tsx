import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "技術文章 | The Lonesome Era",
  description: "前端開發、遊戲製作與效能優化的技術文章",
};

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="px-6 pt-28 pb-20">
      <div className="mx-auto max-w-4xl">
        {/* 頁面標題 */}
        <div className="mb-16">
          <p className="mb-2 font-mono text-sm text-syntax-orange">
            {"// 技術文章"}
          </p>
          <h1 className="mb-4 font-mono text-4xl font-bold text-text-main md:text-5xl">
            Articles
          </h1>
          <p className="max-w-xl text-text-muted">
            深入前端開發、遊戲製作與科技觀察的實戰心得與技術解析。
          </p>
        </div>

        {/* 文章列表 */}
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="glow-card group block"
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary">
                  <Tag className="h-3 w-3" />
                  {article.category}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs text-text-muted">
                  <Calendar className="h-3 w-3" />
                  {formatDate(article.createdAt)}
                </span>
              </div>
              <h2 className="mb-2 font-mono text-xl font-semibold text-text-main transition-colors group-hover:text-primary">
                {article.title}
              </h2>
              <p className="text-sm leading-relaxed text-text-muted line-clamp-2">
                {article.excerpt}
              </p>
            </Link>
          ))}

          {articles.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
              <p className="font-mono text-text-muted">尚無已發佈的文章</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
