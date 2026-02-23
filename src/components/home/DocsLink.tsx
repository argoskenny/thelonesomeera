import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export default function DocsLink() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="glow-card text-center">
          <BookOpen className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="mb-3 font-mono text-2xl font-bold text-text-main">
            技術文章 & 開發日誌
          </h2>
          <p className="mb-6 text-text-muted">
            深入前端開發、遊戲製作與效能優化的實戰心得，從 Vue.js 到 Three.js 的技術探索之旅。
          </p>
          <Link
            href="/articles"
            className="group inline-flex items-center gap-2 font-mono text-sm font-semibold text-primary transition-colors hover:text-syntax-green"
          >
            瀏覽所有文章
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
