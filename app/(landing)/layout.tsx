import { Navbar } from "./_components/navbar";
import { ScrollToTop } from "./_components/scroll-to-top";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://deeppivot.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "DeepPivot",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
      sameAs: [
        "https://linkedin.com/company/deeppivot",
        "https://github.com/deeppivot",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "hello@deeppivot.com",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "DeepPivot",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: BASE_URL,
      description:
        "AI-powered career development platform with voice interview coaching, career archetype discovery, job tracking, and a built-in job marketplace.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free plan available",
      },
      publisher: {
        "@id": `${BASE_URL}/#organization`,
      },
    },
  ],
};

const LandingPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">{children}</main>
      <ScrollToTop />
    </div>
  );
};

export default LandingPageLayout;