"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SiteMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const sections = document.querySelectorAll<HTMLElement>(".reveal-section");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.reveal = "visible";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top >= window.innerHeight) {
        section.dataset.reveal = "waiting";
        observer.observe(section);
      }
    });
    return () => {
      observer.disconnect();
      sections.forEach((section) => delete section.dataset.reveal);
    };
  }, [pathname]);
  return null;
}
