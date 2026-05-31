import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { isAdminHostRequest } from "@/lib/adminHost";
import {
  assertImageSignature,
  getSafeUploadMetadata,
} from "@/lib/uploadValidation";

export async function POST(request: NextRequest) {
  if (!isAdminHostRequest(request)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未提供檔案" }, { status: 400 });
    }

    const metadata = getSafeUploadMetadata(file);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    assertImageSignature(buffer, metadata.contentType);

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${metadata.extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "上傳失敗";
    const status = message === "上傳失敗" ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
