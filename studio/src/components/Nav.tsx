"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/studio", label: "Today" },
  { href: "/studio/compose", label: "Create" },
  { href: "/studio/posts", label: "Posts" },
  { href: "/studio/library", label: "Library" },
  { href: "/studio/accounts", label: "Accounts" },
  { href: "/studio/team", label: "Team" },
  { href: "/studio/setup", label: "Setup" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Studio" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {LINKS.map((l) => {
        const active = l.href === "/studio" ? path === "/studio" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${active ? "bg-lime text-lime-ink" : "text-ink hover:bg-surface-2"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
