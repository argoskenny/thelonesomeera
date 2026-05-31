import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

type ArticlesRoute = typeof import("../src/app/api/articles/route");
type ArticleByIdRoute = typeof import("../src/app/api/articles/[id]/route");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbDir = mkdtempSync(path.join(os.tmpdir(), "thelonesomeera-articles-"));
const originalDatabaseUrl = process.env.DATABASE_URL;

let prisma: PrismaClient;
let articlesRoute: ArticlesRoute;
let articleByIdRoute: ArticleByIdRoute;
let publishedArticleId: number;
let draftArticleId: number;

before(async () => {
  const dbPath = path.join(dbDir, "test.db");
  process.env.DATABASE_URL = `file:${dbPath}`;

  execFileSync(
    "sqlite3",
    [
      dbPath,
      `
        CREATE TABLE "Article" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "title" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "excerpt" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "coverImage" TEXT,
          "published" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        );
        CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
      `,
    ],
    { cwd: repoRoot },
  );

  prisma = new PrismaClient();
  const publishedArticle = await prisma.article.create({
    data: {
      title: "Published Article",
      slug: "published-article",
      excerpt: "Visible article",
      content: "Published content",
      category: "Test",
      published: true,
    },
  });
  const draftArticle = await prisma.article.create({
    data: {
      title: "Draft Article",
      slug: "draft-article",
      excerpt: "Hidden article",
      content: "Draft content",
      category: "Test",
      published: false,
    },
  });

  publishedArticleId = publishedArticle.id;
  draftArticleId = draftArticle.id;
  articlesRoute = await import("../src/app/api/articles/route");
  articleByIdRoute = await import("../src/app/api/articles/[id]/route");
});

after(async () => {
  await prisma?.$disconnect();

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }

  rmSync(dbDir, { recursive: true, force: true });
});

test("public article list API returns only published articles", async () => {
  const response = await articlesRoute.GET();
  const articles = await response.json();

  assert.deepEqual(
    articles.map((article: { slug: string }) => article.slug),
    ["published-article"],
  );
});

test("public article detail API does not expose draft articles", async () => {
  const publishedResponse = await articleByIdRoute.GET({} as never, {
    params: Promise.resolve({ id: String(publishedArticleId) }),
  });
  assert.equal(publishedResponse.status, 200);

  const draftResponse = await articleByIdRoute.GET({} as never, {
    params: Promise.resolve({ id: String(draftArticleId) }),
  });
  assert.equal(draftResponse.status, 404);
});
