import SiteMotion from "@/components/layout/SiteMotion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        跳到主要內容
      </a>
      <Header />
      <SiteMotion />
      <div id="main-content" className="site-content">
        {children}
      </div>
      <Footer />
    </>
  );
}
