"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Upload, AlertCircle } from "lucide-react";
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

  return (
    <form onSubmit={handleSubmit}>
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
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
