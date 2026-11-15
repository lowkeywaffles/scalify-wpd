// Shared order logic: confirming card payments with Whop (never trusting a webhook body on its own).
import { db } from "./db.js";
import { UUID } from "./http.js";
import { STORE_PRODUCTS } from "./products.js";
import { getPayment, paymentUnlocks, recentPayments } from "./whop.js";

/** Marks a card order paid when Whop confirms it. Returns the new status. */
async function approveCard(order, payId) {
  const r = await db(`store_orders?id=eq.${order.id}&status=eq.pending&method=eq.whop`, {
    method: "PATCH",
    body: { status: "approved", reference: payId, reviewed_at: new Date().toISOString(), reviewed_by: "whop" },
    prefer: "return=representation",
  });
  if (r.ok && r.data?.length) return "approved";
  if (r.code === "23505") console.error("[orders] Whop payment already used by another order");
  return order.status;
}

/** Re-reads one Whop payment and applies it to the order it was made for (payment.succeeded / refunds). */
export async function applyWhopPayment(payId) {
  const p = await getPayment(payId);
  if (!p.ok) return "retry";
  const pay = p.data;
  const product = STORE_PRODUCTS.brimful;
  if (pay?.product_id !== product.whopProduct()) return "ignored";
  const key = pay?.metadata?.brimful_key;
  // Paid for Brimful Plus without going through the app (no licence key): the operator has to sort it out.
  if (typeof key !== "string") return pay.status === "paid" && !pay.refunded_at ? "orphan" : "ignored";
  if (!UUID.test(key)) return "ignored";
  const r = await db(`store_orders?select=id,status,method,reference&id=eq.${key}&method=eq.whop`);
  const order = r.ok ? r.data?.[0] : null;
  if (!order) return "ignored";
  if (pay.refunded_at) {
    if (order.status === "approved" && order.reference === pay.id) {
      await db(`store_orders?id=eq.${order.id}&status=eq.approved`, { method: "PATCH", body: { status: "refunded", reviewed_at: new Date().toISOString(), reviewed_by: "whop" }, prefer: "return=minimal" });
      return "refunded";
    }
    return "ignored";
  }
  if (order.status === "pending" && paymentUnlocks(pay, product.whopProduct(), order.id)) return (await approveCard(order, pay.id)) === "approved" ? "approved" : "ignored";
  return "ignored";
}

/**
 * Status check for a pending card order, in case the webhook hasn't arrived (yet). At most once every 20 seconds
 * per order. Looks only at this product's payments created after the order.
 */
export async function recheckCardOrder(order) {
  if (order.method !== "whop" || order.status !== "pending") return order.status;
  if (order.checked_at && Date.now() - Date.parse(order.checked_at) < 20_000) return order.status;
  if (Date.now() - Date.parse(order.created_at) > 3 * 86400_000) return order.status;
  await db(`store_orders?id=eq.${order.id}`, { method: "PATCH", body: { checked_at: new Date().toISOString() }, prefer: "return=minimal" });
  const product = STORE_PRODUCTS.brimful;
  const since = new Date(Date.parse(order.created_at) - 60_000).toISOString();
  const r = await recentPayments(product.whopProduct(), since);
  if (!r.ok || !Array.isArray(r.data?.data)) return order.status;
  const match = r.data.data.find((p) => p?.metadata?.brimful_key === order.id);
  if (!match) return order.status;
  // The list view may be partial: confirm with the full payment record.
  const full = await getPayment(match.id);
  if (full.ok && paymentUnlocks(full.data, product.whopProduct(), order.id)) return approveCard(order, full.data.id);
  return order.status;
}
