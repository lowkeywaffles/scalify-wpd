import { daysBetween } from "./dates";
import { Activity, Quote } from "./types";
import { dailyQueue, isActive } from "./engine";

export interface Metrics {
  outstandingValue: number;
  acceptedValue: number;
  /** Accepted value where the user marked a follow-up as contributing. Self-reported, not proven. */
  followUpAttributedValue: number;
  needsFollowUp: number;
  awaitingResponse: number;
  followUpsCompleted: number;
  /** accepted / (accepted + rejected + expired); null when no decided quotes. */
  acceptanceRate: number | null;
  /** Share of scheduled follow-ups (due up to today) that were completed. */
  followUpCompletionRate: number | null;
  aging: { label: string; count: number; value: number }[];
}

/** Amounts are summed only for quotes in `currency`; others are ignored to avoid mixing currencies. */
export function computeMetrics(quotes: Quote[], activities: Activity[], todayIso: string, currency: string): Metrics {
  const live = quotes.filter((q) => !q.archived);
  const same = (q: Quote) => q.currency === currency;
  const active = live.filter(isActive);
  const accepted = live.filter((q) => q.status === "accepted");
  const decided = live.filter((q) => ["accepted", "rejected", "expired"].includes(q.status));
  const quoteIds = new Set(live.map((q) => q.id));
  const acts = activities.filter((a) => quoteIds.has(a.quote_id));
  const followUps = acts.filter((a) => a.kind === "follow_up");
  const attributed = new Set(acts.filter((a) => a.contributed_to_sale).map((a) => a.quote_id));
  const due = dailyQueue(live, todayIso);

  const buckets = [
    { label: "0–7 days", min: 0, max: 7 },
    { label: "8–14 days", min: 8, max: 14 },
    { label: "15–30 days", min: 15, max: 30 },
    { label: "30+ days", min: 31, max: Infinity },
  ];
  const awaiting = active.filter((q) => q.sent_at);
  const aging = buckets.map((b) => {
    const inB = awaiting.filter((q) => {
      const age = daysBetween(q.sent_at!, todayIso);
      return age >= b.min && age <= b.max;
    });
    return { label: b.label, count: inB.length, value: inB.filter(same).reduce((s, q) => s + q.amount, 0) };
  });

  const scheduledTotal = followUps.length + due.length;
  return {
    outstandingValue: active.filter(same).reduce((s, q) => s + q.amount, 0),
    acceptedValue: accepted.filter(same).reduce((s, q) => s + q.amount, 0),
    followUpAttributedValue: accepted.filter((q) => same(q) && attributed.has(q.id)).reduce((s, q) => s + q.amount, 0),
    needsFollowUp: due.length,
    awaitingResponse: active.filter((q) => ["sent", "awaiting_response", "follow_up_due"].includes(q.status)).length,
    followUpsCompleted: followUps.length,
    acceptanceRate: decided.length ? accepted.length / decided.length : null,
    followUpCompletionRate: scheduledTotal ? followUps.length / scheduledTotal : null,
    aging,
  };
}
