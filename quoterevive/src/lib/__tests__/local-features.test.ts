import { describe, expect, it } from "vitest";
import { quoteSchema, itemsTotal } from "../validation";
import { computeMetrics } from "../metrics";
import { buildMessage } from "../templates";
import { etbWithPromo, ETB_PRICE } from "../offer";
import type { Activity, Quote } from "../types";

const base = { customer_name: "Sara M.", title: "Website", amount: "100", currency: "ETB", status: "sent" };

describe("line items", () => {
  it("sets the amount to the sum of the lines", () => {
    const r = quoteSchema.safeParse({ ...base, items: JSON.stringify([{ d: "Design", q: 2, p: 1500 }, { d: "Hosting", q: 1, p: 999.5 }]) });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.amount).toBe(3999.5); expect(r.data.items).toHaveLength(2); }
  });
  it("ignores blank lines and keeps the typed amount when there are none", () => {
    const r = quoteSchema.safeParse({ ...base, items: JSON.stringify([{ d: " ", q: 1, p: 5 }]) });
    expect(r.success && r.data.amount).toBe(100);
  });
  it("rejects negative prices and broken JSON", () => {
    expect(quoteSchema.safeParse({ ...base, items: JSON.stringify([{ d: "X", q: 1, p: -1 }]) }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...base, items: "{oops" }).success).toBe(false);
  });
  it("rounds to cents", () => expect(itemsTotal([{ d: "a", q: 3, p: 0.1 }])).toBe(0.3));
});

describe("won back", () => {
  const q = (id: string, status: string, updated: string): Quote => ({ id, customer_name: "A", customer_email: null, customer_phone: null, title: "T", description: null, amount: 1000, currency: "ETB", sent_at: "2026-11-01", expires_at: null, status: status as Quote["status"], next_follow_up_at: null, notes: null, archived: false, opted_out: false, created_at: "2026-11-01T00:00:00Z", updated_at: updated });
  const a = (quote_id: string, kind: Activity["kind"], at: string, to?: string): Activity => ({ id: quote_id + kind + at, business_id: "b", quote_id, kind, channel: null, summary: null, from_status: null, to_status: to ?? null, contributed_to_sale: null, occurred_at: at } as Activity);
  it("counts accepted quotes only when a follow-up came before acceptance", () => {
    const quotes = [q("1", "accepted", "2026-11-10T10:00:00Z"), q("2", "accepted", "2026-11-10T10:00:00Z"), q("3", "sent", "2026-11-10T10:00:00Z")];
    const acts = [a("1", "follow_up", "2026-11-05T09:00:00Z"), a("1", "status_change", "2026-11-09T09:00:00Z", "accepted"),
                  a("2", "status_change", "2026-11-04T09:00:00Z", "accepted"), a("2", "follow_up", "2026-11-06T09:00:00Z")];
    const m = computeMetrics(quotes, acts, "2026-11-15", "ETB");
    expect(m.wonBack).toEqual({ count: 1, value: 1000, thisMonthCount: 1, thisMonthValue: 1000 });
  });
});

describe("Amharic", () => {
  it("writes every tone in Amharic with the customer's name and the job", () => {
    for (const tone of ["friendly", "professional", "concise", "final"] as const) {
      const m = buildMessage({ customer_name: "Sara M.", title: "Shop sign", sent_at: "2026-11-10" }, tone, { todayIso: "2026-11-15", lang: "am", businessName: "Abebe Signs" });
      expect(m).toContain("Sara"); expect(m).toContain("Shop sign"); expect(m).toMatch(/[ሀ-፿]/);
    }
  });
});

describe("ETB price", () => {
  it("halves with FIRST6", () => expect(etbWithPromo(true)).toBe(Math.round(ETB_PRICE / 2)));
});
