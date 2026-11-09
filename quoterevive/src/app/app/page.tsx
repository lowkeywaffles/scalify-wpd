import Link from "next/link";
import { redirect } from "next/navigation";
import { loadWorkspace } from "@/lib/data";
import { computeMetrics } from "@/lib/metrics";
import { today } from "@/lib/dates";
import { buildQueue, nextSteps } from "@/lib/workspace";
import { AgingChart, MetricsGrid } from "@/components/Metrics";
import { QueueList } from "@/components/QueueList";
import { Timeline } from "@/components/Timeline";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const { business, quotes, activities } = await loadWorkspace();
  if (!business.onboarded_at) redirect("/app/onboarding");
  const t = today();
  const m = computeMetrics(quotes, activities, t, business.currency);
  const queue = buildQueue(quotes, activities, t, business.typical_quote_value).slice(0, 5);
  const otherCurrencies = new Set(quotes.filter((q) => q.currency !== business.currency).map((q) => q.currency));
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{business.name}</p>
          <h1 className="font-display text-4xl sm:text-5xl">Dashboard</h1>
        </div>
        <Link href="/app/quotes/new" className="btn btn-primary">Add a quote</Link>
      </div>
      {quotes.length === 0 ? (
        <EmptyState title="No quotes yet" body="Add the quotes you've sent recently — even ones from weeks ago. QuoteRevive will tell you who to follow up with first." action={<div className="flex gap-2"><Link href="/app/quotes/new" className="btn btn-primary">Add your first quote</Link><Link href="/app/import" className="btn btn-ghost">Import CSV</Link></div>} />
      ) : (
        <>
          <MetricsGrid m={m} currency={business.currency} />
          {otherCurrencies.size > 0 && <p className="text-xs text-muted">Totals include only {business.currency} quotes. {[...otherCurrencies].join(", ")} quotes are counted but not summed.</p>}
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section aria-labelledby="urgent">
              <div className="mb-3 flex items-center justify-between"><h2 id="urgent" className="font-semibold">Most urgent follow-ups</h2><Link className="link text-sm" href="/app/queue">Open today&apos;s queue</Link></div>
              {queue.length ? <QueueList items={queue} todayIso={t} hrefBase="/app/quotes" /> : <p className="card p-4 text-sm text-muted">Nothing is due today. 🎉</p>}
              <h2 className="mb-2 mt-6 font-semibold">Recommended next steps</h2>
              <ul className="card divide-y divide-line">{nextSteps(quotes, m).map((s) => <li key={s} className="p-3 text-sm">{s}</li>)}</ul>
            </section>
            <div className="space-y-6">
              <AgingChart m={m} currency={business.currency} />
              <section className="card p-5" aria-labelledby="recent"><h2 id="recent" className="mb-4 font-semibold">Recent activity</h2><Timeline activities={activities.slice(-8)} /></section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
