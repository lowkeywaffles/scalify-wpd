"use client";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { today } from "@/lib/dates";
import { DEMO_BUSINESS, demoWorkspace } from "@/lib/demo-data";
import { recommendFollowUp } from "@/lib/engine";
import { computeMetrics } from "@/lib/metrics";
import { Activity, Quote } from "@/lib/types";
import { buildQueue } from "@/lib/workspace";
import { FollowUpAssistant, RecordInput } from "./FollowUpAssistant";
import { AgingChart, MetricsGrid } from "./Metrics";
import { QueueList } from "./QueueList";
import { QuoteBrowser } from "./QuoteViews";
import { Timeline } from "./Timeline";

/** Fully client-side demo. Nothing is saved or sent; refreshing resets it. */
export function DemoWorkspace({ compact = false }: { compact?: boolean }) {
  const t = useMemo(() => today(), []);
  const initial = useMemo(() => demoWorkspace(t), [t]);
  const [quotes, setQuotes] = useState<Quote[]>(initial.quotes);
  const [activities, setActivities] = useState<Activity[]>(initial.activities);
  const [tab, setTab] = useState<"today" | "dashboard" | "quotes">("today");
  const [open, setOpen] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const select = (id: string) => { opener.current = document.activeElement as HTMLElement; setOpen(id); };
  const root = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(null);
    // Return focus to the opener, or to the first item if the opener left the queue.
    requestAnimationFrame(() => {
      const target = opener.current?.isConnected ? opener.current : root.current?.querySelector<HTMLElement>("[role=tabpanel] button, [role=tabpanel] a");
      target?.focus();
    });
  };

  const queue = buildQueue(quotes, activities, t, DEMO_BUSINESS.typical);
  const metrics = computeMetrics(quotes, activities, t, DEMO_BUSINESS.currency);
  const q = quotes.find((x) => x.id === open);
  const qActs = activities.filter((a) => a.quote_id === open);

  async function onRecord(input: RecordInput) {
    const quote = quotes.find((x) => x.id === input.quote_id)!;
    const now = new Date().toISOString();
    const add: Activity[] = [{ id: crypto.randomUUID(), quote_id: quote.id, kind: input.kind, channel: input.channel ?? null, summary: input.summary || null, from_status: null, to_status: null, contributed_to_sale: input.contributed_to_sale ?? null, occurred_at: now }];
    let status = quote.status;
    if (input.new_status && input.new_status !== status) status = input.new_status;
    else if (input.kind === "follow_up" && ["sent", "follow_up_due"].includes(status)) status = "awaiting_response";
    if (status !== quote.status) add.push({ ...add[0], id: crypto.randomUUID(), kind: "status_change", channel: null, summary: null, from_status: quote.status, to_status: status, contributed_to_sale: null });
    const allActs = [...activities, ...add];
    const updated = { ...quote, status };
    updated.next_follow_up_at = input.next_follow_up_at ?? recommendFollowUp(updated, allActs.filter((a) => a.quote_id === quote.id)).date;
    setActivities(allActs);
    setQuotes(quotes.map((x) => (x.id === quote.id ? updated : x)));
    return { ok: true, message: "Recorded in the demo (not saved)." };
  }

  return (
    <div ref={root} className="rounded-[28px] border border-line bg-bg p-3 shadow-[0_30px_80px_-40px_rgba(0,0,0,.45)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">Demo workspace · fictional data · nothing is saved or sent</p>
        <div role="tablist" aria-label="Demo views" className="flex rounded-full border border-line bg-surface p-1">
          {(["today", "dashboard", "quotes"] as const).map((v) => (
            <button key={v} role="tab" id={`demo-tab-${v}`} aria-controls={`demo-panel-${v}`} aria-selected={tab === v} type="button" onClick={() => setTab(v)} className={`min-h-9 rounded-full px-3 text-sm capitalize ${tab === v ? "bg-ink text-bg" : ""}`}>{v}</button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id={`demo-panel-${tab}`} aria-labelledby={`demo-tab-${tab}`}>
        {tab === "today" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">{queue.length} quotes need attention today. Select one to prepare a follow-up.</p>
            <QueueList items={compact ? queue.slice(0, 3) : queue} todayIso={t} onSelect={select} />
          </div>
        )}
        {tab === "dashboard" && <div className="space-y-4"><MetricsGrid m={metrics} currency="USD" />{!compact && <AgingChart m={metrics} currency="USD" />}</div>}
        {tab === "quotes" && <QuoteBrowser quotes={quotes} onSelect={select} />}
      </div>

      <dialog ref={dialog} onClose={close} aria-labelledby="demo-dlg-title" className="m-auto w-[min(100%-1.5rem,52rem)] rounded-3xl border border-line bg-bg p-0 text-ink backdrop:bg-black/50">
        {q && (
          <div className="max-h-[85dvh] overflow-y-auto p-4 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><p className="text-sm text-muted">{q.title}</p><h2 id="demo-dlg-title" className="font-display text-3xl">{q.customer_name}</h2></div>
              <button type="button" onClick={close} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line" aria-label="Close"><X className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
              <FollowUpAssistant key={q.id} quote={q} businessName="Northline Print Studio" previousFollowUps={qActs.filter((a) => a.kind === "follow_up").length} todayIso={t} recommended={recommendFollowUp(q, qActs)} onRecord={onRecord} />
              <section className="card p-4" aria-label="Timeline"><h3 className="mb-3 font-semibold">Timeline</h3><Timeline activities={qActs} /></section>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
