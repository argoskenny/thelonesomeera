import type { MetadataRoute } from "next";
import { blogPosts, getBlogHref } from "@/data/blog-posts";
import { SITE_ORIGIN } from "@/lib/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const mainRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_ORIGIN}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_ORIGIN}/demo`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/blog`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/about`, changeFrequency: "yearly", priority: 0.6 },
    {
      url: `${SITE_ORIGIN}/demo/ai-hub`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const articleRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_ORIGIN}${getBlogHref(post.slug)}`,
    lastModified: post.date,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [...mainRoutes, ...articleRoutes];
}
