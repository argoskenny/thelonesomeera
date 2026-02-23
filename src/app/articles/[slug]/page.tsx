import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import MarkdownContent from "@/components/ui/MarkdownContent";
import type { Metadata } from "next";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
  });
  if (!article) return { title: "Not Found" };
  return {
    title: `${article.title} | The Lonesome Era`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug, published: true },
  });

  if (!article) notFound();

  return (
    <main className="px-6 pt-28 pb-20">
      <article className="mx-auto max-w-3xl">
        {/* 返回連結 */}
        <Link
          href="/articles"
          className="mb-8 inline-flex items-center gap-2 font-mono text-sm text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          返回文章列表
        </Link>

        {/* 文章標題區 */}
        <header className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary">
              <Tag className="h-3 w-3" />
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-text-muted">
              <Calendar className="h-3 w-3" />
              {formatDate(article.createdAt)}
            </span>
          </div>
          <h1 className="font-mono text-3xl font-bold leading-tight text-text-main md:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-text-muted">{article.excerpt}</p>
        </header>

        {/* 文章內容 */}
        <MarkdownContent content={article.content} />
      </article>
    </main>
  );
}
