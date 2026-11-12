import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Scalify Studio", template: "%s · Scalify Studio" },
  description: "Private content scheduler for the Scalify team.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f3ee" }, { media: "(prefers-color-scheme: dark)", color: "#0e0f12" }] };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers(); // render per request so Next.js applies the CSP nonce to its scripts
  return (
    <html lang="en" className={body.variable}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:text-lime-ink">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
