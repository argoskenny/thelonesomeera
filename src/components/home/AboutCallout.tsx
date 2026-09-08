import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutCallout() {
  return (
    <section className="about-callout page-container reveal-section">
      <div>
        <h2>Let’s build a more curious web.</h2>
        <p>保持好奇，持續創造。在自己的節奏裡，做出意想不到的事。</p>
      </div>
      <Link href="/about" className="button-link button-link--secondary">
        <span>關於我</span>
        <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}
