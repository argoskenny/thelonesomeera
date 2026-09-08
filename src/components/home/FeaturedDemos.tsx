import DemoCard from "@/components/demo/DemoCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { featuredDemos } from "@/data/demos";

export default function FeaturedDemos() {
  return (
    <section id="playgrounds" className="home-section page-container reveal-section">
      <SectionHeading title="Selected playgrounds" href="/demo" linkLabel="前往 Demo" />
      <div className="home-demo-grid">
        {featuredDemos.map((demo, index) => (
          <DemoCard key={demo.title} demo={demo} wide={index === 0} />
        ))}
      </div>
    </section>
  );
}
