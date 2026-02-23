import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Lonesome Era | Developer & Creator Hub",
  description:
    "一個屬於創作者與思考者的技術角落 — 分享前端開發、遊戲製作與科技觀察",
  keywords: ["前端開發", "遊戲開發", "JavaScript", "Vue.js", "React", "Next.js"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <Header />
        <div className="min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
