/** Rule-based message coach: explainable tips and objection replies. No AI, no cost. */
import { daysBetween, formatDate } from "./dates";
import { Activity, Quote } from "./types";

export interface Tip { id: string; text: string }

export function coachTips(quote: Quote, activities: Activity[], todayIso: string, typicalValue = 0): Tip[] {
  const tips: Tip[] = [];
  const followUps = activities.filter((a) => a.kind === "follow_up").length;
  const age = quote.sent_at ? daysBetween(quote.sent_at, todayIso) : null;
  if (!quote.customer_phone && !quote.customer_email) tips.push({ id: "contact", text: "Add their WhatsApp number or email to open a prefilled message in one tap." });
  if (followUps === 0 && age !== null && age < 2) tips.push({ id: "patience", text: "It's only been a day or so. Waiting until day 2–3 usually feels less pushy." });
  if (quote.expires_at) {
    const left = daysBetween(todayIso, quote.expires_at);
    if (left >= 0 && left <= 7) tips.push({ id: "deadline", text: `Mention that the quote is valid until ${formatDate(quote.expires_at)} — a real deadline is a helpful reason to reply.` });
  }
  if (typicalValue > 0 && quote.amount >= typicalValue * 1.5) tips.push({ id: "big", text: "This is a larger quote than usual. Offer a smaller first phase or a payment plan." });
  if (quote.status === "negotiating") tips.push({ id: "negotiating", text: "They're engaged. Ask what's holding them back — price, timing or scope — and offer one clear option." });
  if (age !== null && age >= 14 && followUps < 3) tips.push({ id: "yesno", text: "After two weeks of silence, ask a simple yes/no question so replying takes seconds." });
  if (followUps >= 2) tips.push({ id: "channel", text: "Two follow-ups without a reply: try a quick call, or send the final check-in and close the loop politely." });
  if (!tips.length) tips.push({ id: "default", text: "Keep it short, personal and easy to answer. One question per message works best." });
  return tips.slice(0, 3);
}

export const OBJECTIONS = [
  { id: "price", label: "“It's too expensive”", text: (n: string, item: string) => `Thanks for being honest, ${n}. I can adjust the ${item} quote — for example a smaller first phase, simpler materials, or splitting the payment. Would one of those help?` },
  { id: "think", label: "“I need to think about it”", text: (n: string, item: string) => `Of course, ${n} — take your time. Is there anything about the ${item} quote I can clarify to make the decision easier?` },
  { id: "compare", label: "“I'm comparing quotes”", text: (n: string, item: string) => `Makes sense, ${n}. If it helps, I'm happy to walk you through what's included in the ${item} quote so you can compare like for like.` },
  { id: "timing", label: "“Not the right time”", text: (n: string, item: string) => `No problem, ${n}. When would be a better time to revisit the ${item} project? I can hold this price until then if that helps.` },
] as const;
