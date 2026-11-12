export type Platform = "instagram" | "tiktok";

/** Platform rules the Studio enforces. Instagram reduced the hashtag cap to 5 per post/Reel (Dec 2025 rollout). */
export const LIMITS: Record<Platform, { caption: number; hashtags: number }> = {
  instagram: { caption: 2200, hashtags: 5 },
  tiktok: { caption: 2200, hashtags: 10 },
};

/** "#Web Dev, freelance  #SaaS" -> ["webdev","freelance","saas"]. Letters, digits, underscore; deduped; case-insensitive. */
export function normalizeHashtags(input: string | string[]): string[] {
  const parts = Array.isArray(input) ? input : input.split(/[\s,]+/);
  const out: string[] = [];
  for (const p of parts) {
    const tag = p.replace(/^#+/, "").normalize("NFKC").replace(/[^\p{L}\p{N}_]/gu, "").toLowerCase();
    if (tag && tag.length <= 60 && !out.includes(tag)) out.push(tag);
  }
  return out;
}

/** Hashtags written inside the caption body itself (Instagram counts these toward the cap too). */
export function inlineHashtags(caption: string): string[] {
  return normalizeHashtags(caption.match(/#[\p{L}\p{N}_]+/gu) ?? []);
}

export function composeCaption(caption: string, hashtags: string[]): string {
  const body = caption.trim();
  const inline = new Set(inlineHashtags(body));
  const extra = hashtags.filter((h) => !inline.has(h)).map((h) => `#${h}`).join(" ");
  return extra ? (body ? `${body}\n\n${extra}` : extra) : body;
}

export type CaptionCheck = { ok: boolean; problems: string[]; length: number; tagCount: number };

export function checkCaption(platform: Platform, caption: string, hashtags: string[]): CaptionCheck {
  const full = composeCaption(caption, hashtags);
  const tags = new Set([...inlineHashtags(caption), ...hashtags]);
  const lim = LIMITS[platform];
  const problems: string[] = [];
  if ([...full].length > lim.caption) problems.push(`Caption is ${[...full].length} characters; ${platform === "instagram" ? "Instagram" : "TikTok"} allows ${lim.caption} (hashtags included).`);
  if (tags.size > lim.hashtags) problems.push(`${tags.size} hashtags; use at most ${lim.hashtags} on ${platform === "instagram" ? "Instagram" : "TikTok"}.`);
  return { ok: problems.length === 0, problems, length: [...full].length, tagCount: tags.size };
}
