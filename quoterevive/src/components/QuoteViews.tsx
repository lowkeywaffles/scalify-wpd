"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDate, formatMoney } from "@/lib/dates";
import { Quote, QUOTE_STATUSES, STATUS_LABEL, QuoteStatus } from "@/lib/types";
import { StatusBadge } from "./ui";

export function QuoteBrowser({ quotes, hrefBase = "/app/quotes", onSelect }: { quotes: Quote[]; hrefBase?: string; onSelect?: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | QuoteStatus>("all");
  const [archived, setArchived] = useState(false);
  const [view, setView] = useState<"table" | "pipeline">("table");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return quotes.filter((x) => x.archived === archived && (status === "all" || x.status === status) &&
      (!s || `${x.customer_name} ${x.title} ${x.customer_email ?? ""}`.toLowerCase().includes(s)));
  }, [quotes, q, status, archived]);

  const name = (x: Quote) => onSelect
    ? <button type="button" className="text-left font-semibold underline-offset-4 hover:underline" onClick={() => onSelect(x.id)}>{x.customer_name}</button>
    : <Link className="font-semibold underline-offset-4 hover:underline" href={`${hrefBase}/${x.id}`}>{x.customer_name}</Link>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-tour="quote-filters">
        <div className="flex-1">
          <label htmlFor="qsearch" className="label">Search</label>
          <input id="qsearch" type="search" className="input" placeholder="Customer, project or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="qstatus" className="label">Status</label>
          <select id="qstatus" className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All statuses</option>
            {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={archived} onChange={(e) => setArchived(e.target.checked)} /> Show archived</label>
        <div role="group" aria-label="View" className="flex rounded-full border border-line p-1" data-tour="quote-views">
          {(["table", "pipeline"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`min-h-9 rounded-full px-3 text-sm capitalize ${view === v ? "bg-ink text-bg" : ""}`}>{v}</button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted" aria-live="polite">{list.length} quote{list.length === 1 ? "" : "s"}</p>

      {view === "table" ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Quotes</caption>
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr><th scope="col" className="p-3">Customer</th><th scope="col" className="p-3">Project</th><th scope="col" className="p-3 text-right">Amount</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Sent</th><th scope="col" className="p-3">Next follow-up</th></tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="p-3">{name(x)}</td>
                  <td className="max-w-[16rem] truncate p-3 text-muted">{x.title}</td>
                  <td className="p-3 text-right tabular-nums">{formatMoney(x.amount, x.currency)}</td>
                  <td className="p-3"><StatusBadge status={x.status} /></td>
                  <td className="p-3 text-muted">{formatDate(x.sent_at)}</td>
                  <td className="p-3 text-muted">{formatDate(x.next_follow_up_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex snap-x gap-3 overflow-x-auto pb-2">
          {QUOTE_STATUSES.map((s) => {
            const col = list.filter((x) => x.status === s);
            return (
              <section key={s} aria-label={`${STATUS_LABEL[s]}: ${col.length}`} className="w-64 shrink-0 snap-start rounded-2xl bg-surface-2 p-3">
                <h3 className="mb-2 flex justify-between text-sm font-semibold"><span>{STATUS_LABEL[s]}</span><span className="text-muted">{col.length}</span></h3>
                <ul className="space-y-2">
                  {col.map((x) => (
                    <li key={x.id} className="card p-3 text-sm">
                      {name(x)}
                      <p className="truncate text-muted">{x.title}</p>
                      <p className="mt-1 tabular-nums">{formatMoney(x.amount, x.currency)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
