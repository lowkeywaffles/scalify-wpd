import { describe, expect, it, vi } from "vitest";
import { processWhopEvent, Deps } from "../whop-events";

const BIZ = "11111111-2222-4333-8444-555555555555";
const PROD = "prod_x";
function deps(over: Partial<Deps> = {}) {
  const d = {
    productId: PROD,
    getPayment: vi.fn(async () => ({ ok: true as const, value: { status: "paid", product_id: PROD, membership_id: "mem_1", metadata: { qr_business_id: BIZ }, refunded_at: null } })),
    getMembership: vi.fn(async () => ({ ok: true as const, value: { status: "completed", product_id: PROD, metadata: { qr_business_id: BIZ } } })),
    businessIdForEmail: vi.fn(async (): Promise<string | null> => null),
    link: vi.fn(async () => {}),
    setStatus: vi.fn(async () => {}),
    ...over,
  };
  return d;
}

describe("processWhopEvent", () => {
  it("activates a tagged paid payment", async () => {
    const d = deps();
    expect(await processWhopEvent({ type: "payment.succeeded", data: { id: "pay_1" } }, d)).toBe("activated");
    expect(d.link).toHaveBeenCalledWith(BIZ, "mem_1");
    expect(d.setStatus).toHaveBeenCalledWith("mem_1", "active");
  });
  it("ignores other products, unpaid, untagged and bad metadata", async () => {
    for (const value of [
      { status: "paid", product_id: "prod_other", membership_id: "mem_1", metadata: { qr_business_id: BIZ }, refunded_at: null },
      { status: "open", product_id: PROD, membership_id: "mem_1", metadata: { qr_business_id: BIZ }, refunded_at: null },
      { status: "paid", product_id: PROD, membership_id: "mem_1", metadata: null, refunded_at: null },
      { status: "paid", product_id: PROD, membership_id: "mem_1", metadata: { qr_business_id: "'; drop table" }, refunded_at: null },
    ]) {
      const d = deps({ getPayment: vi.fn(async () => ({ ok: true as const, value })) });
      expect(await processWhopEvent({ type: "payment.succeeded", data: { id: "pay_1" } }, d)).toBe("ignored");
      expect(d.link).not.toHaveBeenCalled();
    }
  });
  it("asks for retry when Whop can't be read", async () => {
    const d = deps({ getPayment: vi.fn(async () => ({ ok: false as const, status: 500 })) });
    expect(await processWhopEvent({ type: "payment.succeeded", data: { id: "pay_1" } }, d)).toBe("retry");
  });
  it("revokes when a membership stops granting access", async () => {
    const d = deps({ getMembership: vi.fn(async () => ({ ok: true as const, value: { status: "canceled", product_id: PROD, metadata: { qr_business_id: BIZ } } })) });
    expect(await processWhopEvent({ type: "membership.updated", data: { id: "mem_1" } }, d)).toBe("revoked");
    expect(d.setStatus).toHaveBeenCalledWith("mem_1", "revoked");
    expect(d.link).not.toHaveBeenCalled();
  });
  it("revokes on a completed refund only", async () => {
    const done = deps({ getPayment: vi.fn(async () => ({ ok: true as const, value: { status: "paid", product_id: PROD, membership_id: "mem_1", metadata: null, refunded_at: "2026-11-10T00:00:00Z" } })) });
    expect(await processWhopEvent({ type: "refund.created", data: { payment: { id: "pay_1" } } }, done)).toBe("revoked");
    const pending = deps();
    expect(await processWhopEvent({ type: "refund.created", data: { payment: { id: "pay_1" } } }, pending)).toBe("ignored");
    expect(pending.setStatus).not.toHaveBeenCalled();
  });
  it("trusts the API, not the webhook body", async () => {
    const d = deps();
    await processWhopEvent({ type: "payment.succeeded", data: { id: "pay_1", status: "paid", metadata: { qr_business_id: "attacker" } } }, d);
    expect(d.getPayment).toHaveBeenCalledWith("pay_1");
    expect(d.link).toHaveBeenCalledWith(BIZ, "mem_1");
  });
  it("matches a store purchase (no tag) by the buyer's email", async () => {
    const d = deps({
      getPayment: vi.fn(async () => ({ ok: true as const, value: { status: "paid", product_id: PROD, membership_id: "mem_2", metadata: null, refunded_at: null, customer_email: "Buyer@Example.com" } })),
      businessIdForEmail: vi.fn(async () => BIZ),
    });
    expect(await processWhopEvent({ type: "payment.succeeded", data: { id: "pay_2" } }, d)).toBe("activated");
    expect(d.businessIdForEmail).toHaveBeenCalledWith("Buyer@Example.com");
    expect(d.link).toHaveBeenCalledWith(BIZ, "mem_2");
  });
  it("tag wins over email; no match leaves it for manual linking", async () => {
    const tagged = deps({ businessIdForEmail: vi.fn(async () => "other") });
    await processWhopEvent({ type: "payment.succeeded", data: { id: "pay_1" } }, tagged);
    expect(tagged.businessIdForEmail).not.toHaveBeenCalled();
    const none = deps({ getPayment: vi.fn(async () => ({ ok: true as const, value: { status: "paid", product_id: PROD, membership_id: "mem_3", metadata: null, refunded_at: null, customer_email: "x@y.z" } })) });
    expect(await processWhopEvent({ type: "payment.succeeded", data: { id: "pay_3" } }, none)).toBe("ignored");
  });
  it("ignores unknown events", async () => {
    expect(await processWhopEvent({ type: "member.created", data: {} }, deps())).toBe("ignored");
  });
});
