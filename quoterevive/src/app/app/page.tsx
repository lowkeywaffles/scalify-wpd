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
import { followUpStreak, weeklyScore } from "@/lib/progress";
import { Flame, Sparkles, Target } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const { business, quotes, activities } = await loadWorkspace();
  if (!business.onboarded_at) redirect("/app/onboarding");
  const t = today();
  const m = computeMetrics(quotes, activities, t, business.currency);
  const queue = buildQueue(quotes, activities, t, business.typical_quote_value).slice(0, 5);
  const streak = followUpStreak(activities, t);
  const score = weeklyScore(activities, t);
  const dueCount = buildQueue(quotes, activities, t, business.typical_quote_value).length;
  const hour = new Date().getUTCHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const otherCurrencies = new Set(quotes.filter((q) => q.currency !== business.currency).map((q) => q.currency));
  return (
    <div className="space-y-8">
      <section aria-labelledby="hero-title" data-tour="hero" className="card relative overflow-hidden p-5 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-muted">{greet}{business.display_name ? `, ${business.display_name.split(" ")[0]}` : ""} · {business.name}</p>
            <h1 id="hero-title" className="mt-1 font-display text-4xl sm:text-5xl">{dueCount ? <>{dueCount} quote{dueCount === 1 ? "" : "s"} <em className="text-accent">waiting on you</em></> : <>You&apos;re <em className="text-accent">all caught up</em></>}</h1>
            <div className="mt-5 flex flex-wrap gap-2">
              {dueCount > 0 && <Link href="/app/queue" className="btn btn-primary">Start today&apos;s follow-ups</Link>}
              <Link href="/app/quotes/new" className="btn btn-ghost">Add a quote</Link>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-line bg-surface-2/60 p-3 sm:p-4" title="Days in a row with at least one follow-up">
              <dt className="flex items-center gap-1 text-xs text-muted"><Flame className="h-3.5 w-3.5 text-warn" aria-hidden="true" />Streak</dt>
              <dd className="mt-1 font-display text-3xl">{streak.days}<span className="text-base text-muted"> day{streak.days === 1 ? "" : "s"}</span></dd>
              <dd className="text-[11px] text-muted">{streak.doneToday ? "Done today ✓" : streak.days ? "Follow up today to keep it" : "Send one to start"}</dd>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/60 p-3 sm:p-4" title="10 per follow-up, 5 per reply logged, 25 per accepted quote — last 7 days">
              <dt className="flex items-center gap-1 text-xs text-muted"><Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />Weekly score</dt>
              <dd className="mt-1 font-display text-3xl">{score.points}</dd>
              <dd className="text-[11px] text-muted">{score.followUps} follow-ups · {score.accepted} won</dd>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/60 p-3 sm:p-4">
              <dt className="flex items-center gap-1 text-xs text-muted"><Target className="h-3.5 w-3.5 text-good" aria-hidden="true" />Due today</dt>
              <dd className="mt-1 font-display text-3xl">{dueCount}</dd>
              <dd className="text-[11px] text-muted">in your queue</dd>
            </div>
          </dl>
        </div>
      </section>
      {quotes.length === 0 ? (
        <EmptyState title="No quotes yet" body="Add the quotes you've sent recently — even ones from weeks ago. QuoteRevive will tell you who to follow up with first." action={<div className="flex gap-2"><Link href="/app/quotes/new" className="btn btn-primary">Add your first quote</Link><Link href="/app/import" className="btn btn-ghost">Import CSV</Link></div>} />
      ) : (
        <>
          <div data-tour="metrics"><MetricsGrid m={m} currency={business.currency} /></div>
          {otherCurrencies.size > 0 && <p className="text-xs text-muted">Totals include only {business.currency} quotes. {[...otherCurrencies].join(", ")} quotes are counted but not summed.</p>}
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section aria-labelledby="urgent" data-tour="urgent">
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
