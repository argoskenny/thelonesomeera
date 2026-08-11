import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export default function ButtonLink({
  href,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link href={href} className={`button-link button-link--${variant}`}>
      <span>{children}</span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
