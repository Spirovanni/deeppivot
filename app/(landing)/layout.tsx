import { Navbar } from "./_components/navbar";
import { ScrollToTop } from "./_components/scroll-to-top";

const LandingPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <ScrollToTop />
    </div>
  );
};

export default LandingPageLayout 