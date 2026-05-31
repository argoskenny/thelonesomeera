const ALLOWED_FIELDS = new Set([
  "title",
  "slug",
  "excerpt",
  "content",
  "category",
  "coverImage",
  "published",
]);

const FIELD_LABELS: Record<string, string> = {
  title: "標題",
  slug: "Slug",
  excerpt: "摘要",
  content: "內容",
  category: "分類",
};

export type ArticlePayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  published: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequiredString(
  payload: Record<string, unknown>,
  field: keyof Omit<ArticlePayload, "coverImage" | "published">,
) {
  const value = payload[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${FIELD_LABELS[field]}為必填欄位`);
  }

  return value.trim();
}

function parseCoverImage(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value !== "string") {
    throw new Error("封面圖片路徑不正確");
  }

  const trimmed = value.trim();
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  throw new Error("封面圖片路徑不正確");
}

export function parseArticlePayload(payload: unknown): ArticlePayload {
  if (!isRecord(payload)) {
    throw new Error("文章資料格式不正確");
  }

  const unsupportedField = Object.keys(payload).find(
    (field) => !ALLOWED_FIELDS.has(field),
  );
  if (unsupportedField) {
    throw new Error(`不支援的欄位: ${unsupportedField}`);
  }

  const slug = parseRequiredString(payload, "slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug 格式不正確");
  }

  if (typeof payload.published !== "boolean") {
    throw new Error("發佈狀態格式不正確");
  }

  return {
    title: parseRequiredString(payload, "title"),
    slug,
    excerpt: parseRequiredString(payload, "excerpt"),
    content: parseRequiredString(payload, "content"),
    category: parseRequiredString(payload, "category"),
    coverImage: parseCoverImage(payload.coverImage),
    published: payload.published,
  };
}
