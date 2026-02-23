import ArticleForm from "@/components/admin/ArticleForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewArticlePage() {
  return (
    <div>
      <Link
        href="/admin/articles"
        className="mb-6 inline-flex items-center gap-2 font-mono text-sm text-text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        返回文章列表
      </Link>
      <h1 className="mb-8 font-mono text-2xl font-bold text-text-main">
        新增文章
      </h1>
      <ArticleForm />
    </div>
  );
}
