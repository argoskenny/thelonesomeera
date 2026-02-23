import OpenAI from "openai";

export type AIArticleRequest = {
  topic: string;
  context?: string;
  model?: string;
};

export type AIArticleResponse = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
};

/** 可選模型清單（前端同步使用） */
export const AI_MODELS = {
  paid: [
    { id: "minimax/minimax-m2.5", label: "MiniMax M2.5" },
    { id: "moonshotai/kimi-k2.5", label: "Kimi K2.5" },
    { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
    { id: "z-ai/glm-5", label: "GLM-5" },
  ],
  free: [
    { id: "arcee-ai/trinity-large-preview:free", label: "Trinity Large (Free)" },
    { id: "stepfun/step-3.5-flash:free", label: "Step 3.5 Flash (Free)" },
    { id: "z-ai/glm-4.5-air:free", label: "GLM-4.5 Air (Free)" },
    { id: "deepseek/deepseek-r1-0528:free", label: "DeepSeek R1 (Free)" },
    { id: "nvidia/nemotron-3-nano-30b-a3b:free", label: "Nemotron 3 Nano (Free)" },
  ],
} as const;

const DEFAULT_MODEL = "deepseek/deepseek-r1-0528:free";

function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY 尚未設定，請檢查 .env");
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
}

/**
 * 透過 OpenRouter 呼叫 LLM 產生文章，回傳固定 JSON 結構
 */
export async function generateArticle(
  input: AIArticleRequest
): Promise<AIArticleResponse> {
  const client = getClient();
  const model = input.model || DEFAULT_MODEL;

  const systemPrompt = [
    "你是一位專業的部落格文章撰寫者。",
    "根據使用者提供的主題與上下文，撰寫一篇完整的繁體中文 Markdown 文章。",
    "你必須僅回傳以下 JSON，不可包含任何其他文字或說明：",
    '{"title":"","slug":"","category":"","excerpt":"","content":""}',
    "其中：",
    "- title：文章標題",
    "- slug：英文 URL slug（小寫、連字號分隔）",
    "- category：文章分類",
    "- excerpt：100 字以內的文章摘要",
    "- content：完整 Markdown 格式的文章內容（至少 800 字）",
    "僅回傳合法 JSON，不要加 ```json 或任何 Markdown 標記。",
  ].join("\n");

  const userMessage = input.context
    ? `主題：${input.topic}\n補充說明：${input.context}`
    : `主題：${input.topic}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("AI 未回傳任何內容");
  }

  // 嘗試從回傳內容中擷取 JSON（容忍包裹在 ```json ``` 中的情況）
  const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

  let data: AIArticleResponse;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error("AI 回傳的內容無法解析為 JSON");
  }

  if (!data.title || !data.slug || !data.content) {
    throw new Error("AI 回傳的文章格式不完整，缺少必要欄位");
  }

  return data;
}
