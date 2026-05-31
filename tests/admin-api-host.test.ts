import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { POST as postArticle } from "../src/app/api/articles/route";
import {
  DELETE as deleteArticle,
  PUT as putArticle,
} from "../src/app/api/articles/[id]/route";
import { POST as postAiArticle } from "../src/app/api/admin/ai/generate-article/route";
import { POST as postUpload } from "../src/app/api/upload/route";

const originalAdminHostname = process.env.ADMIN_HOSTNAME;

afterEach(() => {
  if (originalAdminHostname === undefined) {
    delete process.env.ADMIN_HOSTNAME;
  } else {
    process.env.ADMIN_HOSTNAME = originalAdminHostname;
  }
});

function publicHostRequest(pathname: string, init?: RequestInit) {
  return new Request(`https://thelonesomeera.com${pathname}`, {
    ...init,
    headers: {
      host: "thelonesomeera.com",
      ...(init?.headers as Record<string, string> | undefined),
    },
  }) as never;
}

test("admin write APIs return 404 outside the configured admin hostname", async () => {
  process.env.ADMIN_HOSTNAME = "admin.thelonesomeera.com";

  const articlePostResponse = await postArticle(
    publicHostRequest("/api/articles", { method: "POST" }),
  );
  const articlePutResponse = await putArticle(
    publicHostRequest("/api/articles/1", { method: "PUT" }),
    { params: Promise.resolve({ id: "1" }) },
  );
  const articleDeleteResponse = await deleteArticle(
    publicHostRequest("/api/articles/1", { method: "DELETE" }),
    { params: Promise.resolve({ id: "1" }) },
  );
  const uploadResponse = await postUpload(
    publicHostRequest("/api/upload", { method: "POST" }),
  );
  const aiResponse = await postAiArticle(
    publicHostRequest("/api/admin/ai/generate-article", { method: "POST" }),
  );

  assert.equal(articlePostResponse.status, 404);
  assert.equal(articlePutResponse.status, 404);
  assert.equal(articleDeleteResponse.status, 404);
  assert.equal(uploadResponse.status, 404);
  assert.equal(aiResponse.status, 404);
});
