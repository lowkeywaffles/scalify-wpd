"use client";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

/** Stores the choice in a first-party preference cookie (see Cookie Policy). */
export function ThemeToggle({ initial }: { initial: "light" | "dark" | null }) {
  const [theme, setTheme] = useState(initial);
  function toggle() {
    const current = theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `qr_theme=${next}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    setTheme(next);
  }
  return (
    <button type="button" onClick={toggle} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface" aria-label="Switch colour theme">
      <Sun className="hidden h-4 w-4 [:root[data-theme=dark]_&]:block" aria-hidden="true" />
      <Moon className="h-4 w-4 [:root[data-theme=dark]_&]:hidden" aria-hidden="true" />
    </button>
  );
}
