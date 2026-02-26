import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { cn } from "@/utils";
import Provider from "./provider";
import { Footer } from "@/components/Footer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Provider>
      <html lang="en" suppressHydrationWarning>
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
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>
          <div id="main-content" className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </body>
      </html>
    </Provider>
  ) as any;
}
