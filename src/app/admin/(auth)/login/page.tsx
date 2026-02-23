"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal, Lock, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "登入失敗");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* 標題 */}
        <div className="mb-8 text-center">
          <Terminal className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="font-mono text-2xl font-bold text-text-main">
            Admin Login
          </h1>
          <p className="mt-2 font-mono text-sm text-text-muted">
            {"// 後台管理系統"}
          </p>
        </div>

        {/* 登入表單 */}
        <form onSubmit={handleSubmit}>
          <div className="code-window">
            <div className="code-window-header">
              <div className="code-window-dot bg-red-500" />
              <div className="code-window-dot bg-yellow-500" />
              <div className="code-window-dot bg-green-500" />
              <span className="ml-3 font-mono text-xs text-text-muted">
                auth.ts
              </span>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="mb-2 block font-mono text-xs text-text-muted">
                  <Lock className="mr-1 inline-block h-3 w-3" />
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 font-mono text-sm text-text-main placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 font-mono text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "驗證中..." : "登入"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
