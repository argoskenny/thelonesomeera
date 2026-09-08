import CosmicBackdrop from "@/components/ui/CosmicBackdrop";
import type { Metadata } from "next";
import DemoCard from "@/components/demo/DemoCard";
import { demos } from "@/data/demos";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Demo",
  description: "遊戲、互動實驗與小型產品；每一個 Demo 都能直接打開試玩。",
  path: "/demo",
});

export default function DemoPage() {
  const [featured, ...rest] = demos;

  return (
    <main className="page-container page-main cosmic-page cosmic-page--galaxy">
      <CosmicBackdrop variant="galaxy" />
      <header className="page-intro">
        <h1 className="display-title">PLAY<br />GROUND<span>.</span></h1>
        <p>把想法做成可以玩的東西。<br />遊戲、互動實驗與小型產品，直接打開、親手試試。</p>
      </header>

      <section aria-label="精選 Demo" className="demo-featured">
        <DemoCard demo={featured} featured headingLevel={2} />
      </section>

      <section aria-label="所有 Demo" className="demo-grid">
        {rest.map((demo) => (
          <DemoCard key={demo.title} demo={demo} headingLevel={2} />
        ))}
      </section>
    </main>
  );
}
