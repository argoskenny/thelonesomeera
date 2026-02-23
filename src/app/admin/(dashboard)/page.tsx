import { prisma } from "@/lib/prisma";
import { FileText, Folder, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [articleCount, publishedCount, draftCount, projectCount] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { published: true } }),
      prisma.article.count({ where: { published: false } }),
      prisma.project.count(),
    ]);

  const stats = [
    {
      label: "文章總數",
      value: articleCount,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "已發佈",
      value: publishedCount,
      icon: Eye,
      color: "text-syntax-green",
      bg: "bg-syntax-green/10",
    },
    {
      label: "草稿",
      value: draftCount,
      icon: EyeOff,
      color: "text-syntax-orange",
      bg: "bg-syntax-orange/10",
    },
    {
      label: "作品總數",
      value: projectCount,
      icon: Folder,
      color: "text-syntax-purple",
      bg: "bg-syntax-purple/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-mono text-2xl font-bold text-text-main">
          儀表板
        </h1>
        <p className="mt-1 font-mono text-sm text-text-muted">
          {"// 內容管理總覽"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-700/50 bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-4 font-mono text-3xl font-bold text-text-main">
                {stat.value}
              </p>
              <p className="mt-1 font-mono text-xs text-text-muted">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
