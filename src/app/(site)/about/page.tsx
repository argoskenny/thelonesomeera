import CosmicBackdrop from "@/components/ui/CosmicBackdrop";
import type { Metadata } from "next";
import SingularArt from "@/components/ui/SingularArt";
import { ArrowRight, Mail } from "lucide-react";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description: "關於 The Lonesome Era，以及程式、遊戲、產品與生活觀察。",
  path: "/about",
});

const principles = [
  {
    title: "做能被使用的東西",
    description: "從真實需求出發，設計有用、好用，也值得持續優化的產品與體驗。",
  },
  {
    title: "寫能回頭理解的文字",
    description: "把複雜概念拆成清楚脈絡，讓未來的自己也能快速回到狀態。",
  },
  {
    title: "留一點空間給好奇心",
    description: "保持探索的彈性，讓跨領域的靈感在日常裡自然發生。",
  },
];

const practices = [
  ["01", "Web & Product", "網站與產品設計、前後端開發、使用者體驗與系統化思考。"],
  ["02", "Interactive & Games", "互動體驗設計、遊戲原型開發、玩法機制與內容樂趣的探索。"],
  ["03", "Mobile Experiences", "行動應用設計與開發，打造流暢、直覺且有意義的使用情境。"],
  ["04", "Writing & Research", "技術與生活觀察寫作、資料整理與研究，建立屬於自己的知識脈絡。"],
];

export default function AboutPage() {
  return (
    <main className="page-container page-main about-page cosmic-page cosmic-page--singularity">
      <CosmicBackdrop variant="nebula" />
      <section className="about-hero">
        <div className="about-hero__copy">
          <h1 className="display-title">STAY<br />CURIOUS<span>.</span></h1>
          <p className="about-tagline">在快速變動的科技裡，保留一點自己的節奏。</p>
          <p>
            The Lonesome Era 是一個關於程式、遊戲、產品與生活觀察的個人數位空間。
            技術是工具，創作是過程，思考才是核心。
          </p>
        </div>
        <SingularArt />
      </section>

      <section className="manifesto reveal-section">
        <div className="section-label">
          <span>我的創作觀</span>
          <span>／ MANIFESTO</span>
        </div>
        <div className="manifesto__content">
          <blockquote>如果你也喜歡思考、創造、分享，那麼你並不孤單。</blockquote>
          <p>
            我相信，好作品來自真實問題意識與長時間琢磨。在這裡，我記錄學習、打造實驗、分享想法，也試著把複雜的東西說清楚。
          </p>
        </div>
      </section>

      <section className="about-list reveal-section">
        <div className="section-label">
          <span>三個原則</span>
          <span>／ PRINCIPLES</span>
        </div>
        <div>
          {principles.map((principle) => (
            <article className="principle-row" key={principle.title}>
              <ArrowRight aria-hidden="true" />
              <h2>{principle.title}</h2>
              <p>{principle.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-list reveal-section">
        <div className="section-label">
          <span>我正在做的事</span>
          <span>／ WORKING WITH</span>
        </div>
        <div>
          {practices.map(([number, title, description]) => (
            <article className="practice-row" key={number}>
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-row reveal-section">
        <div className="section-label">
          <span>聯絡我</span>
          <span>／ CONTACT</span>
        </div>
        <a href="mailto:argoskenny@gmail.com">
          <Mail aria-hidden="true" />
          <span>合作、交流或任何想法，歡迎來信</span>
          <strong>argoskenny@gmail.com</strong>
          <ArrowRight aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}
