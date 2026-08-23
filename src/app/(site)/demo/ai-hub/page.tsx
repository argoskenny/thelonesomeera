import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { aiHubCollections, aiHubDemoCount } from "@/data/ai-hub-demos";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "AI Hub",
  description: "把相同題目交給不同 AI 模型，直接比較 32 個可開啟的介面、3D 與遊戲實驗。",
  path: "/demo/ai-hub",
  image: {
    path: "/images/ai-hub-card.png",
    width: 1672,
    height: 941,
    alt: "AI Hub 模型實驗室",
  },
});

export default function AiHubPage() {
  return (
    <main className="page-container ai-hub-page">
      <Link href="/demo" className="ai-hub-back">
        <ArrowLeft aria-hidden="true" />
        回到 Demo
      </Link>

      <header className="ai-hub-hero">
        <div className="ai-hub-hero__copy">
          <p className="ai-hub-kicker">AI HUB / MODEL LAB</p>
          <h1>
            同一個問題，
            <span>不只一種答案。</span>
          </h1>
          <p className="ai-hub-lead">
            這裡不是排行榜，而是一間開放的比較實驗室。把相同提示交給不同模型，
            直接看它們如何理解介面、空間、互動與遊戲。
          </p>
        </div>

        <dl className="ai-hub-stats" aria-label="AI Hub 內容統計">
          <div>
            <dt>系列</dt>
            <dd>{String(aiHubCollections.length).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>實驗</dt>
            <dd>{aiHubDemoCount}</dd>
          </div>
          <div>
            <dt>形式</dt>
            <dd>HTML</dd>
          </div>
        </dl>
      </header>

      <nav className="ai-hub-index" aria-label="AI Hub 實驗系列">
        <p>CHOOSE A SERIES</p>
        <ol>
          {aiHubCollections.map((collection) => (
            <li key={collection.id}>
              <a href={`#${collection.id}`}>
                <span>{collection.sequence}</span>
                {collection.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="ai-hub-collections">
        {aiHubCollections.map((collection) => (
          <section
            className="ai-hub-collection reveal-section"
            id={collection.id}
            key={collection.id}
          >
            <header className="ai-hub-collection__header">
              <div className="ai-hub-collection__number" aria-hidden="true">
                {collection.sequence}
              </div>
              <div>
                <p>{collection.subtitle}</p>
                <h2>{collection.title}</h2>
              </div>
              <p className="ai-hub-collection__description">
                {collection.description}
              </p>
            </header>

            {collection.prompt ? (
              <details className="ai-hub-prompt">
                <summary>
                  <span>PROMPT</span>
                  <span>查看完整內容</span>
                </summary>
                <pre>{collection.prompt}</pre>
              </details>
            ) : null}

            <div className="ai-hub-card-grid">
              {collection.demos.map((demo) => (
                <a
                  className="ai-hub-card"
                  href={demo.href}
                  target="_blank"
                  rel="noreferrer"
                  key={`${collection.id}-${demo.model}`}
                  aria-label={`${collection.title} — ${demo.model}（在新分頁開啟）`}
                >
                  <span className="ai-hub-card__status" aria-hidden="true">
                    LIVE
                  </span>
                  <div>
                    <p>{demo.description}</p>
                    <h3>{demo.title}</h3>
                  </div>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
