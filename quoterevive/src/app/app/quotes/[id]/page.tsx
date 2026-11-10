import { notFound } from "next/navigation";
import { z } from "zod";
import { loadWorkspace } from "@/lib/data";
import { formatMoney, today, daysBetween } from "@/lib/dates";
import { recommendFollowUp } from "@/lib/engine";
import { FollowUpAssistant } from "@/components/FollowUpAssistant";
import { QuoteActions } from "@/components/QuoteActions";
import { QuoteForm } from "@/components/QuoteForm";
import { Timeline } from "@/components/Timeline";
import { Notice, StatusBadge } from "@/components/ui";
import { recordActivity, setShareLink } from "../../actions";
import { coachTips } from "@/lib/coach";
import { publicEnv } from "@/lib/env";

export const metadata = { title: "Quote" };

export default async function QuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { business, quotes, activities } = await loadWorkspace();
  const quote = quotes.find((q) => q.id === id);
  if (!quote) notFound();
  const acts = activities.filter((a) => a.quote_id === id);
  const t = today();
  const rec = recommendFollowUp(quote, acts, { firstFollowUpDays: business.first_follow_up_days, followUpIntervalDays: business.follow_up_interval_days, maxFollowUps: business.max_follow_ups });
  const sp = await searchParams;
  return (
    <div className="space-y-6">
      {sp.created && <Notice kind="ok">Quote saved{quote.next_follow_up_at ? ` — follow-up scheduled for ${quote.next_follow_up_at}` : ""}.</Notice>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{quote.title}</p>
          <h1 className="font-display text-4xl">{quote.customer_name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2"><StatusBadge status={quote.status} /><span className="tabular-nums">{formatMoney(quote.amount, quote.currency)}</span>
            {quote.sent_at && <span className="text-sm text-muted">· waiting {daysBetween(quote.sent_at, t)} days</span>}</p>
        </div>
        <QuoteActions id={quote.id} archived={quote.archived} optedOut={quote.opted_out} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <FollowUpAssistant quote={quote} businessName={business.name} previousFollowUps={acts.filter((a) => a.kind === "follow_up").length} todayIso={t} recommended={rec} onRecord={recordActivity} defaultChannel={business.preferred_channel}
          defaultLang={business.message_language ?? "en"} tips={coachTips(quote, acts, t, business.typical_quote_value)}
          share={{ url: quote.share_enabled && quote.share_token ? `${publicEnv.siteUrl}/q/${quote.share_token}` : null, onChange: setShareLink.bind(null, quote.id), base: publicEnv.siteUrl }} />
        <section className="card p-4 sm:p-6" aria-labelledby="tl" data-tour="timeline"><h2 id="tl" className="mb-4 font-display text-2xl">Timeline</h2><Timeline activities={acts} /></section>
      </div>
      <details className="group">
        <summary className="cursor-pointer list-none font-semibold"><span className="btn btn-ghost">Edit quote details</span></summary>
        <div className="mt-4"><QuoteForm quote={quote} currency={business.currency} /></div>
      </details>
      <p className="text-xs text-muted">Attachments are not supported yet — keep the quote PDF in your own files.</p>
    </div>
  );
}
