import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Star } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">作品管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {projects.length} 個作品
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新增作品
        </Link>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                排序
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                作品
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                連結
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                精選
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="px-5 py-4 text-sm text-slate-500">
                  #{project.sortOrder}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.image}
                        alt={project.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {project.title}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {project.link}
                </td>
                <td className="px-5 py-4 text-center">
                  {project.featured && (
                    <Star className="mx-auto h-4 w-4 fill-amber-400 text-amber-400" />
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
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
          <div className="p-12 text-center text-sm text-slate-400">
            尚無作品，點擊「新增作品」開始建立
          </div>
        )}
      </div>
    </div>
  );
}
