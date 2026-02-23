import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/ProjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
        className="mb-6 inline-flex items-center gap-2 font-mono text-sm text-text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        返回作品列表
      </Link>
      <h1 className="mb-8 font-mono text-2xl font-bold text-text-main">
        編輯作品
      </h1>
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
