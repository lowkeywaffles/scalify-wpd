"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CreditCard, FileText, LayoutDashboard, Settings, Upload } from "lucide-react";

export const NAV = [
  { href: "/app/queue", label: "Today", icon: CalendarCheck, tour: "nav-today" },
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, tour: "nav-dashboard" },
  { href: "/app/quotes", label: "Quotes", icon: FileText, tour: "nav-quotes" },
  { href: "/app/import", label: "Import", icon: Upload, tour: "nav-import" },
  { href: "/app/billing", label: "Access", icon: CreditCard, tour: "nav-access" },
  { href: "/app/settings", label: "Settings", icon: Settings, tour: "nav-settings" },
];
const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

export function DesktopNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex gap-1 rounded-full border border-line bg-surface/70 p-1">
        {NAV.map((n) => {
          const active = isActive(path, n.href);
          return (
            <li key={n.href}>
              <Link href={n.href} data-tour={n.tour} aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${active ? "bg-ink text-bg shadow" : "hover:bg-surface-2"}`}>
                <n.icon className="h-4 w-4" aria-hidden="true" />{n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main (mobile)" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-6">
        {NAV.map((n) => {
          const active = isActive(path, n.href);
          return (
            <li key={n.href}>
              <Link href={n.href} data-tour={`m-${n.tour}`} aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "font-semibold text-accent" : "text-muted"}`}>
                <span className={`flex h-7 w-10 items-center justify-center rounded-full transition ${active ? "bg-accent-soft" : ""}`}><n.icon className="h-5 w-5" aria-hidden="true" /></span>
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
