import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { blogPosts, getBlogHref } from "../src/data/blog-posts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("every Blog metadata entry resolves to a standalone HTML article", () => {
  assert.ok(blogPosts.length > 0, "Blog metadata should contain at least one article");

  for (const post of blogPosts) {
    const relativePath = `public${getBlogHref(post.slug)}`;
    const absolutePath = path.join(repoRoot, relativePath);

    assert.equal(existsSync(absolutePath), true, `${relativePath} should exist`);

    const html = readFileSync(absolutePath, "utf8");
    const canonicalUrl = `https://thelonesomeera.com${getBlogHref(post.slug)}`;
    const socialTitle = `${post.title} | The Lonesome Era`;
    const description = html.match(
      /<meta name="description" content="([^"]+)">/,
    )?.[1];

    assert.ok(description, `${relativePath} should have a description`);
    assert.match(html, /<html lang="zh-Hant">/);
    assert.match(html, /<link rel="stylesheet" href="\/blog\/article\.css">/);
    assert.ok(
      html.includes(`<link rel="canonical" href="${canonicalUrl}">`),
      `${relativePath} should have the correct canonical URL`,
    );
    assert.match(
      html,
      /<link rel="alternate" type="application\/rss\+xml"[^>]+href="\/rss\.xml">/,
    );
    assert.match(html, /<meta property="og:type" content="article">/);
    assert.ok(html.includes(`<meta property="og:title" content="${socialTitle}">`));
    assert.ok(html.includes(`<meta property="og:description" content="${description}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${canonicalUrl}">`));
    assert.match(html, /<meta property="og:image" content="https:\/\/[^">]+">/);
    assert.ok(
      html.includes(
        `<meta property="article:published_time" content="${post.date}T00:00:00+08:00">`,
      ),
    );
    assert.match(
      html,
      /<meta name="twitter:card" content="summary_large_image">/,
    );
    assert.ok(html.includes(`<meta name="twitter:title" content="${socialTitle}">`));
    assert.ok(html.includes(`<meta name="twitter:description" content="${description}">`));
    assert.match(html, /<meta name="twitter:image" content="https:\/\/[^">]+">/);
    assert.match(html, /href="\/blog" class="back-button"/);
    assert.match(
      html,
      new RegExp(`<h1 class="article-title">${escapeRegex(post.title)}</h1>`),
    );
    assert.match(html, new RegExp(post.date.slice(0, 4)));
    assert.match(
      html,
      new RegExp(`<time class="article-date" datetime="${post.date}">`),
    );
    assert.match(html, new RegExp(escapeRegex(post.category)));
  }
});

test("Blog HTML and metadata are the only article content sources", () => {
  assert.equal(existsSync(path.join(repoRoot, "public/tech")), false);
  assert.equal(existsSync(path.join(repoRoot, "prisma/schema.prisma")), false);
  assert.equal(existsSync(path.join(repoRoot, "src/app/admin")), false);
  assert.equal(existsSync(path.join(repoRoot, "src/app/api")), false);
});

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
