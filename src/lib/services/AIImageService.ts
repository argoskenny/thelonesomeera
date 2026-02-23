export type AIImageRequest = {
  prompt: string;
};

export type AIImageResponse = {
  image_url: string;
};

/**
 * 依據提示詞呼叫外部 AI 圖片生成 API
 */
export async function generateImage(
  input: AIImageRequest
): Promise<AIImageResponse> {
  const apiKey = process.env.AI_IMAGE_API_KEY;
  const apiUrl = process.env.AI_IMAGE_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error("AI 圖片 API 尚未設定，請檢查 .env 中的 AI_IMAGE_API_KEY 與 AI_IMAGE_API_URL");
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: input.prompt }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`圖片生成 API 回傳錯誤 (${res.status}): ${text}`);
  }

  const data: AIImageResponse = await res.json();

  if (!data.image_url) {
    throw new Error("AI 回傳的圖片資料缺少 image_url");
  }

  return data;
}

/**
 * 根據文章內容組合圖片提示詞
 */
export function buildImagePrompt(article: {
  title: string;
  category: string;
  excerpt: string;
}): string {
  const excerptSnippet = article.excerpt.slice(0, 200);
  return [
    "Create a high-quality blog cover image.",
    `Topic: ${article.title}`,
    `Category: ${article.category}`,
    "Style: modern, clean, professional",
    `Based on: ${excerptSnippet}`,
  ].join("\n");
}
