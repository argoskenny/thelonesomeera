import CosmicBackdrop from "@/components/ui/CosmicBackdrop";
import type { Metadata } from "next";
import BlogRow from "@/components/blog/BlogRow";
import { blogPosts } from "@/data/blog-posts";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Blog",
  description: "關於前端、遊戲、產品與那些值得慢慢想的細節。",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <main className="page-container page-main cosmic-page cosmic-page--nebula">
      <CosmicBackdrop variant="nebula" />
      <header className="page-intro page-intro--blog">
        <h1 className="display-title">FIELD<br />NOTES<span>.</span></h1>
        <p>寫給未來的自己。<br />關於前端、遊戲、產品與那些值得慢慢想的細節。</p>
      </header>

      <section className="blog-index" aria-label="文章列表">
        <div className="blog-index__head" aria-hidden="true">
          <span>文章標題</span>
          <span>分類</span>
          <span>日期</span>
          <span>閱讀時間</span>
        </div>
        <div className="blog-list">
          {blogPosts.map((post) => (
            <BlogRow key={post.slug} post={post} headingLevel={2} />
          ))}
        </div>
      </section>
    </main>
  );
}
