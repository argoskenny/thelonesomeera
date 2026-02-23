import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateArticle } from "@/lib/services/AIArticleService";
import {
  generateImage,
  buildImagePrompt,
} from "@/lib/services/AIImageService";
import { downloadAndSaveImage } from "@/lib/helpers/imageStorage";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/ai/generate-article
 * 整合文章生成、圖片生成、圖片下載的一站式 API
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body: { topic?: string; context?: string; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求格式" }, { status: 400 });
  }

  if (!body.topic?.trim()) {
    return NextResponse.json({ error: "請提供文章主題" }, { status: 400 });
  }

  // Step 1：呼叫 OpenRouter LLM 產生文章
  let article;
  try {
    article = await generateArticle({
      topic: body.topic,
      context: body.context,
      model: body.model,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "文章生成失敗";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // slug 去重：若已存在則自動加數字後綴
  let finalSlug = article.slug;
  let suffix = 1;
  while (await prisma.article.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${article.slug}-${suffix++}`;
  }
  article.slug = finalSlug;

  // Step 2：產生圖片提示詞 → 呼叫圖片 API → 下載儲存
  let coverImage = "";
  let imageError = "";
  try {
    const prompt = buildImagePrompt(article);
    const { image_url } = await generateImage({ prompt });
    coverImage = await downloadAndSaveImage(image_url, article.slug);
  } catch (err) {
    imageError =
      err instanceof Error ? err.message : "封面圖片生成失敗";
  }

  return NextResponse.json({
    ...article,
    coverImage,
    imageError: imageError || undefined,
  });
}
