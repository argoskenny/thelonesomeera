"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/projects", label: "作品" },
  { href: "/articles", label: "文章" },
  { href: "/about", label: "關於" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <Terminal className="h-6 w-6 text-primary transition-colors group-hover:text-syntax-green" />
          <span className="font-mono text-lg font-bold text-text-main">
            <span className="text-syntax-purple">the</span>
            <span className="text-primary">Lonesome</span>
            <span className="text-syntax-green">Era</span>
          </span>
        </Link>

        {/* 桌面導航 */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "rounded-lg px-4 py-2 font-mono text-sm transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-slate-800 hover:text-text-main"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* 手機漢堡選單按鈕 */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-text-muted hover:bg-slate-800 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* 手機選單 */}
      {mobileOpen && (
        <div className="border-t border-slate-800/50 bg-background/95 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col p-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-4 py-3 font-mono text-sm transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:bg-slate-800 hover:text-text-main"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
