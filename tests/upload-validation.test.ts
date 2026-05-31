import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MAX_IMAGE_BYTES,
  assertImageSignature,
  getSafeUploadMetadata,
  isPrivateIpAddress,
  parseSafeRemoteImageUrl,
} from "../src/lib/uploadValidation";

test("accepts PNG uploads with a safe generated extension", () => {
  assert.deepEqual(
    getSafeUploadMetadata({
      name: "cover.PNG",
      type: "image/png",
      size: 1024,
    }),
    {
      contentType: "image/png",
      extension: ".png",
    },
  );
});

test("rejects SVG uploads even when they are images", () => {
  assert.throws(
    () =>
      getSafeUploadMetadata({
        name: "cover.svg",
        type: "image/svg+xml",
        size: 1024,
      }),
    /不支援的圖片格式/,
  );
});

test("rejects oversized image uploads", () => {
  assert.throws(
    () =>
      getSafeUploadMetadata({
        name: "cover.png",
        type: "image/png",
        size: MAX_IMAGE_BYTES + 1,
      }),
    /圖片不可超過/,
  );
});

test("rejects files whose bytes do not match the declared image type", () => {
  assert.throws(
    () => assertImageSignature(Buffer.from("<script></script>"), "image/png"),
    /圖片內容與格式不符/,
  );
});

test("rejects remote image URLs that target local or private networks", () => {
  assert.throws(() => parseSafeRemoteImageUrl("file:///tmp/a.png"), /圖片 URL/);
  assert.throws(() => parseSafeRemoteImageUrl("http://localhost/a.png"), /圖片 URL/);
  assert.ok(isPrivateIpAddress("127.0.0.1"));
  assert.ok(isPrivateIpAddress("10.0.0.5"));
  assert.ok(isPrivateIpAddress("172.20.0.5"));
  assert.ok(isPrivateIpAddress("192.168.1.5"));
  assert.equal(parseSafeRemoteImageUrl("https://example.com/a.png").hostname, "example.com");
});
