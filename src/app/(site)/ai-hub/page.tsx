import type { Metadata } from "next";
import AiHubClientPage from "@/components/ai-hub/AiHubClientPage";

export const metadata: Metadata = {
  title: "AI Demo Hub | The Lonesome Era",
  description: "整合 signuptest、solarsystem、earthmoonsystem 等測試頁面的 AI Demo Hub。",
};

export default function AiHubPage() {
  return <AiHubClientPage />;
}
