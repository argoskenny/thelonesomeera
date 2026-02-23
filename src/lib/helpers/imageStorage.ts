import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * 從遠端 URL 下載圖片並儲存至 public/uploads/articles/
 * 回傳可供前端使用的相對路徑
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  slug: string
): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`下載圖片失敗 (${res.status})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  const timestamp = Date.now();
  const filename = `${slug}-${timestamp}.jpg`;

  const dir = path.join(process.cwd(), "public", "uploads", "articles");
  await mkdir(dir, { recursive: true });

  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/articles/${filename}`;
}
