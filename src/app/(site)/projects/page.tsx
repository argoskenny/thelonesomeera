import { projects } from "@/lib/projects";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "作品分享 | The Lonesome Era",
  description: "Web / App 作品展示 — 遊戲、應用程式與技術 Demo",
};

export default function ProjectsPage() {
  return (
    <main className="px-6 pt-28 pb-20">
      <div className="mx-auto max-w-6xl">
        {/* 頁面標題 */}
        <div className="mb-16">
          <p className="mb-2 font-mono text-sm text-syntax-green">
            {"// 作品展示"}
          </p>
          <h1 className="mb-4 font-mono text-4xl font-bold text-text-main md:text-5xl">
            Projects
          </h1>
          <p className="max-w-xl text-text-muted">
            從 Web 遊戲到 AI 應用，每個專案都是一次技術探索的旅程。
          </p>
        </div>

        {/* 作品列表 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            return (
              <a
                key={project.title}
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="glow-card group block"
              >
                {/* 圖片預覽 */}
                <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* 內容 */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-mono text-lg font-semibold text-text-main group-hover:text-primary transition-colors">
                    {project.title}
                  </h2>
                  <ExternalLink className="mt-1 h-4 w-4 flex-shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-muted line-clamp-2">
                  {project.description}
                </p>

                {/* 標籤 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
