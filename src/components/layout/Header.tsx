"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navigation = [
  { href: "/", label: "首頁" },
  { href: "/demo", label: "Demo" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();

  const renderNavigationLinks = () =>
    navigation.map((item) => {
      const current = isCurrentPath(pathname, item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={current ? "site-nav__link is-current" : "site-nav__link"}
          aria-current={current ? "page" : undefined}
        >
          {item.label}
        </Link>
      );
    });

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          The Lonesome Era
        </Link>

        <nav
          id="site-navigation"
          className="site-nav site-nav--desktop"
          aria-label="主要導覽"
        >
          {renderNavigationLinks()}
        </nav>

        <details
          key={pathname}
          className="mobile-navigation"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary
            className="menu-button"
            aria-label="導覽選單"
            aria-controls="mobile-site-navigation"
          >
            <Menu className="menu-icon menu-icon--open" aria-hidden="true" />
            <X className="menu-icon menu-icon--close" aria-hidden="true" />
          </summary>
          <nav
            id="mobile-site-navigation"
            className="site-nav site-nav--mobile"
            aria-label="手機主要導覽"
          >
            {renderNavigationLinks()}
          </nav>
        </details>
      </div>
    </header>
  );
}
