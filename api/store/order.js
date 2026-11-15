// POST /api/store/:product/orders      — start a purchase (birr: "I paid", card: get a Whop checkout link)
// GET  /api/store/:product/orders/:key — licence status for a key (the key is a random UUID only the buyer has)
import { db } from "../_lib/db.js";
import { body, cors, handler, ipOf, rateLimit, send, UUID } from "../_lib/http.js";
import { announceNew } from "../_lib/notify.js";
import { recheckCardOrder } from "../_lib/orders.js";
import { isStoreProduct, STORE_PRODUCTS } from "../_lib/products.js";
import { createCheckout } from "../_lib/whop.js";

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max + 1) : "");

export default handler(["GET", "POST"], async (req, res) => {
  const allowed = cors(req, res, "GET, POST");
  if (req.method === "OPTIONS") return send(res, 204);
  const product = req.query.product;
  if (!isStoreProduct(product)) return send(res, 404, { error: "Unknown product" });
  const ip = ipOf(req);

  if (req.method === "GET") {
    const key = String(req.query.key || "");
    if (!UUID.test(key)) return send(res, 404, { error: "Not found" });
    if (!rateLimit(`storeget:${ip}`, 240, 3600_000)) return send(res, 429, { error: "Too many requests. Try again later." });
    const r = await db(`store_orders?select=id,status,method,review_note,created_at,checked_at&id=eq.${key}&product=eq.${product}`);
    const order = r.ok ? r.data?.[0] : null;
    if (!order) return send(res, r.ok ? 404 : 503, { error: r.ok ? "Not found" : "Can't check right now." });
    let status = order.status;
    if (order.method === "whop" && status === "pending") {
      status = await recheckCardOrder(order);
      if (status === "approved") await announceNew().catch(() => 0);
    }
    return send(res, 200, {
      status: status === "approved" ? "active" : status,
      method: order.method,
      note: status === "rejected" ? order.review_note ?? "" : "",
    });
  }

  // POST: browsers must come from one of our product sites.
  if (!allowed) return send(res, 403, { error: "Not allowed" });
  if (!rateLimit(`store:${ip}`, 6, 3600_000)) return send(res, 429, { error: "Too many attempts. Please try again in an hour." });
  const b = await body(req);
  if (!b) return send(res, 400, { error: "Invalid request" });
  if (b.age_ok !== true) return send(res, 400, { error: "Please confirm you're 18 or older, or that a parent or guardian agreed.", field: "age_ok" });
  const method = b.method;
  if (!["telebirr", "boa", "whop"].includes(method)) return send(res, 400, { error: "Choose how you'd like to pay.", field: "method" });
  const p = STORE_PRODUCTS[product];

  const open = await db("store_orders?select=id&status=eq.pending&limit=1", { count: true });
  if ((open.count ?? 0) >= 500) return send(res, 503, { error: "We can't take new payments right now. Please contact us." });

  if (method === "whop") {
    if (!p.whopPlan() || !p.whopProduct()) return send(res, 503, { error: "Card payments aren't available right now. You can pay with Telebirr or a bank transfer." });
    const ins = await db("store_orders", { method: "POST", body: { product, method, amount_usd: p.priceUsd(), age_confirmed: true }, prefer: "return=representation" });
    const order = ins.ok ? ins.data?.[0] : null;
    if (!order) return send(res, 500, { error: "Couldn't start the payment. Please try again." });
    const co = await createCheckout(p.whopPlan(), { brimful_key: order.id }, `${p.returnUrl}?paid=1`);
    const url = co.data?.purchase_url;
    if (!co.ok || !co.data?.id || typeof url !== "string" || !url.startsWith("https://")) {
      await db(`store_orders?id=eq.${order.id}`, { method: "DELETE", prefer: "return=minimal" });
      return send(res, 502, { error: "The card checkout isn't responding. Please try again, or pay with Telebirr or a bank transfer." });
    }
    await db(`store_orders?id=eq.${order.id}`, { method: "PATCH", body: { whop_checkout_id: co.data.id }, prefer: "return=minimal" });
    return send(res, 201, { key: order.id, status: "pending", method, checkout_url: url, amount_usd: p.priceUsd() });
  }

  const payer = clean(b.payer_name, 120);
  const reference = clean(b.reference, 60).toUpperCase();
  if (payer.length < 2 || payer.length > 120) return send(res, 400, { error: "Enter the name the payment was sent from.", field: "payer_name" });
  if (!/^[A-Z0-9-]{4,60}$/.test(reference)) return send(res, 400, { error: "Enter the transaction ID from your SMS or receipt (letters and numbers only).", field: "reference" });

  const ins = await db("store_orders", {
    method: "POST",
    body: { product, method, amount_etb: p.priceEtb(), payer_name: payer, reference, age_confirmed: true },
    prefer: "return=representation",
  });
  if (!ins.ok || !ins.data?.[0]) {
    if (ins.code === "23505") return send(res, 409, { error: "This transaction ID was already submitted. If that was you, restore with your licence key.", field: "reference" });
    return send(res, 500, { error: "Couldn't save that. Please try again." });
  }
  await announceNew().catch(() => 0);
  const o = ins.data[0];
  return send(res, 201, { key: o.id, status: o.status, method, amount_etb: Number(o.amount_etb) });
});
