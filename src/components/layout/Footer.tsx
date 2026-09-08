import Link from "next/link";
import { Mail, Rss } from "lucide-react";

const footerNavigation = [
  { href: "/", label: "首頁" },
  { href: "/demo", label: "Demo" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-wordmark" aria-hidden="true">THE LONESOME ERA<span>↗</span></div>
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__brand">The Lonesome Era</p>
          <p className="site-footer__copyright">
            © {new Date().getFullYear()} The Lonesome Era.
          </p>
        </div>

        <nav className="footer-nav" aria-label="頁尾導覽">
          {footerNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="footer-actions">
          <a href="mailto:argoskenny@gmail.com" aria-label="寄信給 The Lonesome Era">
            <Mail aria-hidden="true" />
          </a>
          <a href="/rss.xml" aria-label="訂閱 RSS">
            <Rss aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
