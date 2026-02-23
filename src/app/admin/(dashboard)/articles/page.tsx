import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Eye, EyeOff, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">文章管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {articles.length} 篇文章
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新增文章
        </Link>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                標題
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                分類
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                狀態
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                日期
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {articles.map((article) => (
              <tr
                key={article.id}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-800">
                    {article.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    /{article.slug}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {article.category}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  {article.published ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <Eye className="h-3 w-3" />
                      已發佈
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                      <EyeOff className="h-3 w-3" />
                      草稿
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {formatDate(article.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
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
          <div className="p-12 text-center text-sm text-slate-400">
            尚無文章，點擊「新增文章」開始建立
          </div>
        )}
      </div>
    </div>
  );
}
