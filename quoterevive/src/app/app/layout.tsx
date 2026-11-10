import Link from "next/link";
import { cookies } from "next/headers";
import { Bell } from "lucide-react";
import { DesktopNav, MobileNav } from "@/components/AppNav";
import { Tour } from "@/components/Tour";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requireBusiness } from "@/lib/data";
import { signOut } from "../(auth)/actions";
import { markRemindersRead } from "./actions";

export const metadata = { robots: { index: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, business } = await requireBusiness();
  const { count } = await supabase.from("reminders").select("id", { count: "exact", head: true }).is("read_at", null);
  const theme = (await cookies()).get("qr_theme")?.value as "light" | "dark" | undefined;
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/app/queue" aria-label="QuoteRevive home"><Wordmark /></Link>
          <DesktopNav />
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
      <MobileNav />
      <Tour seen={business.tour_seen ?? []} onboarded={Boolean(business.onboarded_at)} />
    </div>
  );
}
