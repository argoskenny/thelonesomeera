import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutCallout() {
  return (
    <section className="about-callout page-container reveal-section">
      <div>
        <h2>想知道更多關於這個角落？</h2>
        <p>看看我在做什麼、關心什麼，以及為什麼開始這個網站。</p>
      </div>
      <Link href="/about" className="button-link button-link--secondary">
        <span>關於我</span>
        <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}
