import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Eye, EyeOff, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-text-main">
            文章管理
          </h1>
          <p className="mt-1 font-mono text-sm text-text-muted">
            共 {articles.length} 篇文章
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-mono text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          新增文章
        </Link>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-card">
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold text-text-muted">
                標題
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold text-text-muted">
                分類
              </th>
              <th className="px-4 py-3 text-center font-mono text-xs font-semibold text-text-muted">
                狀態
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold text-text-muted">
                日期
              </th>
              <th className="px-4 py-3 text-right font-mono text-xs font-semibold text-text-muted">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr
                key={article.id}
                className="border-b border-slate-800/30 transition-colors hover:bg-card/50"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-text-main">
                    {article.title}
                  </span>
                  <br />
                  <span className="font-mono text-xs text-text-muted">
                    /{article.slug}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-text-muted">
                    {article.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {article.published ? (
                    <span className="inline-flex items-center gap-1 text-syntax-green">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs">已發佈</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-text-muted">
                      <EyeOff className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs">草稿</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">
                  {formatDate(article.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="rounded-lg p-2 text-text-muted transition-colors hover:bg-slate-800 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      id={article.id}
                      type="articles"
                      name={article.title}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {articles.length === 0 && (
          <div className="p-8 text-center font-mono text-sm text-text-muted">
            尚無文章，點擊「新增文章」開始建立
          </div>
        )}
      </div>
    </div>
  );
}
