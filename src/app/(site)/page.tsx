import Hero from "@/components/home/Hero";
import CodePreview from "@/components/home/CodePreview";
import FeatureTable from "@/components/home/FeatureTable";
import IntegrationLogos from "@/components/home/IntegrationLogos";
import DocsLink from "@/components/home/DocsLink";

export default function Home() {
  return (
    <main>
      <Hero />
      <CodePreview />
      <FeatureTable />
      <IntegrationLogos />
      <DocsLink />
    </main>
  );
}
