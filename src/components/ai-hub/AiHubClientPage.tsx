"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { aiHubSections } from "@/lib/ai-hub-data";
import { cn } from "@/lib/utils";

type SectionKey = (typeof aiHubSections)[number]["key"];

const sectionKeys = aiHubSections.map((section) => section.key) as SectionKey[];

function isSectionKey(value: string): value is SectionKey {
  return sectionKeys.includes(value as SectionKey);
}

export default function AiHubClientPage() {
  const [activeKey, setActiveKey] = useState<SectionKey>(aiHubSections[0].key);
  const [copied, setCopied] = useState(false);

  const activeSection = useMemo(
    () => aiHubSections.find((section) => section.key === activeKey) ?? aiHubSections[0],
    [activeKey],
  );

  useEffect(() => {
    const initial = window.location.hash.replace("#", "");
    if (isSectionKey(initial)) {
      setActiveKey(initial);
    }

    const onHashChange = () => {
      const next = window.location.hash.replace("#", "");
      if (isSectionKey(next)) {
        setActiveKey(next);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setCopied(false);
  }, [activeKey]);

  const switchSection = (nextKey: SectionKey) => {
    setActiveKey(nextKey);
    window.history.replaceState(null, "", `#${nextKey}`);
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const openDemo = (link: string) => {
    if (window.innerWidth <= 768) {
      window.location.href = link;
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="px-6 pt-28 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-2 font-mono text-sm text-syntax-green">{"// AI 模型測試平台"}</p>
          <h1 className="mb-3 font-mono text-4xl font-bold text-text-main md:text-5xl">
            AI Demo Hub
          </h1>
          <p className="max-w-2xl text-text-muted">
            將歷史 demo 頁面整合進目前站點架構，保留原始子頁面內容與路徑，集中管理不同主題測試。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:h-[calc(100vh-9rem)]">
            <div className="rounded-xl border border-slate-700/50 bg-card/30 p-3 backdrop-blur">
              <p className="px-3 pb-2 font-mono text-xs text-text-muted">{"// 測試分類"}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                {aiHubSections.map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => switchSection(section.key)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left font-mono text-sm transition-all",
                      activeKey === section.key
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-transparent text-text-muted hover:border-slate-700/60 hover:bg-slate-800/60 hover:text-text-main",
                    )}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-6 rounded-xl border border-slate-700/50 bg-card/20 p-6">
              <h2 className="font-mono text-3xl font-semibold text-text-main">
                {activeSection.title}
              </h2>
              <p className="mt-2 text-text-muted">{activeSection.subtitle}</p>
            </div>

            {activeSection.prompt && (
              <div className="mb-6 rounded-xl border border-slate-700/50 bg-card/20 p-6">
                <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <h3 className="font-mono text-base font-semibold text-text-main">提示詞</h3>
                  <button
                    type="button"
                    onClick={() => copyPrompt(activeSection.prompt!)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs transition-colors",
                      copied
                        ? "border-syntax-green/50 bg-syntax-green/20 text-syntax-green"
                        : "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
                    )}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "已複製" : "複製提示詞"}
                  </button>
                </div>
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-700/50 bg-background/60 p-4 font-sans text-sm leading-relaxed text-text-muted">
                  {activeSection.prompt}
                </pre>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeSection.cards.map((card) => (
                <button
                  key={card.link}
                  type="button"
                  onClick={() => openDemo(card.link)}
                  className="glow-card group w-full text-left"
                >
                  <h3 className="font-mono text-lg font-semibold text-text-main transition-colors group-hover:text-primary">
                    {card.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                    {card.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-1 font-mono text-xs text-primary">
                    開啟 demo
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
