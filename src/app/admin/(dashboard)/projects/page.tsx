import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Star } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-text-main">
            作品管理
          </h1>
          <p className="mt-1 font-mono text-sm text-text-muted">
            共 {projects.length} 個作品
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-mono text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          新增作品
        </Link>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-card">
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold text-text-muted">
                排序
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold text-text-muted">
                作品
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs font-semibold text-text-muted">
                連結
              </th>
              <th className="px-4 py-3 text-center font-mono text-xs font-semibold text-text-muted">
                精選
              </th>
              <th className="px-4 py-3 text-right font-mono text-xs font-semibold text-text-muted">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-slate-800/30 transition-colors hover:bg-card/50"
              >
                <td className="px-4 py-3 font-mono text-sm text-text-muted">
                  #{project.sortOrder}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.image}
                        alt={project.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="font-mono text-sm text-text-main">
                      {project.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">
                  {project.link}
                </td>
                <td className="px-4 py-3 text-center">
                  {project.featured && (
                    <Star className="mx-auto h-4 w-4 fill-syntax-yellow text-syntax-yellow" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="rounded-lg p-2 text-text-muted transition-colors hover:bg-slate-800 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      id={project.id}
                      type="projects"
                      name={project.title}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div className="p-8 text-center font-mono text-sm text-text-muted">
            尚無作品，點擊「新增作品」開始建立
          </div>
        )}
      </div>
    </div>
  );
}
