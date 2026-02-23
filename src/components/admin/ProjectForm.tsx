"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload, AlertCircle, X, Plus } from "lucide-react";

type ProjectData = {
  id?: number;
  title: string;
  description: string;
  image: string;
  link: string;
  tags: string;
  featured: boolean;
  sortOrder: number;
};

export default function ProjectForm({
  initial,
}: {
  initial?: ProjectData;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const parsedTags: string[] = initial?.tags
    ? JSON.parse(initial.tags)
    : [];

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? "",
    link: initial?.link ?? "",
    featured: initial?.featured ?? false,
    sortOrder: initial?.sortOrder ?? 0,
  });
  const [tags, setTags] = useState<string[]>(parsedTags);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      updateField("image", url);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = { ...form, tags: JSON.stringify(tags) };
      const url = isEdit ? `/api/projects/${initial!.id}` : "/api/projects";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "儲存失敗");
        return;
      }

      router.push("/admin/projects");
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

      {/* 標題與連結 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-muted">
            作品名稱
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
            placeholder="作品名稱"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-muted">
            連結
          </label>
          <input
            type="text"
            value={form.link}
            onChange={(e) => updateField("link", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
            placeholder="/hellrider/index.html"
            required
          />
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="mb-1.5 block font-mono text-xs text-text-muted">
          描述
        </label>
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none resize-none"
          placeholder="作品描述..."
          required
        />
      </div>

      {/* 圖片與排序 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-muted">
            預覽圖片
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.image}
              onChange={(e) => updateField("image", e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
              placeholder="/uploads/image.png"
              required
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
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-muted">
            排序（數字越小越前面）
          </label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => updateField("sortOrder", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* 標籤 */}
      <div>
        <label className="mb-1.5 block font-mono text-xs text-text-muted">
          標籤
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 font-mono text-xs text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none"
            placeholder="輸入標籤後按 Enter"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg border border-slate-700 px-3 py-2.5 text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 精選與儲存 */}
      <div className="flex items-center justify-between border-t border-slate-800/50 pt-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => updateField("featured", e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
          />
          <span className="font-mono text-sm text-text-muted">設為精選</span>
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
