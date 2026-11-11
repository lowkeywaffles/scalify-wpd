/**
 * Pure decision logic for Whop webhooks (unit-tested). Webhook bodies are only used to learn
 * WHICH object changed; its current state is always re-read from the Whop API.
 */
import { GRANTING_STATUSES } from "./webhook";

export interface Deps {
  productId: string;
  getPayment(id: string): Promise<{ ok: true; value: { status: string; product_id: string | null; membership_id: string | null; metadata?: Record<string, unknown> | null; refunded_at: string | null; customer_email?: string | null } } | { ok: false; status: number }>;
  /** Finds the workspace whose confirmed login email matches the Whop buyer's email (store purchases). */
  businessIdForEmail(email: string): Promise<string | null>;
  getMembership(id: string): Promise<{ ok: true; value: { status: string; product_id: string | null; metadata?: Record<string, unknown> | null } } | { ok: false; status: number }>;
  /** Link membership to business (no-op if already linked to another business). */
  link(businessId: string, membershipId: string): Promise<void>;
  setStatus(membershipId: string, status: "active" | "revoked"): Promise<void>;
}
export type Outcome = "activated" | "updated" | "revoked" | "ignored" | "retry";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const businessIdFrom = (m?: Record<string, unknown> | null) => {
  const v = m?.qr_business_id;
  return typeof v === "string" && UUID.test(v) ? v : null;
};
const str = (v: unknown) => (typeof v === "string" ? v : null);

export async function processWhopEvent(event: { type?: string; data?: Record<string, unknown> }, deps: Deps): Promise<Outcome> {
  const type = event.type ?? "";
  const data = event.data ?? {};

  if (type === "payment.succeeded") {
    const id = str(data.id);
    if (!id?.startsWith("pay_")) return "ignored";
    const p = await deps.getPayment(id);
    if (!p.ok) return "retry";
    const pay = p.value;
    if (pay.product_id !== deps.productId || pay.status !== "paid" || pay.refunded_at || !pay.membership_id) return "ignored";
    let biz = businessIdFrom(pay.metadata);
    // Bought from the Whop store page (no tag): match the buyer's email to a QuoteRevive account.
    if (!biz && pay.customer_email) biz = await deps.businessIdForEmail(pay.customer_email);
    if (!biz) return "ignored"; // different email: buyer links manually with pay_/mem_
    await deps.link(biz, pay.membership_id);
    await deps.setStatus(pay.membership_id, "active");
    return "activated";
  }

  if (type === "membership.activated" || type === "membership.updated") {
    const id = str(data.id);
    if (!id?.startsWith("mem_")) return "ignored";
    const m = await deps.getMembership(id);
    if (!m.ok) return "retry";
    if (m.value.product_id !== deps.productId) return "ignored";
    const grant = GRANTING_STATUSES.has(m.value.status);
    const biz = businessIdFrom(m.value.metadata);
    if (grant && biz) await deps.link(biz, id);
    await deps.setStatus(id, grant ? "active" : "revoked");
    return grant ? (biz ? "activated" : "updated") : "revoked";
  }

  if (type === "refund.created" || type === "refund.updated") {
    const payment = (data.payment ?? null) as Record<string, unknown> | null;
    const id = str(payment?.id);
    if (!id?.startsWith("pay_")) return "ignored";
    const p = await deps.getPayment(id);
    if (!p.ok) return "retry";
    if (p.value.product_id !== deps.productId || !p.value.membership_id) return "ignored";
    if (!p.value.refunded_at) return "ignored"; // refund pending/failed: keep access
    await deps.setStatus(p.value.membership_id, "revoked"); // any refund ends Founding Access (see Refund Policy)
    return "revoked";
  }
  return "ignored";
}
