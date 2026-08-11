import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SectionHeadingProps = {
  title: string;
  href?: string;
  linkLabel?: string;
};

export default function SectionHeading({
  title,
  href,
  linkLabel,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <span className="section-heading__rule" aria-hidden="true" />
      {href && linkLabel ? (
        <Link href={href} className="text-link">
          {linkLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
