import Link from "next/link";
import { loadWorkspace } from "@/lib/data";
import { QuoteBrowser } from "@/components/QuoteViews";
import { EmptyState, Notice } from "@/components/ui";

export const metadata = { title: "Quotes" };

export default async function Quotes({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { quotes } = await loadWorkspace();
  const sp = await searchParams;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl sm:text-5xl">Quotes</h1>
        <div className="flex gap-2"><a className="btn btn-ghost" href="/api/export">Export CSV</a><Link href="/app/quotes/new" className="btn btn-primary" data-tour="add-quote">Add a quote</Link></div>
      </div>
      {sp.deleted && <Notice kind="ok">Quote deleted.</Notice>}
      {quotes.length ? <QuoteBrowser quotes={quotes} /> : <EmptyState title="No quotes yet" body="Add a quote you've sent, or import a spreadsheet." action={<Link href="/app/quotes/new" className="btn btn-primary">Add a quote</Link>} />}
    </div>
  );
}
