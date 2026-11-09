import { formatMoney } from "@/lib/dates";
import { Metrics } from "@/lib/metrics";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export function MetricsGrid({ m, currency }: { m: Metrics; currency: string }) {
  const tiles = [
    { label: "Outstanding quote value", value: formatMoney(m.outstandingValue, currency), note: "Open quotes — not revenue yet" },
    { label: "Accepted quote value", value: formatMoney(m.acceptedValue, currency), note: "Marked accepted by you", strong: true },
    { label: "Need follow-up today", value: String(m.needsFollowUp), note: "Due or overdue" },
    { label: "Awaiting response", value: String(m.awaitingResponse), note: "Sent, no decision yet" },
    { label: "Follow-ups completed", value: String(m.followUpsCompleted), note: `Completion rate ${pct(m.followUpCompletionRate)}` },
    { label: "Acceptance rate", value: pct(m.acceptanceRate), note: "Accepted ÷ decided quotes" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {tiles.map((t) => (
        <div key={t.label} className={`card p-4 sm:p-5 ${t.strong ? "ring-1 ring-good/40" : ""}`}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t.label}</dt>
          <dd className={`mt-2 font-display text-3xl sm:text-4xl ${t.strong ? "text-good" : ""}`}>{t.value}</dd>
          <dd className="mt-1 text-xs text-muted">{t.note}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AgingChart({ m, currency }: { m: Metrics; currency: string }) {
  const max = Math.max(1, ...m.aging.map((a) => a.count));
  return (
    <figure className="card p-5">
      <figcaption className="mb-4">
        <h2 className="font-semibold">Customer silence</h2>
        <p className="text-sm text-muted">How long open quotes have waited since they were sent.</p>
      </figcaption>
      <ul className="space-y-3">
        {m.aging.map((a, i) => (
          <li key={a.label} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-sm">
            <span className="text-muted">{a.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <span className="block h-full rounded-full" style={{ width: `${(a.count / max) * 100}%`, background: i >= 2 ? "var(--warn)" : "var(--accent)" }} />
            </span>
            <span className="tabular-nums">{a.count} · {formatMoney(a.value, currency)}</span>
          </li>
        ))}
      </ul>
      {m.followUpAttributedValue > 0 && (
        <p className="mt-4 text-xs text-muted">
          {formatMoney(m.followUpAttributedValue, currency)} of accepted value is on quotes where you marked a follow-up as contributing. This is your own judgement, not proof the follow-up caused the sale.
        </p>
      )}
    </figure>
  );
}
