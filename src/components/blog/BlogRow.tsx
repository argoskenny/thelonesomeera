import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/data/blog-posts";
import { getBlogHref } from "@/data/blog-posts";

type BlogRowProps = {
  post: BlogPost;
  compact?: boolean;
  headingLevel?: 2 | 3;
};

export default function BlogRow({
  post,
  compact = false,
  headingLevel = 3,
}: BlogRowProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <a
      href={getBlogHref(post.slug)}
      className={compact ? "blog-row blog-row--compact" : "blog-row"}
    >
      <span className="blog-row__accent" aria-hidden="true" />
      <div className="blog-row__content">
        <Heading>{post.title}</Heading>
        <p>{post.excerpt}</p>
      </div>
      <div className="blog-row__meta">
        <span>{post.category}</span>
        <time dateTime={post.date}>{post.dateLabel}</time>
        {compact ? null : <span>{post.readingTime}</span>}
      </div>
      <ArrowRight className="blog-row__arrow" aria-hidden="true" />
    </a>
  );
}
