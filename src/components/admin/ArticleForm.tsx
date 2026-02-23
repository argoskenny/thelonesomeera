"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Upload, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { slugify } from "@/lib/utils";

type ArticleData = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  published: boolean;
};

export default function ArticleForm({
  initial,
}: {
  initial?: ArticleData;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<ArticleData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    category: initial?.category ?? "",
    coverImage: initial?.coverImage ?? "",
    published: initial?.published ?? false,
  });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // AI 生成相關狀態
  const [aiTopic, setAiTopic] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiModel, setAiModel] = useState("deepseek/deepseek-r1-0528:free");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  function updateField(field: keyof ArticleData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function autoSlug() {
    if (!form.slug && form.title) {
      updateField("slug", slugify(form.title));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      updateField("coverImage", url);
    }
  }

  async function handleAIGenerate() {
    if (!aiTopic.trim()) {
      setAiError("請輸入文章主題");
      return;
    }

    setAiError("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/admin/ai/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, context: aiContext, model: aiModel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || "AI 生成失敗");
        return;
      }

      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        slug: data.slug || prev.slug,
        category: data.category || prev.category,
        excerpt: data.excerpt || prev.excerpt,
        content: data.content || prev.content,
        coverImage: data.coverImage || prev.coverImage,
      }));

      if (data.imageError) {
        setAiError(`文章已生成，但封面圖片失敗：${data.imageError}`);
      }
    } catch {
      setAiError("網路錯誤，無法連線 AI 服務");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = isEdit ? `/api/articles/${initial!.id}` : "/api/articles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "儲存失敗");
        return;
      }

      router.push("/admin/articles");
      router.refresh();
    } catch {
      setError("網路錯誤");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <form onSubmit={handleSubmit}>
      {/* AI 協助撰寫區塊 */}
      <div className="mb-6 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-semibold text-indigo-800">
            AI 協助撰寫
          </h3>
        </div>

        {aiError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {aiError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-indigo-700">
              主題（必填）
            </label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className={inputClass}
              placeholder="例：Next.js 14 App Router 完整教學"
              disabled={aiLoading}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-indigo-700">
              補充上下文（選填）
            </label>
            <textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              rows={3}
              className={inputClass + " resize-none"}
              placeholder="例：面向初學者、包含實作範例、需要附上程式碼範例..."
              disabled={aiLoading}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-indigo-700">
            AI 模型
          </label>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            disabled={aiLoading}
            className={inputClass}
          >
            <optgroup label="免費模型">
              <option value="arcee-ai/trinity-large-preview:free">Trinity Large (Free)</option>
              <option value="stepfun/step-3.5-flash:free">Step 3.5 Flash (Free)</option>
              <option value="z-ai/glm-4.5-air:free">GLM-4.5 Air (Free)</option>
              <option value="deepseek/deepseek-r1-0528:free">DeepSeek R1 (Free)</option>
              <option value="nvidia/nemotron-3-nano-30b-a3b:free">Nemotron 3 Nano (Free)</option>
            </optgroup>
            <optgroup label="付費模型">
              <option value="minimax/minimax-m2.5">MiniMax M2.5</option>
              <option value="moonshotai/kimi-k2.5">Kimi K2.5</option>
              <option value="google/gemini-3-flash-preview">Gemini 3 Flash</option>
              <option value="z-ai/glm-5">GLM-5</option>
            </optgroup>
          </select>
        </div>

        <button
          type="button"
          onClick={handleAIGenerate}
          disabled={aiLoading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {aiLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 生成中…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI 產生文章
            </>
          )}
        </button>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* 標題與 slug */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              標題
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              onBlur={autoSlug}
              className={inputClass}
              placeholder="文章標題"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Slug (URL)
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              className={inputClass}
              placeholder="article-url-slug"
              required
            />
          </div>
        </div>

        {/* 分類與封面 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              分類
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className={inputClass}
              placeholder="例：前端開發、Vue.js"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              封面圖片
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.coverImage}
                onChange={(e) => updateField("coverImage", e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="/uploads/image.png"
              />
              <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 摘要 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            摘要
          </label>
          <textarea
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            placeholder="文章摘要..."
            required
          />
        </div>

        {/* Markdown 編輯器 */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              內容（Markdown）
            </label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-blue-600"
            >
              <Eye className="h-3.5 w-3.5" />
              {preview ? "編輯" : "預覽"}
            </button>
          </div>
          <div className={preview ? "grid gap-4 md:grid-cols-2" : ""}>
            <textarea
              value={form.content}
              onChange={(e) => updateField("content", e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y font-mono"
              placeholder="以 Markdown 撰寫文章內容..."
              required
            />
            {preview && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 overflow-y-auto max-h-[520px] prose prose-sm prose-slate max-w-none">
                <MarkdownContent content={form.content} />
              </div>
            )}
          </div>
        </div>

        {/* 封面圖片預覽 */}
        {form.coverImage && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-medium text-slate-700">
              封面圖片預覽
            </h4>
            <img
              src={form.coverImage}
              alt="封面圖片預覽"
              className="max-h-64 rounded-lg border border-slate-200 object-cover"
            />
          </div>
        )}
      </div>

      {/* 發佈與儲存 */}
      <div className="mt-6 flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => updateField("published", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">發佈文章</span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "儲存中..." : "儲存"}
        </button>
      </div>
    </form>
  );
}
