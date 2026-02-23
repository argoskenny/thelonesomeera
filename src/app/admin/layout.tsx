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
  return (
    <div className="admin-reset bg-slate-50 text-slate-800 font-sans min-h-screen">
      {children}
    </div>
  );
}
