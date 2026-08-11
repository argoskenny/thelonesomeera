import DemoCard from "@/components/demo/DemoCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { featuredDemos } from "@/data/demos";

export default function FeaturedDemos() {
  return (
    <section className="home-section page-container reveal-section">
      <SectionHeading title="最近在玩" href="/demo" linkLabel="前往 Demo" />
      <div className="home-demo-grid">
        {featuredDemos.map((demo) => (
          <DemoCard key={demo.title} demo={demo} />
        ))}
      </div>
    </section>
  );
}
