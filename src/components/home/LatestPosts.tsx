import BlogRow from "@/components/blog/BlogRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { blogPosts } from "@/data/blog-posts";

export default function LatestPosts() {
  return (
    <section className="home-section page-container reveal-section">
      <SectionHeading title="Field notes" href="/blog" linkLabel="前往 Blog" />
      <div className="blog-list blog-list--home">
        {blogPosts.slice(0, 3).map((post) => (
          <BlogRow key={post.slug} post={post} compact />
        ))}
      </div>
    </section>
  );
}
