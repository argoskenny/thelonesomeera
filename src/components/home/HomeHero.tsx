import Image from "next/image";
import ButtonLink from "@/components/ui/ButtonLink";

export default function HomeHero() {
  return (
    <section className="home-hero page-container">
      <div className="home-hero__copy">
        <h1>
          在程式與生活之間，
          <br />
          做一些<span>好玩的東西</span>。
        </h1>
        <p>
          The Lonesome Era 記錄 Web 實驗、遊戲作品與開發筆記。
          一個偏離喧囂、保留好奇心的數位角落。
        </p>
        <div className="home-hero__actions">
          <ButtonLink href="/demo">看看 Demo</ButtonLink>
          <ButtonLink href="/blog" variant="secondary">
            閱讀 Blog
          </ButtonLink>
        </div>
      </div>

      <div className="home-hero__visual">
        <Image
          src="/images/creative-studio.png"
          alt="藍調城市夜景前，放著透明電腦、筆記本與咖啡的創作工作桌"
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 760px) 100vw, 48vw"
        />
      </div>
    </section>
  );
}
