import { describe, expect, it } from "vitest";
import { checkCaption, composeCaption, normalizeHashtags } from "./captions";
import { suggestHashtags, templateDrafts } from "./templates";

describe("hashtags", () => {
  it("normalizes, dedupes and strips symbols", () => {
    expect(normalizeHashtags("#Web-Dev, #webdev  freelance ##SaaS!")).toEqual(["webdev", "freelance", "saas"]);
  });
  it("does not duplicate tags already in the caption", () => {
    expect(composeCaption("Hi #saas", ["saas", "freelance"])).toBe("Hi #saas\n\n#freelance");
  });
  it("enforces Instagram's 5-tag cap including inline tags", () => {
    const r = checkCaption("instagram", "#a #b #c", ["d", "e", "f"]);
    expect(r.ok).toBe(false);
    expect(r.tagCount).toBe(6);
  });
  it("counts length including hashtags", () => {
    expect(checkCaption("instagram", "x".repeat(2195), ["abcdef"]).ok).toBe(false);
  });
});

describe("templates", () => {
  it("respects the platform cap and mixes audiences", () => {
    const t = suggestHashtags(["freelancers", "uk"], "instagram");
    expect(t.length).toBe(5);
    expect(t).toContain("ukbusiness");
  });
  it("produces three valid drafts", () => {
    const d = templateDrafts({ brief: "quoterevive reminds you to follow up", goal: "product", tone: "bold", platform: "instagram", audiences: ["saas"] });
    expect(d).toHaveLength(3);
    for (const x of d) expect(checkCaption("instagram", x.caption, x.hashtags).ok).toBe(true);
  });
});
