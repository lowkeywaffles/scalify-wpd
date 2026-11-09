/**
 * Explainable follow-up rules. These are simple, documented heuristics —
 * NOT a prediction of whether a customer will buy.
 */
import { addDays, daysBetween } from "./dates";
import { Activity, CLOSED_STATUSES, Quote } from "./types";

export interface Preferences {
  /** Days after sending before the first follow-up. */
  firstFollowUpDays: number;
  /** Days between later follow-ups. */
  followUpIntervalDays: number;
  /** Stop recommending after this many follow-ups without a reply. */
  maxFollowUps: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  firstFollowUpDays: 3,
  followUpIntervalDays: 5,
  maxFollowUps: 3,
};

export function isActive(q: Pick<Quote, "status" | "archived" | "opted_out">): boolean {
  return !q.archived && !q.opted_out && !CLOSED_STATUSES.includes(q.status) && q.status !== "draft";
}

function followUpsSinceLastResponse(activities: Activity[]): Activity[] {
  const sorted = [...activities].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  const lastResponse = sorted.map((a) => a.kind).lastIndexOf("customer_response");
  return sorted.slice(lastResponse + 1).filter((a) => a.kind === "follow_up");
}

export interface Recommendation {
  date: string | null;
  reason: string;
}

/** Recommend the next follow-up date with a human-readable reason. */
export function recommendFollowUp(
  quote: Quote,
  activities: Activity[],
  prefs: Preferences = DEFAULT_PREFERENCES,
): Recommendation {
  if (!isActive(quote)) return { date: null, reason: "No follow-up: quote is closed, archived, opted out or a draft." };
  if (!quote.sent_at) return { date: null, reason: "Add the date the quote was sent to get a recommendation." };

  const pending = followUpsSinceLastResponse(activities);
  if (pending.length >= prefs.maxFollowUps) {
    return { date: null, reason: `Stopped after ${prefs.maxFollowUps} follow-ups without a reply, to avoid over-messaging.` };
  }
  const last = pending.at(-1);
  let date = last
    ? addDays(last.occurred_at.slice(0, 10), prefs.followUpIntervalDays)
    : addDays(quote.sent_at, prefs.firstFollowUpDays);
  let reason = last
    ? `${prefs.followUpIntervalDays} days after your last follow-up.`
    : `${prefs.firstFollowUpDays} days after the quote was sent.`;

  if (quote.expires_at) {
    const beforeExpiry = addDays(quote.expires_at, -2);
    if (daysBetween(beforeExpiry, date) > 0 && daysBetween(quote.sent_at, beforeExpiry) >= 0) {
      date = beforeExpiry;
      reason = "2 days before the quote expires.";
    }
  }
  return { date, reason };
}

export interface PriorityFactor {
  label: string;
  points: number;
}
export interface Priority {
  score: number; // 0–100
  factors: PriorityFactor[];
}

/**
 * Recovery Priority Score: ranks how urgently a quote needs attention.
 * Every point is traceable to a listed factor.
 */
export function priorityScore(
  quote: Quote,
  activities: Activity[],
  todayIso: string,
  typicalValue = 0,
): Priority {
  if (!isActive(quote)) return { score: 0, factors: [{ label: "Not active", points: 0 }] };
  const factors: PriorityFactor[] = [];

  if (quote.next_follow_up_at) {
    const overdue = daysBetween(quote.next_follow_up_at, todayIso);
    if (overdue >= 0) factors.push({ label: overdue === 0 ? "Follow-up due today" : `Follow-up ${overdue}d overdue`, points: Math.min(35, 20 + overdue * 3) });
  }
  if (quote.expires_at) {
    const left = daysBetween(todayIso, quote.expires_at);
    if (left < 0) factors.push({ label: "Past expiry date", points: 10 });
    else if (left <= 7) factors.push({ label: `Expires in ${left}d`, points: 25 - left * 2 });
  }
  if (quote.sent_at) {
    const age = daysBetween(quote.sent_at, todayIso);
    if (age > 0) factors.push({ label: `${age}d since sent`, points: Math.min(20, age) });
  }
  if (typicalValue > 0 && quote.amount > typicalValue) {
    factors.push({ label: "Above your typical quote value", points: 10 });
  }
  const followUps = activities.filter((a) => a.kind === "follow_up").length;
  if (followUps === 0 && quote.sent_at) factors.push({ label: "Never followed up", points: 10 });
  if (quote.status === "negotiating") factors.push({ label: "In negotiation", points: 5 });

  const score = Math.min(100, factors.reduce((s, f) => s + f.points, 0));
  return { score, factors };
}

/** Quotes that need attention today: follow-up date reached or passed. */
export function dailyQueue<T extends Quote>(quotes: T[], todayIso: string): T[] {
  return quotes.filter(
    (q) => isActive(q) && q.next_follow_up_at !== null && daysBetween(q.next_follow_up_at, todayIso) >= 0,
  );
}
