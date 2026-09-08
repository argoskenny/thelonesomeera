import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import SingularArt from "@/components/ui/SingularArt";
import ButtonLink from "@/components/ui/ButtonLink";

export default function HomeHero() {
  return (
    <section className="home-hero page-container">
      <SingularArt interactive />
      <div className="home-hero__copy">
        <h1><span>MAKE THE</span><span>UNEXPECTED.</span></h1>
        <p>把好奇心，變成可以體驗的世界。</p>
        <div className="home-hero__actions">
          <ButtonLink href="/demo">探索 Demo</ButtonLink>
          <Link className="text-link" href="/blog">閱讀 Blog <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="hero-foot">
        <a href="#playgrounds"><ArrowDown aria-hidden="true" /> SCROLL TO EXPLORE</a>
        <span>程式、遊戲與創作筆記</span>
      </div>
    </section>
  );
}
