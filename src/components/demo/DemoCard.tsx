import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Demo } from "@/data/demos";

type DemoCardProps = {
  demo: Demo;
  featured?: boolean;
  headingLevel?: 2 | 3;
};

export default function DemoCard({
  demo,
  featured = false,
  headingLevel = 3,
}: DemoCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const className = featured ? "demo-card demo-card--featured" : "demo-card";
  const content = (
    <>
      <div className="demo-card__media">
        <Image
          src={demo.image}
          alt={`${demo.title} 預覽`}
          fill
          sizes={
            featured
              ? "(max-width: 760px) 100vw, 62vw"
              : "(max-width: 760px) 100vw, 32vw"
          }
          style={{ objectPosition: demo.imagePosition }}
        />
      </div>
      <div className="demo-card__body">
        <div className="demo-card__title-row">
          <Heading>{demo.title}</Heading>
          <ArrowUpRight aria-hidden="true" />
        </div>
        <p>{demo.description}</p>
        <ul className="tag-list" aria-label="使用技術">
          {demo.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </>
  );

  if (demo.external === false) {
    return (
      <Link href={demo.href} className={className} aria-label={demo.title}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={demo.href}
      className={className}
      target="_blank"
      rel="noreferrer"
      aria-label={`${demo.title}（在新分頁開啟）`}
    >
      {content}
    </a>
  );
}
