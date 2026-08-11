import type { Metadata } from "next";
import HomeHero from "@/components/home/HomeHero";
import FeaturedDemos from "@/components/home/FeaturedDemos";
import LatestPosts from "@/components/home/LatestPosts";
import AboutCallout from "@/components/home/AboutCallout";

export const metadata: Metadata = {
  title: { absolute: "The Lonesome Era｜程式、遊戲與創作筆記" },
  description:
    "記錄 Web 實驗、遊戲作品與開發筆記，一個偏離喧囂、保留好奇心的數位角落。",
};

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <FeaturedDemos />
      <LatestPosts />
      <AboutCallout />
    </main>
  );
}
