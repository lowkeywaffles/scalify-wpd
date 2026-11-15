// Whop REST API v1 (https://api.whop.com/api/v1). Checked against the published OpenAPI spec on 2026-11-15.
import { ConfigError, fetchT } from "./http.js";

const base = () => process.env.WHOP_API_BASE || "https://api.whop.com";
export const whopAccount = () => process.env.WHOP_ACCOUNT_ID || "biz_sCSqNQY6t26aFx";

async function whop(path, init = {}) {
  const key = process.env.WHOP_API_KEY;
  if (!key) throw new ConfigError("WHOP_API_KEY");
  try {
    const r = await fetchT(`${base()}/api/v1${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) } });
    const data = await r.json().catch(() => null);
    if (!r.ok) console.error(`[whop] ${init.method || "GET"} ${path.split("?")[0].replace(/(pay|promo|plan)_\w+/, "$1_…")} -> ${r.status}`);
    return { ok: r.ok, status: r.status, data };
  } catch {
    console.error("[whop] network error");
    return { ok: false, status: 0, data: null };
  }
}

/** One-off checkout for a plan, tagged with our order key so we can match the payment later. */
export function createCheckout(planId, metadata, redirectUrl) {
  return whop("/checkout_configurations", {
    method: "POST",
    body: JSON.stringify({ account_id: whopAccount(), variant_id: planId, redirect_url: redirectUrl, metadata }),
  });
}
export const getPayment = (id) => whop(`/payments/${encodeURIComponent(id)}`);
/** Recent paid payments for a product (used when a webhook is slow or missing). */
export function recentPayments(productId, sinceIso) {
  const q = new URLSearchParams({ account_id: whopAccount(), product_ids: productId, created_after: sinceIso, first: "50", order: "created_at", direction: "desc" });
  return whop(`/payments?${q}`);
}
export const refundPayment = (id) => whop(`/payments/${encodeURIComponent(id)}/refund`, { method: "POST", body: "{}" });

export const getPromo = (id) => whop(`/promo_codes/${encodeURIComponent(id)}`);
/** A birr FIRST6 payment was approved: take one spot off the Whop code too, so both channels share 6 spots. */
export async function takeOnePromoSpot(id) {
  const p = await getPromo(id);
  if (!p.ok || typeof p.data?.stock !== "number") return false;
  const r = await whop(`/promo_codes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ stock: Math.max(0, p.data.stock - 1) }) });
  return r.ok;
}

/** True when a Whop payment really is a completed, unrefunded purchase of this product for this order key. */
export function paymentUnlocks(pay, productId, key) {
  return Boolean(pay && pay.product_id === productId && pay.status === "paid" && !pay.refunded_at && pay.metadata && pay.metadata.brimful_key === key);
}
