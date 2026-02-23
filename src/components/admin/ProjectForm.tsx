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
    <form onSubmit={handleSubmit}>
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* 標題與連結 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              作品名稱
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="作品名稱"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              連結
            </label>
            <input
              type="text"
              value={form.link}
              onChange={(e) => updateField("link", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="/hellrider/index.html"
              required
            />
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            描述
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            placeholder="作品描述..."
            required
          />
        </div>

        {/* 圖片與排序 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              預覽圖片
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.image}
                onChange={(e) => updateField("image", e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="/uploads/image.png"
                required
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              排序（數字越小越前面）
            </label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => updateField("sortOrder", Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* 標籤 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            標籤
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-500 transition-colors"
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
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="輸入標籤後按 Enter"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 精選與儲存 */}
      <div className="mt-6 flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => updateField("featured", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">設為精選</span>
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
