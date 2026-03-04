import Link from "next/link";
import { Terminal, Github, Rss } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* 品牌 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="h-5 w-5 text-primary" />
              <span className="font-mono font-bold text-text-main">
                The Lonesome Era
              </span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              一個屬於創作者與思考者的技術角落
            </p>
          </div>

          {/* 連結 */}
          <div>
            <h3 className="mb-4 font-mono text-sm font-semibold text-text-main">
              {"// 導航"}
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/projects", label: "作品" },
                { href: "/articles", label: "文章" },
                { href: "/about", label: "關於" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 子專案 */}
          <div>
            <h3 className="mb-4 font-mono text-sm font-semibold text-text-main">
              {"// 精選專案"}
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/hellrider/index.html", label: "Hell Rider" },
                { href: "/sox/index.html", label: "Sox FPS" },
                { href: "/ai-hub", label: "AI Demo Hub" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-muted transition-colors hover:text-syntax-green"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800/50 pt-8 md:flex-row">
          <p className="font-mono text-xs text-text-muted">
            &copy; {new Date().getFullYear()} The Lonesome Era. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="/rss.xml" className="text-text-muted transition-colors hover:text-primary" aria-label="RSS">
              <Rss className="h-4 w-4" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-text-muted transition-colors hover:text-primary" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
