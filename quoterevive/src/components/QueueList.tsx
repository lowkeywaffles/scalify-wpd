import Link from "next/link";
import { formatDate, formatMoney, daysBetween } from "@/lib/dates";
import { Priority } from "@/lib/engine";
import { Quote } from "@/lib/types";
import { StatusBadge } from "./ui";

export interface QueueItem { quote: Quote; priority: Priority }

export function QueueList({ items, todayIso, hrefBase, onSelect }: { items: QueueItem[]; todayIso: string; hrefBase?: string; onSelect?: (id: string) => void }) {
  return (
    <ol className="space-y-2">
      {items.map(({ quote: q, priority }, i) => {
        const silent = q.sent_at ? daysBetween(q.sent_at, todayIso) : null;
        const body = (
          <>
            <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent-soft text-accent" title="">
              <span className="text-lg font-bold leading-none tabular-nums">{priority.score}</span>
              <span className="text-[10px] uppercase">score</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold">{q.customer_name}</span>
                <StatusBadge status={q.status} />
              </span>
              <span className="block truncate text-sm text-muted">{q.title} · {formatMoney(q.amount, q.currency)}</span>
              <span className="mt-1 block text-xs text-muted">
                {silent !== null ? `Silent ${silent} day${silent === 1 ? "" : "s"}` : "Not sent"} · Follow-up {formatDate(q.next_follow_up_at)}
                <span className="sr-only">. Priority factors: {priority.factors.map((f) => `${f.label} (+${f.points})`).join(", ")}</span>
              </span>
              <span className="mt-1 hidden flex-wrap gap-1 sm:flex" aria-hidden="true">
                {priority.factors.map((f) => <span key={f.label} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{f.label} +{f.points}</span>)}
              </span>
            </span>
          </>
        );
        const cls = "card flex items-start gap-3 p-3 sm:p-4 text-left w-full transition hover:border-accent rise";
        return (
          <li key={q.id} style={{ animationDelay: `${i * 40}ms` }}>
            {onSelect ? (
              <button type="button" className={cls} onClick={() => onSelect(q.id)}>{body}</button>
            ) : (
              <Link className={cls} href={`${hrefBase}/${q.id}#follow-up`}>{body}</Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
