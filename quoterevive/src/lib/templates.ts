/** Deterministic follow-up message templates (no AI, no cost). */
import { daysBetween } from "./dates";
import { Quote } from "./types";

export const TONES = ["friendly", "professional", "concise", "final"] as const;
export type Tone = (typeof TONES)[number];
export const TONE_LABEL: Record<Tone, string> = {
  friendly: "Friendly",
  professional: "Professional",
  concise: "Concise",
  final: "Final check-in",
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function when(sentAt: string | null, todayIso: string): string {
  if (!sentAt) return "recently";
  const d = daysBetween(sentAt, todayIso);
  if (d <= 1) return "yesterday";
  if (d < 7) return "a few days ago";
  if (d < 14) return "last week";
  return "a little while ago";
}

export function buildMessage(
  quote: Pick<Quote, "customer_name" | "title" | "sent_at">,
  tone: Tone,
  opts: { businessName?: string; todayIso: string; previousFollowUps?: number },
): string {
  const name = firstName(quote.customer_name);
  const item = quote.title.trim() || "quotation";
  const ago = when(quote.sent_at, opts.todayIso);
  const sign = opts.businessName ? `\n\n— ${opts.businessName}` : "";
  const again = (opts.previousFollowUps ?? 0) > 0;

  switch (tone) {
    case "friendly":
      return `Hey ${name}, ${again ? "just following up again" : "just checking in"} about the ${item} quotation I sent ${ago}. Happy to answer any questions or adjust the scope if needed.${sign}`;
    case "professional":
      return `Hello ${name},\n\nI'm following up on the quotation for ${item} sent ${ago}. Please let me know if you have any questions, or if you'd like any changes to the scope or timeline.\n\nKind regards${opts.businessName ? `,\n${opts.businessName}` : ""}`;
    case "concise":
      return `Hi ${name}, any thoughts on the ${item} quote? Happy to help with questions.${sign}`;
    case "final":
      return `Hi ${name}, I wanted to check in one last time about the ${item} quotation. If now isn't the right time, no problem at all — just let me know and I'll close it on my side. You're always welcome to reach out later.${sign}`;
  }
}

/** wa.me link: opens WhatsApp with prefilled text. Does NOT send anything. */
export function whatsappLink(phone: string | null, text: string): string {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(email: string | null, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
