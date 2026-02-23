import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { cn } from "@/utils";
import Provider from "./provider";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Deep Pivot",
  description: "A Career Coach using Hume AI's Empathic Voice Interface",
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
      <html lang="en">
        <body
          className={cn(
            GeistSans.variable,
            GeistMono.variable,
            "flex flex-col min-h-screen"
          )}
        >
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </body>
      </html>
    </Provider>
  ) as any;
}
