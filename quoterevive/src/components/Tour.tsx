"use client";
import { HelpCircle, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { markTourSeen, resetTours } from "@/app/app/actions";

type Step = { target?: string; title: string; body: string };
const WELCOME: Step[] = [
  { title: "Welcome to QuoteRevive 👋", body: "A 60-second tour of where everything is. You can skip any time and replay it from the ? button." },
  { target: "nav-today", title: "Today", body: "Your daily recovery queue: only the quotes whose follow-up is due, most urgent first. Start here every morning." },
  { target: "nav-dashboard", title: "Dashboard", body: "Open vs. accepted value, your follow-up streak and weekly recovery score." },
  { target: "nav-quotes", title: "Quotes", body: "Every quote in a table or pipeline. Add, search, filter, archive or delete." },
  { target: "nav-import", title: "Import", body: "Bring quotes in from a spreadsheet (CSV). Errors are shown row by row; nothing is overwritten." },
  { target: "nav-access", title: "Access", body: "Your plan. The free workspace holds 10 quotes; Founding Access is $39 one-time." },
  { target: "nav-settings", title: "Settings", body: "Follow-up timing, message language, profile, data export and account deletion." },
  { target: "help", title: "Help is always here", body: "Tap ? to replay a tour for any page or open the step-by-step guide." },
];
const PAGES: Record<string, Step[]> = {
  dashboard: [
    { target: "hero", title: "Your momentum", body: "Your streak counts days in a row with at least one follow-up. The weekly score adds 10 per follow-up, 5 per reply logged and 25 per accepted quote." },
    { target: "metrics", title: "Numbers that matter", body: "Outstanding value is money still waiting — not revenue. Accepted value is what customers said yes to." },
    { target: "urgent", title: "Most urgent", body: "The top quotes from today's queue. Tap one to prepare a follow-up." },
  ],
  queue: [{ target: "queue-list", title: "Today's recovery queue", body: "Each card shows a priority score with its reasons (overdue, expiring, value…). It ranks urgency — it doesn't predict buying. Tap a card to follow up." }],
  quotes: [
    { target: "add-quote", title: "Add a quote", body: "Only customer, job, amount and currency are required. A follow-up date is suggested for you." },
    { target: "quote-filters", title: "Find anything", body: "Search by customer or project, filter by status, or show archived quotes." },
    { target: "quote-views", title: "Table or pipeline", body: "Switch to the pipeline to see quotes grouped by stage." },
  ],
  quote: [
    { target: "assistant", title: "Follow-up assistant", body: "Pick a tone and language. The message is prefilled from the quote — edit it freely." },
    { target: "coach", title: "Coach", body: "Quick, practical tips for this exact quote — deadlines, big amounts, long silences." },
    { target: "send", title: "Send from your own app", body: "Copy, or open WhatsApp / email with the message ready. QuoteRevive never sends for you — mark it sent afterwards." },
    { target: "share", title: "Customer quote link", body: "A private page where your customer can accept, ask a question or say ‘not now’. Their answer appears here automatically." },
    { target: "timeline", title: "Timeline", body: "Every follow-up, reply and status change for this quote." },
  ],
  import: [{ target: "csv", title: "Import from a spreadsheet", body: "Download the sample, match your columns, fix any rows listed in red, then import." }],
  access: [{ target: "access", title: "Your access", body: "Buy Founding Access here. Payment is handled by Whop and unlocks this account automatically." }],
  settings: [{ target: "rules", title: "Your follow-up rules", body: "Set when the first follow-up is due, the gap between follow-ups, when to stop, and your default message language." }],
};
function pageKey(path: string): string | null {
  if (path === "/app") return "dashboard";
  if (path.startsWith("/app/queue")) return "queue";
  if (/^\/app\/quotes\/[0-9a-f-]{36}/.test(path)) return "quote";
  if (path.startsWith("/app/quotes/new")) return null;
  if (path.startsWith("/app/quotes")) return "quotes";
  if (path.startsWith("/app/import")) return "import";
  if (path.startsWith("/app/billing")) return "access";
  if (path.startsWith("/app/settings")) return "settings";
  return null;
}
function findTarget(t?: string): HTMLElement | null {
  if (!t) return null;
  for (const sel of [`[data-tour="${t}"]`, `[data-tour="m-${t}"]`]) {
    for (const el of document.querySelectorAll<HTMLElement>(sel)) if (el.offsetParent !== null || el.getClientRects().length) return el;
  }
  return null;
}

export function Tour({ seen, onboarded }: { seen: string[]; onboarded: boolean }) {
  const path = usePathname();
  const [tour, setTour] = useState<{ key: string; steps: Step[] } | null>(null);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [menu, setMenu] = useState(false);
  const seenRef = useRef(new Set(seen));
  const popRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const start = useCallback((key: string, steps: Step[]) => {
    const available = steps.filter((s) => !s.target || findTarget(s.target));
    if (!available.length) return;
    opener.current = document.activeElement as HTMLElement;
    setMenu(false); setI(0); setTour({ key, steps: available });
  }, []);

  // Auto-start: welcome first, then each page's tour the first time it's opened.
  useEffect(() => {
    if (!onboarded || path.startsWith("/app/onboarding")) return;
    const t = setTimeout(() => {
      if (!seenRef.current.has("welcome")) return start("welcome", WELCOME);
      const k = pageKey(path);
      if (k && !seenRef.current.has(k)) start(k, PAGES[k]);
    }, 700);
    return () => clearTimeout(t);
  }, [path, onboarded, start]);

  const step = tour?.steps[i];
  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    const update = () => setRect(el ? el.getBoundingClientRect() : null);
    el?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    update();
    const t = setTimeout(update, 350);
    window.addEventListener("resize", update); window.addEventListener("scroll", update, true);
    nextRef.current?.focus();
    return () => { clearTimeout(t); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [step]);

  const finish = useCallback(() => {
    if (tour) { seenRef.current.add(tour.key); markTourSeen(tour.key).catch(() => {}); }
    setTour(null); setRect(null);
    requestAnimationFrame(() => opener.current?.focus?.());
  }, [tour]);

  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "Tab" && popRef.current) {
        const f = popRef.current.querySelectorAll<HTMLElement>("button");
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tour, finish]);

  const k = pageKey(path);
  const pad = 8;
  const below = rect ? rect.bottom + 220 < window.innerHeight : true;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
        {menu && (
          <div role="menu" aria-label="Help" className="card mb-2 w-60 p-2 shadow-2xl">
            {k && <button role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => start(k, PAGES[k])}>Tour this page</button>}
            <button role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => start("welcome", WELCOME)}>Full app tour</button>
            <Link role="menuitem" href="/guide" className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-2">Step-by-step guide</Link>
            <button role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-surface-2" onClick={() => { seenRef.current.clear(); setMenu(false); resetTours().catch(() => {}); }}>Show tips again on every page</button>
          </div>
        )}
        <button type="button" data-tour="help" aria-expanded={menu} aria-haspopup="menu" aria-label="Help and guided tours" onClick={() => setMenu((m) => !m)}
          className="glow-ring ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-bg shadow-xl transition hover:scale-105">
          {menu ? <X className="h-5 w-5" aria-hidden="true" /> : <HelpCircle className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {tour && step && (
        <div className="fixed inset-0 z-50">
          {rect ? (
            <div aria-hidden="true" className="pointer-events-none fixed rounded-2xl transition-all duration-300"
              style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgb(0 0 0 / .6), 0 0 0 2px var(--accent)" }} />
          ) : <div aria-hidden="true" className="fixed inset-0 bg-black/60" />}
          <div aria-hidden="true" className="fixed inset-0" onClick={finish} />
          <div ref={popRef} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body"
            className="card rise fixed inset-x-3 bottom-3 z-10 p-5 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:w-96"
            style={typeof window !== "undefined" && window.innerWidth >= 640 ? (rect
              ? { top: below ? rect.bottom + 16 : Math.max(12, rect.top - 200), left: Math.min(Math.max(12, rect.left), window.innerWidth - 400) }
              : { top: "30%", left: "calc(50% - 12rem)" }) : undefined}>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Step {i + 1} of {tour.steps.length}</p>
            <h2 id="tour-title" className="mt-1 font-display text-2xl">{step.title}</h2>
            <p id="tour-body" className="mt-2 text-sm text-muted">{step.body}</p>
            <div className="mt-4 flex items-center gap-1" aria-hidden="true">{tour.steps.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-accent" : "w-1.5 bg-line"}`} />)}</div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" className="text-sm text-muted underline-offset-4 hover:underline" onClick={finish}>Skip tour</button>
              <div className="flex gap-2">
                {i > 0 && <button type="button" className="btn btn-ghost" onClick={() => setI(i - 1)}>Back</button>}
                <button ref={nextRef} type="button" className="btn btn-primary" onClick={() => (i + 1 < tour.steps.length ? setI(i + 1) : finish())}>{i + 1 < tour.steps.length ? "Next" : "Done"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
