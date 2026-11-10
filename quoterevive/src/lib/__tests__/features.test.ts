import { describe, expect, it } from "vitest";
import { buildMessage, LANGUAGES, TONES } from "../templates";
import { coachTips, OBJECTIONS } from "../coach";
import { followUpStreak, weeklyScore } from "../progress";
import { Activity, Quote } from "../types";

const q = (o: Partial<Quote> = {}): Quote => ({ id: "q", customer_name: "Sarah Lee", customer_email: null, customer_phone: null, title: "website", description: null, amount: 1000, currency: "USD", sent_at: "2026-01-01", expires_at: null, status: "awaiting_response", next_follow_up_at: null, notes: null, archived: false, opted_out: false, created_at: "", updated_at: "", ...o });
const a = (day: string, kind: Activity["kind"] = "follow_up", o: Partial<Activity> = {}): Activity => ({ id: Math.random().toString(), quote_id: "q", kind, channel: null, summary: null, from_status: null, to_status: null, contributed_to_sale: null, occurred_at: `${day}T10:00:00Z`, ...o });

describe("multilingual templates", () => {
  it("every language and tone includes name and item", () => {
    for (const lang of LANGUAGES) for (const tone of TONES) {
      const m = buildMessage(q(), tone, { todayIso: "2026-01-09", lang, businessName: "Studio" });
      expect(m).toContain("Sarah");
      expect(m).toContain("website");
      expect(m).toContain("Studio");
    }
  });
  it("English default unchanged", () => {
    expect(buildMessage(q({ sent_at: "2026-01-02" }), "friendly", { todayIso: "2026-01-10" })).toMatch(/^Hey Sarah, just checking in about the website quotation I sent last week\./);
  });
  it("localises time phrases", () => {
    expect(buildMessage(q(), "friendly", { todayIso: "2026-01-09", lang: "fr" })).toContain("la semaine dernière");
    expect(buildMessage(q(), "friendly", { todayIso: "2026-01-09", lang: "es" })).toContain("la semana pasada");
    expect(buildMessage(q(), "friendly", { todayIso: "2026-01-09", lang: "ar" })).toContain("الأسبوع الماضي");
  });
});

describe("coach", () => {
  it("suggests adding contact details and deadline", () => {
    const ids = coachTips(q({ expires_at: "2026-01-12" }), [], "2026-01-09").map((t) => t.id);
    expect(ids).toContain("contact");
    expect(ids).toContain("deadline");
  });
  it("suggests changing channel after two follow-ups and caps at 3 tips", () => {
    const tips = coachTips(q({ status: "negotiating", sent_at: "2025-12-01", amount: 5000 }), [a("2025-12-05"), a("2025-12-10")], "2026-01-09", 1000);
    expect(tips.map((t) => t.id)).toContain("contact");
    expect(tips.length).toBeLessThanOrEqual(3);
  });
  it("default tip when nothing applies", () => {
    expect(coachTips(q({ customer_email: "x@y.z", sent_at: "2026-01-05" }), [], "2026-01-09")[0].id).toBe("default");
  });
  it("objection replies are personalised", () => {
    for (const o of OBJECTIONS) expect(o.text("Sarah", "website")).toMatch(/Sarah.*website/);
  });
});

describe("progress", () => {
  it("streak counts consecutive days, today or yesterday", () => {
    expect(followUpStreak([a("2026-01-09"), a("2026-01-08"), a("2026-01-07"), a("2026-01-05")], "2026-01-09")).toEqual({ days: 3, doneToday: true });
    expect(followUpStreak([a("2026-01-08"), a("2026-01-07")], "2026-01-09")).toEqual({ days: 2, doneToday: false });
    expect(followUpStreak([a("2026-01-06")], "2026-01-09").days).toBe(0);
  });
  it("weekly score uses last 7 days only", () => {
    const s = weeklyScore([a("2026-01-09"), a("2026-01-03"), a("2026-01-02"), a("2026-01-08", "customer_response"), a("2026-01-08", "status_change", { to_status: "accepted" })], "2026-01-09");
    expect(s).toEqual({ points: 10 + 10 + 5 + 25, followUps: 2, replies: 1, accepted: 1 });
  });
});
