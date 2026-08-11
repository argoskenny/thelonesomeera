import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { blogPosts, getBlogHref } from "../src/data/blog-posts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("every Blog metadata entry resolves to a standalone HTML article", () => {
  assert.equal(blogPosts.length, 6);

  for (const post of blogPosts) {
    const relativePath = `public${getBlogHref(post.slug)}`;
    const absolutePath = path.join(repoRoot, relativePath);

    assert.equal(existsSync(absolutePath), true, `${relativePath} should exist`);

    const html = readFileSync(absolutePath, "utf8");
    assert.match(html, /<html lang="zh-Hant">/);
    assert.match(html, /<link rel="stylesheet" href="\/blog\/article\.css">/);
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
