/** Habit features: follow-up streak and weekly recovery score. Simple, visible rules. */
import { addDays, daysBetween } from "./dates";
import { Activity } from "./types";

/** Consecutive days with at least one recorded follow-up, ending today (or yesterday if none yet today). */
export function followUpStreak(activities: Activity[], todayIso: string): { days: number; doneToday: boolean } {
  const days = new Set(activities.filter((a) => a.kind === "follow_up").map((a) => a.occurred_at.slice(0, 10)));
  const doneToday = days.has(todayIso);
  let cursor = doneToday ? todayIso : addDays(todayIso, -1);
  let n = 0;
  while (days.has(cursor)) { n++; cursor = addDays(cursor, -1); }
  return { days: n, doneToday };
}

export const SCORE_RULES = { follow_up: 10, customer_response: 5, accepted: 25 } as const;

/** Points in the last 7 days (today included): 10 per follow-up, 5 per reply logged, 25 per accepted quote. */
export function weeklyScore(activities: Activity[], todayIso: string): { points: number; followUps: number; replies: number; accepted: number } {
  const recent = activities.filter((a) => { const d = daysBetween(a.occurred_at.slice(0, 10), todayIso); return d >= 0 && d < 7; });
  const followUps = recent.filter((a) => a.kind === "follow_up").length;
  const replies = recent.filter((a) => a.kind === "customer_response").length;
  const accepted = recent.filter((a) => a.kind === "status_change" && a.to_status === "accepted").length;
  return { points: followUps * SCORE_RULES.follow_up + replies * SCORE_RULES.customer_response + accepted * SCORE_RULES.accepted, followUps, replies, accepted };
}
