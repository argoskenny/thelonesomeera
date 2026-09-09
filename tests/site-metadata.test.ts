import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import { blogPosts, getBlogHref } from "../src/data/blog-posts";
import {
  createPageMetadata,
  SITE_ORIGIN,
} from "../src/lib/site-metadata";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("page metadata includes canonical, RSS, Open Graph, and Twitter data", () => {
  const metadata = createPageMetadata({
    title: "Demo",
    description: "Demo description",
    path: "/demo",
  });
  const twitter = metadata.twitter as { card?: string; title?: string };

  assert.equal(metadata.alternates?.canonical, "/demo");
  assert.equal(metadata.alternates?.types?.["application/rss+xml"], "/rss.xml");
  assert.equal(metadata.openGraph?.title, "Demo｜The Lonesome Era");
  assert.equal(metadata.openGraph?.description, "Demo description");
  assert.equal(metadata.openGraph?.url, "/demo");
  assert.equal(twitter.card, "summary_large_image");
  assert.equal(twitter.title, "Demo｜The Lonesome Era");
});

test("every app page declares its own canonical path", () => {
  const pages = [
    ["src/app/(site)/page.tsx", "/"],
    ["src/app/(site)/demo/page.tsx", "/demo"],
    ["src/app/(site)/blog/page.tsx", "/blog"],
    ["src/app/(site)/about/page.tsx", "/about"],
    ["src/app/(site)/demo/ai-hub/page.tsx", "/demo/ai-hub"],
  ];

  for (const [relativePath, canonicalPath] of pages) {
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
    assert.ok(
      source.includes(`path: "${canonicalPath}"`),
      `${relativePath} should declare ${canonicalPath}`,
    );
  }
});

test("sitemap lists all canonical app pages and standalone articles", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);
  const canonicalAppRoutes = [
    "/",
    "/demo",
    "/blog",
    "/about",
    "/demo/ai-hub",
  ];

  assert.equal(entries.length, canonicalAppRoutes.length + blogPosts.length);
  for (const route of canonicalAppRoutes) {
    const url = `${SITE_ORIGIN}${route}`;
    assert.ok(urls.includes(url), `sitemap should include ${url}`);
  }
  for (const post of blogPosts) {
    const url = `${SITE_ORIGIN}${getBlogHref(post.slug)}`;
    assert.ok(urls.includes(url), `sitemap should include ${url}`);
  }

  const article = entries.find((entry) =>
    entry.url.endsWith("/blog/selfie-cat-development.html"),
  );
  assert.equal(article?.lastModified, "2025-05-20");
});

test("robots allows the public site and advertises the sitemap", () => {
  const policy = robots();

  assert.deepEqual(policy.rules, { userAgent: "*", allow: "/" });
  assert.equal(policy.sitemap, `${SITE_ORIGIN}/sitemap.xml`);
  assert.equal(policy.host, SITE_ORIGIN);
});
