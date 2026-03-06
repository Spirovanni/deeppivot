import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { cn } from "@/utils";
import Provider from "./provider";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "Deep Pivot",
  description: "AI-powered career development platform with voice interviews powered by ElevenLabs",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const useClerkDevelopment =
    process.env.NEXT_PUBLIC_CLERK_USE_DEVELOPMENT === "true";
  const hasLiveKey =
    (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").startsWith("pk_live_");
  const isProduction =
    !useClerkDevelopment && hasLiveKey && process.env.NODE_ENV === "production";
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  const isDev = process.env.NODE_ENV === "development";

  return (
    <Provider
      isProduction={isProduction}
      posthogKey={posthogKey}
      posthogHost={posthogHost}
      isDev={isDev}
    >
      <NextIntlClientProvider messages={messages}>
        <html lang={locale} suppressHydrationWarning>
          <head>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                try {
                  var theme = localStorage.getItem('deeppivot-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              `,
              }}
            />
          </head>
          <body
            className={cn(
              GeistSans.variable,
              GeistMono.variable,
              "flex flex-col min-h-screen"
            )}
          >
            {/* Skip-to-content link for keyboard and screen-reader users (WCAG 2.4.1) */}
            <a
              href="#main-content"
              className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-[9999] focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Skip to main content
            </a>
            <div id="main-content" className="flex flex-1 flex-col">{children}</div>
            <Footer />
            <CookieConsent />
          </body>
        </html>
      </NextIntlClientProvider>
    </Provider>
  ) as any;
}
