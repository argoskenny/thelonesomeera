import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thelonesomeera.com"),
  title: {
    default: "The Lonesome Era",
    template: "%s｜The Lonesome Era",
  },
  description:
    "程式、遊戲、產品與生活觀察，一個偏離喧囂、保留好奇心的數位角落。",
  keywords: ["前端開發", "遊戲開發", "互動設計", "WebGL", "生活觀察"],
  icons: { icon: "/favicon.ico" },
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
