import { dailyQueue, priorityScore } from "./engine";
import { Metrics } from "./metrics";
import { Activity, Quote } from "./types";
import type { QueueItem } from "@/components/QueueList";

export function buildQueue(quotes: Quote[], activities: Activity[], todayIso: string, typical: number): QueueItem[] {
  return dailyQueue(quotes, todayIso)
    .map((quote) => ({ quote, priority: priorityScore(quote, activities.filter((a) => a.quote_id === quote.id), todayIso, typical) }))
    .sort((a, b) => b.priority.score - a.priority.score);
}

export function nextSteps(quotes: Quote[], m: Metrics): string[] {
  const steps: string[] = [];
  if (m.needsFollowUp) steps.push(`Send ${m.needsFollowUp} follow-up${m.needsFollowUp === 1 ? "" : "s"} from today's queue.`);
  const noDate = quotes.filter((q) => !q.archived && !["accepted", "rejected", "expired", "draft"].includes(q.status) && !q.next_follow_up_at).length;
  if (noDate) steps.push(`${noDate} open quote${noDate === 1 ? " has" : "s have"} no follow-up date — schedule one.`);
  const old = m.aging[3].count;
  if (old) steps.push(`${old} quote${old === 1 ? " is" : "s are"} 30+ days old. Send a final check-in or mark them expired.`);
  if (!steps.length) steps.push("You're up to date. Add new quotes as you send them.");
  return steps;
}
