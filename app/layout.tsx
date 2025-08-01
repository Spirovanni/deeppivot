import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { cn } from "@/utils";
import Provider from "./provider";

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
          {children}
        </body>
      </html>
    </Provider>
  ) as any;
}
