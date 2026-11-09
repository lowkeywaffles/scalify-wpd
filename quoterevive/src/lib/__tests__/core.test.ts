import { describe, expect, it } from "vitest";
import { addDays, daysBetween } from "../dates";
import { dailyQueue, priorityScore, recommendFollowUp } from "../engine";
import { buildMessage, mailtoLink, whatsappLink } from "../templates";
import { computeMetrics } from "../metrics";
import { csvCell, guessMapping, parseCsv, toCsv, validateImport } from "../csv";
import { quoteSchema } from "../validation";
import { Activity, Quote } from "../types";
import { verifyStandardWebhook, signStandardWebhook } from "../webhook";

const q = (over: Partial<Quote> = {}): Quote => ({
  id: "q1", customer_name: "Sarah Example", customer_email: null, customer_phone: null,
  title: "website", description: null, amount: 1000, currency: "USD",
  sent_at: "2026-01-01", expires_at: null, status: "awaiting_response",
  next_follow_up_at: null, notes: null, archived: false, opted_out: false,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", ...over,
});
const act = (over: Partial<Activity>): Activity => ({
  id: Math.random().toString(), quote_id: "q1", kind: "follow_up", channel: "email", summary: null,
  from_status: null, to_status: null, contributed_to_sale: null, occurred_at: "2026-01-04T10:00:00Z", ...over,
});

describe("dates", () => {
  it("adds and diffs days", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
    expect(daysBetween("2026-01-01", "2026-01-11")).toBe(10);
  });
});

describe("recommendFollowUp", () => {
  it("first follow-up after N days", () => {
    expect(recommendFollowUp(q(), []).date).toBe("2026-01-04");
  });
  it("uses interval after last follow-up", () => {
    expect(recommendFollowUp(q(), [act({})]).date).toBe("2026-01-09");
  });
  it("pulls in before expiry", () => {
    expect(recommendFollowUp(q({ expires_at: "2026-01-04" }), []).date).toBe("2026-01-02");
  });
  it("stops after max follow-ups with no reply", () => {
    const acts = [1, 2, 3].map((d) => act({ occurred_at: `2026-01-0${d + 1}T00:00:00Z` }));
    expect(recommendFollowUp(q(), acts).date).toBeNull();
  });
  it("resets the count after a customer response", () => {
    const acts = [act({ occurred_at: "2026-01-02T00:00:00Z" }), act({ occurred_at: "2026-01-03T00:00:00Z" }), act({ occurred_at: "2026-01-04T00:00:00Z" }), act({ kind: "customer_response", occurred_at: "2026-01-05T00:00:00Z" })];
    expect(recommendFollowUp(q(), acts).date).toBe("2026-01-04");
  });
  it.each(["accepted", "rejected", "expired", "draft"] as const)("none for %s", (status) => {
    expect(recommendFollowUp(q({ status }), []).date).toBeNull();
  });
  it("none for archived or opted-out", () => {
    expect(recommendFollowUp(q({ archived: true }), []).date).toBeNull();
    expect(recommendFollowUp(q({ opted_out: true }), []).date).toBeNull();
  });
});

describe("priority + queue", () => {
  it("scores overdue, expiring quotes higher and explains points", () => {
    const urgent = priorityScore(q({ next_follow_up_at: "2026-01-05", expires_at: "2026-01-12" }), [], "2026-01-10", 500);
    const calm = priorityScore(q({ sent_at: "2026-01-09" }), [act({})], "2026-01-10");
    expect(urgent.score).toBeGreaterThan(calm.score);
    expect(urgent.score).toBe(urgent.factors.reduce((s, f) => s + f.points, 0) > 100 ? 100 : urgent.factors.reduce((s, f) => s + f.points, 0));
  });
  it("closed quotes score 0", () => {
    expect(priorityScore(q({ status: "accepted" }), [], "2026-01-10").score).toBe(0);
  });
  it("queue includes due and overdue only", () => {
    const list = [q({ id: "a", next_follow_up_at: "2026-01-10" }), q({ id: "b", next_follow_up_at: "2026-01-11" }), q({ id: "c", next_follow_up_at: "2026-01-01", status: "accepted" })];
    expect(dailyQueue(list, "2026-01-10").map((x) => x.id)).toEqual(["a"]);
  });
});

describe("templates", () => {
  it("personalises with first name and item", () => {
    const m = buildMessage(q({ sent_at: "2026-01-02" }), "friendly", { todayIso: "2026-01-10" });
    expect(m).toBe("Hey Sarah, just checking in about the website quotation I sent last week. Happy to answer any questions or adjust the scope if needed.");
  });
  it("encodes links", () => {
    expect(whatsappLink("+1 (555) 010-0000", "a b&c")).toBe("https://wa.me/15550100000?text=a%20b%26c");
    expect(mailtoLink("x@y.z", "S", "B")).toBe("mailto:x%40y.z?subject=S&body=B");
  });
});

describe("metrics", () => {
  it("separates outstanding from accepted and computes rates", () => {
    const quotes = [
      q({ id: "1", amount: 100 }),
      q({ id: "2", amount: 200, status: "accepted" }),
      q({ id: "3", amount: 300, status: "rejected" }),
      q({ id: "4", amount: 999, currency: "EUR" }),
      q({ id: "5", amount: 50, archived: true }),
      q({ id: "6", amount: 70, next_follow_up_at: "2026-01-10" }),
    ];
    const acts = [act({ quote_id: "2", contributed_to_sale: true })];
    const m = computeMetrics(quotes, acts, "2026-01-10", "USD");
    expect(m.outstandingValue).toBe(170);
    expect(m.acceptedValue).toBe(200);
    expect(m.followUpAttributedValue).toBe(200);
    expect(m.acceptanceRate).toBe(0.5);
    expect(m.needsFollowUp).toBe(1);
    expect(m.followUpsCompleted).toBe(1);
    expect(m.followUpCompletionRate).toBe(0.5);
    expect(m.aging[0].count).toBe(0);
    expect(m.aging[1].count).toBe(3); // 9 days old, incl. EUR quote count
    expect(m.aging[1].value).toBe(170);
  });
  it("null rates when no data", () => {
    const m = computeMetrics([], [], "2026-01-10", "USD");
    expect(m.acceptanceRate).toBeNull();
    expect(m.followUpCompletionRate).toBeNull();
  });
});

describe("csv", () => {
  it("parses quoted fields and round-trips", () => {
    const text = toCsv(["a", "b"], [["x, y", 'he said "hi"'], ["line\nbreak", ""]]);
    expect(parseCsv(text)).toEqual([["a", "b"], ["x, y", 'he said "hi"'], ["line\nbreak", ""]]);
  });
  it("neutralises formula injection", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
  });
  it("maps headers and reports row-level errors", () => {
    const rows = parseCsv("Client,Project,Amount,Date Sent\nAna,Sign,\"1,200\",2026-01-02\n,Banner,abc,02/01/2026\n");
    const map = guessMapping(rows[0]);
    const res = validateImport(rows, map, "ETB");
    expect(res[0]).toMatchObject({ ok: true, line: 2, data: { amount: 1200, currency: "ETB", status: "sent" } });
    expect(res[1].ok).toBe(false);
    if (!res[1].ok) expect(res[1].errors.length).toBe(3);
  });
});

describe("quoteSchema", () => {
  it("rejects expiry before sent", () => {
    const r = quoteSchema.safeParse({ customer_name: "A", title: "B", amount: "5", currency: "usd", status: "sent", sent_at: "2026-02-01", expires_at: "2026-01-01" });
    expect(r.success).toBe(false);
  });
  it("normalises optional blanks to null", () => {
    const r = quoteSchema.parse({ customer_name: "A", title: "B", amount: "5", currency: "usd", status: "sent", customer_email: "" });
    expect(r.customer_email).toBeNull();
    expect(r.currency).toBe("USD");
  });
});

describe("webhook signature", () => {
  const secret = "ws_test_secret";
  it("accepts valid and rejects tampered / stale", () => {
    const now = 1_800_000_000;
    const body = '{"type":"membership.activated"}';
    const sig = signStandardWebhook(secret, "evt_1", now, body);
    const h = { id: "evt_1", timestamp: String(now), signature: `v1,${sig}` };
    expect(verifyStandardWebhook(secret, h, body, now)).toBe(true);
    expect(verifyStandardWebhook(secret, h, body + " ", now)).toBe(false);
    expect(verifyStandardWebhook(secret, h, body, now + 600)).toBe(false);
    expect(verifyStandardWebhook(secret, { ...h, signature: "v1,AAAA v1," + sig }, body, now)).toBe(true);
  });
});
