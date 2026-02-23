import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/ProjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: Number(params.id) },
  });

  if (!project) notFound();

  return (
    <div>
      <Link
        href="/admin/projects"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回作品列表
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">編輯作品</h1>
      <ProjectForm
        initial={{
          id: project.id,
          title: project.title,
          description: project.description,
          image: project.image,
          link: project.link,
          tags: project.tags,
          featured: project.featured,
          sortOrder: project.sortOrder,
        }}
      />
    </div>
  );
}
