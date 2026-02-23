import { Code2, Gamepad2, Smartphone, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "關於 | The Lonesome Era",
  description: "關於 The Lonesome Era — 一個屬於創作者與思考者的技術角落",
};

const beliefs = [
  {
    icon: Code2,
    title: "程式即創作",
    description: "每一行程式碼都是一次思考的體現，我們追求優雅與效能的平衡。",
    color: "text-syntax-blue",
  },
  {
    icon: Gamepad2,
    title: "遊戲即探索",
    description:
      "從 2D Canvas 到 3D Three.js，在遊戲開發中探索前端技術的無限可能。",
    color: "text-syntax-green",
  },
  {
    icon: Smartphone,
    title: "行動即體驗",
    description: "以 SwiftUI 打造原生體驗，讓每一次觸控互動都自然流暢。",
    color: "text-syntax-orange",
  },
  {
    icon: Globe,
    title: "開放即共享",
    description: "將開發中的經驗化為文字，與社群分享每一次技術探索的成果。",
    color: "text-syntax-purple",
  },
];

export default function AboutPage() {
  return (
    <main className="px-6 pt-28 pb-20">
      <div className="mx-auto max-w-4xl">
        {/* 頁面標題 */}
        <div className="mb-16">
          <p className="mb-2 font-mono text-sm text-syntax-purple">
            {"// 關於我們"}
          </p>
          <h1 className="mb-4 font-mono text-4xl font-bold text-text-main md:text-5xl">
            About
          </h1>
        </div>

        {/* 介紹文字 */}
        <div className="mb-16 max-w-2xl">
          <p className="mb-4 text-lg leading-relaxed text-text-muted">
            <span className="text-text-main font-semibold">The Lonesome Era</span>{" "}
            是一個屬於開發者、設計者、與每一位熱愛科技的人們的空間。
          </p>
          <p className="text-text-muted leading-relaxed">
            在這個充滿喧囂與快速變動的科技時代，我們選擇站在一個略為孤寂卻清晰的位置，靜靜觀察、深入探索。透過作品與文章，記錄每一次技術旅程中的發現與思考。
          </p>
        </div>

        {/* 信念卡片 */}
        <div className="grid gap-6 md:grid-cols-2">
          {beliefs.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="glow-card">
                <Icon className={`mb-4 h-8 w-8 ${item.color}`} />
                <h3 className="mb-2 font-mono text-lg font-semibold text-text-main">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* 技術棧 */}
        <div className="mt-16 rounded-xl border border-slate-700/50 bg-card/50 p-8">
          <h2 className="mb-6 font-mono text-xl font-bold text-text-main">
            {"// 常用技術棧"}
          </h2>
          <div className="code-window">
            <div className="code-window-header">
              <div className="code-window-dot bg-red-500" />
              <div className="code-window-dot bg-yellow-500" />
              <div className="code-window-dot bg-green-500" />
              <span className="ml-3 font-mono text-xs text-text-muted">
                tech-stack.json
              </span>
            </div>
            <pre className="p-6 font-mono text-sm leading-7">
              <code>
                <span className="text-text-muted">{"{"}</span>{"\n"}
                {"  "}<span className="text-syntax-blue">&quot;frontend&quot;</span><span className="text-text-muted">: [</span>
                <span className="text-syntax-orange">&quot;Vue 3&quot;</span><span className="text-text-muted">, </span>
                <span className="text-syntax-orange">&quot;React&quot;</span><span className="text-text-muted">, </span>
                <span className="text-syntax-orange">&quot;Next.js&quot;</span><span className="text-text-muted">, </span>
                <span className="text-syntax-orange">&quot;Tailwind CSS&quot;</span>
                <span className="text-text-muted">],</span>{"\n"}
                {"  "}<span className="text-syntax-blue">&quot;3d_game&quot;</span><span className="text-text-muted">: [</span>
                <span className="text-syntax-orange">&quot;Three.js&quot;</span><span className="text-text-muted">, </span>
                <span className="text-syntax-orange">&quot;PixiJS&quot;</span><span className="text-text-muted">, </span>
                <span className="text-syntax-orange">&quot;Canvas 2D&quot;</span>
                <span className="text-text-muted">],</span>{"\n"}
                {"  "}<span className="text-syntax-blue">&quot;mobile&quot;</span><span className="text-text-muted">: [</span>
                <span className="text-syntax-orange">&quot;SwiftUI&quot;</span><span className="text-text-muted">, </span>
                <span className="text-syntax-orange">&quot;iOS Development&quot;</span>
                <span className="text-text-muted">],</span>{"\n"}
                {"  "}<span className="text-syntax-blue">&quot;backend&quot;</span><span className="text-text-muted">: [</span>
                <span className="text-syntax-orange">&quot;Node.js&quot;</span><span className="text-text-muted">, </span>
                <span className="text-syntax-orange">&quot;Prisma&quot;</span><span className="text-text-muted">, </span>
                <span className="text-syntax-orange">&quot;SQLite&quot;</span>
                <span className="text-text-muted">]</span>{"\n"}
                <span className="text-text-muted">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
