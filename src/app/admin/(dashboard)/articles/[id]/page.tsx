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
        className="mb-6 inline-flex items-center gap-2 font-mono text-sm text-text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        返回文章列表
      </Link>
      <h1 className="mb-8 font-mono text-2xl font-bold text-text-main">
        編輯文章
      </h1>
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
