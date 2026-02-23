import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const article = await prisma.article.findUnique({
    where: { id: Number(params.id) },
  });

  if (!article) notFound();

  return (
    <div>
      <Link
        href="/admin/articles"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回文章列表
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">編輯文章</h1>
      <ArticleForm
        initial={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          category: article.category,
          coverImage: article.coverImage ?? "",
          published: article.published,
        }}
      />
    </div>
  );
}
