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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 標題與 slug */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-muted">
            標題
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            onBlur={autoSlug}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
            placeholder="文章標題"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-muted">
            Slug (URL)
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
            placeholder="article-url-slug"
            required
          />
        </div>
      </div>

      {/* 分類與封面 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-muted">
            分類
          </label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
            placeholder="例：前端開發、Vue.js"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-muted">
            封面圖片
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => updateField("coverImage", e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
              placeholder="/uploads/image.png"
            />
            <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 px-3 py-2.5 text-text-muted transition-colors hover:border-primary hover:text-primary">
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
        <label className="mb-1.5 block font-mono text-xs text-text-muted">
          摘要
        </label>
        <textarea
          value={form.excerpt}
          onChange={(e) => updateField("excerpt", e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none resize-none"
          placeholder="文章摘要..."
          required
        />
      </div>

      {/* Markdown 編輯器（split view） */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="font-mono text-xs text-text-muted">
            內容（Markdown）
          </label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-1 font-mono text-xs text-text-muted transition-colors hover:text-primary"
          >
            <Eye className="h-3 w-3" />
            {preview ? "編輯" : "預覽"}
          </button>
        </div>
        <div className={preview ? "grid gap-4 md:grid-cols-2" : ""}>
          <textarea
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
            rows={20}
            className={`w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none resize-y ${
              preview ? "" : ""
            }`}
            placeholder="以 Markdown 撰寫文章內容..."
            required
          />
          {preview && (
            <div className="rounded-lg border border-slate-700/50 bg-card/50 p-4 overflow-y-auto max-h-[520px]">
              <MarkdownContent content={form.content} />
            </div>
          )}
        </div>
      </div>

      {/* 發佈與儲存 */}
      <div className="flex items-center justify-between border-t border-slate-800/50 pt-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => updateField("published", e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
          />
          <span className="font-mono text-sm text-text-muted">發佈文章</span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "儲存中..." : "儲存"}
        </button>
      </div>
    </form>
  );
}
