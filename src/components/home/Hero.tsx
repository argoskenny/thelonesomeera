"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
      {/* 背景裝飾：漸層光暈 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-syntax-purple/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl text-center">
        {/* 小標籤 */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-card/50 px-4 py-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-syntax-green animate-pulse" />
          <span className="font-mono text-text-muted">
            <span className="text-syntax-green">const</span>{" "}
            <span className="text-syntax-yellow">era</span>{" "}
            <span className="text-text-muted">=</span>{" "}
            <span className="text-syntax-orange">&quot;lonesome&quot;</span>
          </span>
        </div>

        {/* 主標題 */}
        <h1 className="mb-6 font-mono text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          <span className="text-text-main">The </span>
          <span className="gradient-text">Lonesome</span>
          <br />
          <span className="text-text-main">Era</span>
        </h1>

        {/* 副標題 */}
        <p className="mx-auto mb-4 max-w-2xl text-lg leading-relaxed text-text-muted md:text-xl">
          一個屬於創作者與思考者的技術角落
        </p>
        <p className="mx-auto mb-10 max-w-xl text-sm leading-relaxed text-text-muted/70">
          在充滿喧囂與快速變動的科技時代，我們選擇站在一個略為孤寂卻清晰的位置，靜靜觀察、深入探索。
        </p>

        {/* CTA 按鈕組 */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-mono text-sm font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
          >
            探索作品
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 font-mono text-sm font-semibold text-text-muted transition-all hover:border-primary/50 hover:text-text-main"
          >
            閱讀文章
          </Link>
        </div>
      </div>

      {/* 向下捲動提示 */}
      <div className="absolute bottom-8 animate-bounce text-text-muted/40">
        <ChevronDown className="h-6 w-6" />
      </div>
    </section>
  );
}
