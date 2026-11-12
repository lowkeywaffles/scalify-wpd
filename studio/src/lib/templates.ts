import type { Platform } from "./captions";

/** Built-in, offline assistant: always available, never sends data anywhere. */
export const AUDIENCES = {
  freelancers: { label: "Freelancers (global)", tags: ["freelancer", "freelancelife", "smallbusiness", "solopreneur", "clientwork", "freelancetips", "workfromanywhere"] },
  usa: { label: "USA", tags: ["smallbusinessusa", "entrepreneur", "contractor", "smallbusinessowner", "sidehustle", "freelanceamerica"] },
  uk: { label: "UK", tags: ["ukbusiness", "ukfreelancer", "smallbusinessuk", "ukentrepreneur", "selfemployeduk"] },
  asia: { label: "Asia", tags: ["freelancerindia", "digitalnomadasia", "smeasia", "startupindia", "philippinesfreelancer"] },
  africa: { label: "Africa / Ethiopia", tags: ["ethiopiantech", "addisababa", "africantech", "madeinethiopia", "africanstartups"] },
  webdev: { label: "Web dev & design", tags: ["webdevelopment", "webdesign", "nextjs", "buildinpublic", "websitedesign", "cybersecurity"] },
  saas: { label: "SaaS / QuoteRevive", tags: ["saas", "quotes", "followup", "salestips", "invoicing", "productivity"] },
} as const;
export type AudienceKey = keyof typeof AUDIENCES;

export const GOALS = {
  product: "Promote a product",
  tip: "Share a useful tip",
  behind: "Behind the scenes",
  offer: "Limited offer",
  service: "Sell a service",
} as const;
export type GoalKey = keyof typeof GOALS;

export const TONES = { friendly: "Friendly", bold: "Bold", calm: "Calm & expert", funny: "Light & funny" } as const;
export type ToneKey = keyof typeof TONES;

const HOOKS: Record<GoalKey, string[]> = {
  product: ["Stop losing work you already quoted for.", "This is the tool we built because we needed it.", "One small habit, more replies."],
  tip: ["Quick tip for anyone who sends quotes:", "Most clients don't say no. They just forget.", "Save this for your next quote."],
  behind: ["Here's what building this looked like this week.", "Behind the screen at Scalify:", "Real progress, no filter."],
  offer: ["Founding offer, while it lasts:", "For our first customers only:", "Early supporters get the best deal."],
  service: ["Need a website that actually brings in clients?", "Your business deserves a fast, secure site.", "We build web apps for small businesses."],
};
const CTAS: Record<GoalKey, string> = {
  product: "Link in bio to try it.",
  tip: "Follow for more practical tips.",
  behind: "Follow along as we build.",
  offer: "Link in bio. Terms on the page.",
  service: "DM us or tap the link in bio.",
};
const TONE_SUFFIX: Record<ToneKey, string> = { friendly: " 🙂", bold: "", calm: "", funny: " 😅" };

/** Picks up to `max` tags from the chosen audiences, round-robin so each audience is represented. */
export function suggestHashtags(audiences: AudienceKey[], platform: Platform, max?: number): string[] {
  const limit = max ?? (platform === "instagram" ? 5 : 6);
  const lists = (audiences.length ? audiences : ["freelancers" as AudienceKey]).map((a) => [...AUDIENCES[a].tags]);
  const out: string[] = [];
  for (let i = 0; out.length < limit && lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (l[i] && !out.includes(l[i]) && out.length < limit) out.push(l[i]);
  }
  return out;
}

export type Draft = { caption: string; hashtags: string[] };

/** Three caption variants from the brief. Deterministic, honest wording only (no invented numbers or claims). */
export function templateDrafts(input: { brief: string; goal: GoalKey; tone: ToneKey; platform: Platform; audiences: AudienceKey[] }): Draft[] {
  const brief = input.brief.trim().replace(/\s+/g, " ");
  const tags = suggestHashtags(input.audiences, input.platform);
  return HOOKS[input.goal].map((hook) => {
    const lines = [hook + TONE_SUFFIX[input.tone]];
    if (brief) lines.push(brief.charAt(0).toUpperCase() + brief.slice(1) + (/[.!?]$/.test(brief) ? "" : "."));
    lines.push(CTAS[input.goal]);
    return { caption: lines.join(input.platform === "tiktok" ? " " : "\n\n"), hashtags: tags };
  });
}
