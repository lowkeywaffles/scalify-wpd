// Operator-only. GET: every payment for every product. POST {kind, id, action, note}: approve / reject / refund.
import { currentOperator } from "../_lib/auth.js";
import { db } from "../_lib/db.js";
import { body, handler, send, sameOrigin, UUID } from "../_lib/http.js";
import { telegramConfigured } from "../_lib/notify.js";
import { FIRST6, STORE_PRODUCTS } from "../_lib/products.js";
import { getPromo, refundPayment, takeOnePromoSpot } from "../_lib/whop.js";

const SETTINGS = ["SUPABASE_SERVICE_ROLE_KEY", "OPERATOR_EMAILS", "WHOP_API_KEY", "BRIMFUL_WHOP_PLAN_ID", "BRIMFUL_WHOP_PRODUCT_ID", "TELEGRAM_BOT_TOKEN"];

async function list() {
  const [mp, so] = await Promise.all([
    db("manual_payments?select=id,business_id,method,amount_etb,promo_code,payer_name,reference,status,review_note,created_at,reviewed_at,reviewed_by&order=created_at.desc&limit=200"),
    db("store_orders?select=id,product,method,amount_etb,amount_usd,payer_name,reference,status,review_note,age_confirmed,created_at,reviewed_at,reviewed_by&or=(method.neq.whop,status.neq.pending)&order=created_at.desc&limit=200"),
  ]);
  if (!mp.ok || !so.ok) return null;
  const ids = [...new Set(mp.data.map((r) => r.business_id))];
  const biz = ids.length ? await db(`businesses?select=id,name&id=in.(${ids.join(",")})`) : { ok: true, data: [] };
  const names = new Map((biz.data ?? []).map((b) => [b.id, b.name]));
  const quoterevive = mp.data.map(({ business_id, ...r }) => ({ ...r, product: "QuoteRevive Founding Access", workspace: names.get(business_id) || "Unnamed workspace" }));
  const store = so.data.map((r) => ({ ...r, product_name: STORE_PRODUCTS[r.product]?.name ?? r.product }));
  let first6 = null;
  if (process.env.WHOP_API_KEY) {
    const p = await getPromo(FIRST6.whopPromoId);
    if (p.ok && typeof p.data?.stock === "number") {
      const pending = quoterevive.filter((r) => r.status === "pending" && r.promo_code === FIRST6.code).length;
      first6 = { left: Math.max(0, Math.min(6, p.data.stock - (p.data.uses ?? 0)) - pending), status: p.data.status };
    }
  }
  return { quoterevive, store, first6 };
}

export default handler(["GET", "POST"], async (req, res) => {
  const who = await currentOperator(req, res);
  if (!who) return send(res, 401, { error: "Please sign in again." });

  if (req.method === "GET") {
    const data = await list();
    if (!data) return send(res, 503, { error: "Couldn't load payments. Try again." });
    const missing = SETTINGS.filter((k) => !process.env[k]);
    return send(res, 200, { ...data, me: who, missing, telegram: telegramConfigured() });
  }

  if (!sameOrigin(req)) return send(res, 403, { error: "Not allowed" });
  const b = await body(req);
  const { kind, id, action } = b ?? {};
  const note = typeof b?.note === "string" ? b.note.trim() : "";
  if (!UUID.test(String(id)) || !["approve", "reject", "refund"].includes(action)) return send(res, 400, { error: "Invalid request." });
  if (action === "reject" && (note.length < 3 || note.length > 300)) return send(res, 400, { error: "Write a short reason the buyer will see (3–300 characters)." });

  if (kind === "quoterevive") {
    const r = await db("rpc/admin_review_manual_payment", { method: "POST", body: { p_id: id, p_action: action, p_note: note || null, p_by: who } });
    if (!r.ok) return send(res, 500, { error: "Couldn't save. Nothing was changed; try again." });
    if (!r.data?.ok) return send(res, 409, { error: r.data?.error || "Couldn't do that." });
    let msg = { approve: "Approved. Their QuoteRevive workspace is unlocked.", reject: "Marked as not received. The customer sees your reason.", refund: "Marked refunded and access removed. Send the money back from Telebirr or your bank." }[action];
    if (action === "approve" && r.data.promo_code === FIRST6.code && !(await takeOnePromoSpot(FIRST6.whopPromoId))) msg += " Couldn't lower the FIRST6 count on Whop: lower it by one in Whop by hand.";
    return send(res, 200, { ok: true, message: msg });
  }

  if (kind === "store") {
    const got = await db(`store_orders?select=id,method,status,reference&id=eq.${id}`);
    const o = got.ok ? got.data?.[0] : null;
    if (!o) return send(res, 404, { error: "Order not found." });
    const stamp = { reviewed_at: new Date().toISOString(), reviewed_by: who };
    if (action === "approve" || action === "reject") {
      if (o.method === "whop") return send(res, 409, { error: "Card orders are confirmed by Whop automatically." });
      const patch = action === "approve" ? { status: "approved", review_note: null, ...stamp } : { status: "rejected", review_note: note, ...stamp };
      const r = await db(`store_orders?id=eq.${id}&status=eq.pending`, { method: "PATCH", body: patch, prefer: "return=representation" });
      if (!r.ok || !r.data?.length) return send(res, 409, { error: "Already reviewed, or not found." });
      return send(res, 200, { ok: true, message: action === "approve" ? "Approved. The buyer's app unlocks the next time it checks (within a minute if it's open)." : "Marked as not received. The buyer sees your reason." });
    }
    // refund
    if (o.status !== "approved") return send(res, 409, { error: "Only approved orders can be refunded." });
    if (o.method === "whop") {
      if (!o.reference?.startsWith("pay_")) return send(res, 409, { error: "No Whop payment is linked to this order. Refund it in Whop instead." });
      const w = await refundPayment(o.reference);
      if (!w.ok) return send(res, 502, { error: "Whop didn't accept the refund. Nothing was changed here. Try again, or refund it in your Whop dashboard." });
    }
    const r = await db(`store_orders?id=eq.${id}&status=eq.approved`, { method: "PATCH", body: { status: "refunded", ...stamp }, prefer: "return=representation" });
    if (!r.ok || !r.data?.length) return send(res, 409, { error: "Couldn't mark it refunded. Refresh and check." });
    return send(res, 200, { ok: true, message: o.method === "whop" ? "Refunded on Whop. The app goes back to the free plan." : "Marked refunded. Send the money back from Telebirr or your bank. The app goes back to the free plan." });
  }
  return send(res, 400, { error: "Invalid request." });
});
