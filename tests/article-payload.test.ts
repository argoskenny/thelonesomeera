import assert from "node:assert/strict";
import { test } from "node:test";

import { parseArticlePayload } from "../src/lib/articlePayload";

const validPayload = {
  title: "Valid title",
  slug: "valid-title",
  excerpt: "A short excerpt",
  content: "Article content",
  category: "Tech",
  coverImage: "/uploads/cover.png",
  published: true,
};

test("parses the exact article fields accepted by the admin form", () => {
  assert.deepEqual(parseArticlePayload(validPayload), validPayload);
});

test("rejects mass-assignment fields", () => {
  assert.throws(
    () =>
      parseArticlePayload({
        ...validPayload,
        id: 999,
      }),
    /不支援的欄位/,
  );
});

test("rejects invalid slugs", () => {
  assert.throws(
    () =>
      parseArticlePayload({
        ...validPayload,
        slug: "../draft-article",
      }),
    /Slug 格式不正確/,
  );
});

test("rejects active cover image URLs", () => {
  assert.throws(
    () =>
      parseArticlePayload({
        ...validPayload,
        coverImage: "javascript:alert(1)",
      }),
    /封面圖片路徑不正確/,
  );
});
