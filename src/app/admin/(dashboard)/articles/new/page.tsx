import ArticleForm from "@/components/admin/ArticleForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewArticlePage() {
  return (
    <div>
      <Link
        href="/admin/articles"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回文章列表
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">新增文章</h1>
      <ArticleForm />
    </div>
  );
}
