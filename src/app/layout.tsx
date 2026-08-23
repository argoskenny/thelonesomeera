import type { Metadata } from "next";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
} from "@/lib/site-metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: SITE_NAME,
    template: `%s｜${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ["前端開發", "遊戲開發", "互動設計", "WebGL", "生活觀察"],
  icons: { icon: "/favicon.ico" },
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
