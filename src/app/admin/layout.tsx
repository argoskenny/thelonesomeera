import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | The Lonesome Era",
  robots: "noindex, nofollow",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
