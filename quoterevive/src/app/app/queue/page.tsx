import Link from "next/link";
import { loadWorkspace } from "@/lib/data";
import { formatDate, today } from "@/lib/dates";
import { buildQueue } from "@/lib/workspace";
import { QueueList } from "@/components/QueueList";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Today's recovery queue" };

export default async function Queue() {
  const { business, quotes, activities } = await loadWorkspace();
  const t = today();
  const items = buildQueue(quotes, activities, t, business.typical_quote_value);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{formatDate(t)}</p>
        <h1 className="font-display text-4xl sm:text-5xl">Today&apos;s recovery queue</h1>
        <p className="mt-2 max-w-2xl text-muted">Quotes whose follow-up date has arrived, ordered by the Recovery Priority Score. The score adds up the factors shown on each card — it ranks urgency, it does not predict whether a customer will buy.</p>
      </div>
      {items.length ? <QueueList items={items} todayIso={t} hrefBase="/app/quotes" /> : (
        <EmptyState title="All caught up" body="No follow-ups are due today. New reminders appear here automatically when a follow-up date arrives." action={<Link className="btn btn-ghost" href="/app/quotes">View all quotes</Link>} />
      )}
    </div>
  );
}
