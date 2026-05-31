import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  MAX_IMAGE_BYTES,
  assertImageSignature,
  assertPublicRemoteImageTarget,
  getImageExtension,
  parseSafeRemoteImageUrl,
} from "@/lib/uploadValidation";

function safeFilenamePart(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "article"
  );
}

/**
 * 從遠端 URL 下載圖片並儲存至 public/uploads/articles/
 * 回傳可供前端使用的相對路徑
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  slug: string
): Promise<string> {
  const parsedUrl = parseSafeRemoteImageUrl(imageUrl);
  await assertPublicRemoteImageTarget(parsedUrl);

  const res = await fetch(parsedUrl, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`下載圖片失敗 (${res.status})`);
  }

  const contentType = res.headers.get("content-type");
  const extension = getImageExtension(contentType ?? "");
  if (!contentType || !extension) {
    throw new Error("下載圖片格式不支援");
  }

  const contentLength = Number(res.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new Error(`圖片不可超過 ${MAX_IMAGE_BYTES / 1024 / 1024}MB`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`圖片不可超過 ${MAX_IMAGE_BYTES / 1024 / 1024}MB`);
  }
  assertImageSignature(buffer, contentType);

  const timestamp = Date.now();
  const filename = `${safeFilenamePart(slug)}-${timestamp}${extension}`;

  const dir = path.join(process.cwd(), "public", "uploads", "articles");
  await mkdir(dir, { recursive: true });

  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/articles/${filename}`;
}
