import { prisma } from "@/lib/prisma";
import { FileText, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [articleCount, publishedCount, draftCount] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { published: true } }),
    prisma.article.count({ where: { published: false } }),
  ]);

  const stats = [
    {
      label: "文章總數",
      value: articleCount,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "已發佈",
      value: publishedCount,
      icon: Eye,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "草稿",
      value: draftCount,
      icon: EyeOff,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">儀表板</h1>
        <p className="mt-1 text-sm text-slate-500">內容管理總覽</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-800">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
