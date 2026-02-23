import ProjectForm from "@/components/admin/ProjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  return (
    <div>
      <Link
        href="/admin/projects"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回作品列表
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">新增作品</h1>
      <ProjectForm />
    </div>
  );
}
