import ProjectForm from "@/components/admin/ProjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
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
        新增作品
      </h1>
      <ProjectForm />
    </div>
  );
}
