"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteButton({
  id,
  type,
  name,
}: {
  id: number;
  type: "articles" | "projects";
  name: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`確定要刪除「${name}」嗎？此操作無法復原。`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/${type}/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 cursor-pointer"
      title="刪除"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
