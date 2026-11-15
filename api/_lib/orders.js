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

/**
 * Bought Brimful Plus on the Whop store page (not from inside the app)? The buyer pastes their Whop receipt number
 * (pay_…). We confirm it with Whop and give them a licence key. A receipt can only ever back one key.
 * Returns { ok, key } or { ok:false, status, error }.
 */
export async function claimWhopPayment(payId) {
  const product = STORE_PRODUCTS.brimful;
  const p = await getPayment(payId);
  if (!p.ok) return { ok: false, status: [400, 404, 422].includes(p.status) ? 404 : 502, error: [400, 404, 422].includes(p.status) ? "We couldn't find that receipt. Check it starts with pay_ and was copied in full." : "Couldn't check with Whop right now. Try again in a minute." };
  const pay = p.data;
  if (pay?.product_id !== product.whopProduct()) return { ok: false, status: 404, error: "That receipt isn't for Brimful Plus." };
  if (pay.status !== "paid" || pay.refunded_at) return { ok: false, status: 409, error: "That payment isn't completed, or it was refunded." };
  // Already linked to a key (bought in the app, or claimed before): hand back the same key.
  const linked = await db(`store_orders?select=id,status&method=eq.whop&reference=eq.${encodeURIComponent(pay.id)}`);
  if (linked.ok && linked.data?.[0]) return linked.data[0].status === "approved" ? { ok: true, key: linked.data[0].id } : { ok: false, status: 409, error: "That purchase was refunded." };
  const appKey = pay.metadata?.brimful_key;
  if (typeof appKey === "string" && UUID.test(appKey)) {
    await applyWhopPayment(pay.id);
    return { ok: true, key: appKey };
  }
  const usd = Number(pay.total?.amount ?? pay.total ?? product.priceUsd());
  const ins = await db("store_orders", {
    method: "POST",
    body: { product: "brimful", method: "whop", amount_usd: Number.isFinite(usd) && usd > 0 ? usd : product.priceUsd(), reference: pay.id, status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: "whop store", notified_at: new Date().toISOString() },
    prefer: "return=representation",
  });
  if (ins.ok && ins.data?.[0]) return { ok: true, key: ins.data[0].id };
  if (ins.code === "23505") { // claimed at the same moment by another request
    const again = await db(`store_orders?select=id&method=eq.whop&reference=eq.${encodeURIComponent(pay.id)}`);
    if (again.data?.[0]) return { ok: true, key: again.data[0].id };
  }
  return { ok: false, status: 500, error: "Couldn't save that. Please try again." };
}
