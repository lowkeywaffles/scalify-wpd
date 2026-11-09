import Link from "next/link";
import { cookies } from "next/headers";
import { Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export async function SiteHeader() {
  const theme = (await cookies()).get("qr_theme")?.value as "light" | "dark" | undefined;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="QuoteRevive home"><Wordmark /></Link>
        <nav aria-label="Site" className="hidden md:block">
          <ul className="flex gap-1 text-sm">
            <li><Link className="rounded-full px-3 py-2 hover:bg-surface-2" href="/#how">How it works</Link></li>
            <li><Link className="rounded-full px-3 py-2 hover:bg-surface-2" href="/demo">Demo</Link></li>
            <li><Link className="rounded-full px-3 py-2 hover:bg-surface-2" href="/#pricing">Pricing</Link></li>
            <li><Link className="rounded-full px-3 py-2 hover:bg-surface-2" href="/#faq">FAQ</Link></li>
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle initial={theme ?? null} />
          <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">Sign in</Link>
          <Link href="/signup" className="btn btn-primary">Start free</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-sm text-sm text-muted">A focused workspace for following up on quotes. QuoteRevive never sends messages on your behalf.</p>
          <p className="text-xs text-muted">© {new Date().getFullYear()} [LEGAL BUSINESS NAME]. QuoteRevive is not affiliated with WhatsApp, Meta, Instagram or Whop.</p>
        </div>
        <nav aria-label="Product"><h2 className="mb-2 text-sm font-semibold">Product</h2><ul className="space-y-2 text-sm text-muted">
          <li><Link href="/demo">Demo</Link></li><li><Link href="/#pricing">Pricing</Link></li><li><Link href="/#security">Privacy & security</Link></li><li><Link href="/contact">Contact & support</Link></li></ul></nav>
        <nav aria-label="Legal"><h2 className="mb-2 text-sm font-semibold">Legal</h2><ul className="space-y-2 text-sm text-muted">
          <li><Link href="/legal/privacy">Privacy Policy</Link></li><li><Link href="/legal/terms">Terms & Conditions</Link></li><li><Link href="/legal/cookies">Cookie Policy & settings</Link></li><li><Link href="/legal/refund">Refund Policy</Link></li><li><Link href="/contact">Business details</Link></li></ul></nav>
      </div>
    </footer>
  );
}
