import Link from "next/link";
import { cookies } from "next/headers";
import { Bell, CalendarCheck, FileText, LayoutDashboard, Settings, Upload, CreditCard } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requireBusiness } from "@/lib/data";
import { signOut } from "../(auth)/actions";
import { markRemindersRead } from "./actions";

export const metadata = { robots: { index: false } };

const NAV = [
  { href: "/app/queue", label: "Today", icon: CalendarCheck },
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/quotes", label: "Quotes", icon: FileText },
  { href: "/app/import", label: "Import", icon: Upload },
  { href: "/app/billing", label: "Access", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, business } = await requireBusiness();
  const { count } = await supabase.from("reminders").select("id", { count: "exact", head: true }).is("read_at", null);
  const theme = (await cookies()).get("qr_theme")?.value as "light" | "dark" | undefined;
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/app/queue" aria-label="QuoteRevive home"><Wordmark /></Link>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex gap-1">
              {NAV.map((n) => <li key={n.href}><Link href={n.href} className="rounded-full px-3 py-2 text-sm hover:bg-surface-2">{n.label}</Link></li>)}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            {count ? (
              <form action={markRemindersRead}>
                <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface" aria-label={`${count} new follow-up reminders. Mark as read`}>
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-ink" aria-hidden="true">{count}</span>
                </button>
              </form>
            ) : null}
            <Link href="/guide" className="hidden rounded-full px-3 py-2 text-sm hover:bg-surface-2 sm:inline">Help</Link>
            <ThemeToggle initial={theme ?? null} />
            <form action={signOut}><button className="btn btn-ghost">Sign out</button></form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        {!business.name && <p className="mb-4 text-sm"><Link className="link" href="/app/onboarding">Finish setting up your workspace</Link></p>}
        {children}
      </main>
      <nav aria-label="Main (mobile)" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg md:hidden">
        <ul className="grid grid-cols-6">
          {NAV.map((n) => (
            <li key={n.href}><Link href={n.href} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]"><n.icon className="h-5 w-5" aria-hidden="true" />{n.label}</Link></li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
