import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display-face", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "QuoteRevive — follow up on unanswered quotes", template: "%s · QuoteRevive" },
  description: "Track quotations, follow up at the right time, and recover opportunities before they disappear. A focused quote follow-up workspace for small businesses.",
  icons: { icon: "/favicon.svg" },
  openGraph: { type: "website", siteName: "QuoteRevive" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f4ee" }, { media: "(prefers-color-scheme: dark)", color: "#111215" }] };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("qr_theme")?.value;
  return (
    <html lang="en" data-theme={theme === "dark" || theme === "light" ? theme : undefined} className={`${body.variable} ${display.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
