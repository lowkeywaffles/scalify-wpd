// Payment alerts to the operator's Telegram. Alerts never contain payer names, transaction IDs or licence keys:
// only product, amount and method, plus a link to the admin page.
import { db, getSetting } from "./db.js";
import { fetchT } from "./http.js";
import { METHOD_LABEL, SITE, STORE_PRODUCTS } from "./products.js";

export const telegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

export async function telegram(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  try {
    const r = await fetchT(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload ?? {}) }, 6000);
    const data = await r.json().catch(() => null);
    if (!data?.ok) console.error(`[telegram] ${method} failed: ${data?.error_code ?? r.status}`);
    return { ok: Boolean(data?.ok), result: data?.result, error: data?.description };
  } catch {
    console.error(`[telegram] ${method} network error`);
    return { ok: false, error: "network" };
  }
}

export async function sendAlert(text, chat) {
  if (!telegramConfigured()) return false;
  chat = chat ?? (await getSetting("telegram"));
  if (!chat?.chat_id) return false;
  const r = await telegram("sendMessage", { chat_id: chat.chat_id, text, disable_web_page_preview: true });
  return r.ok;
}

const money = (o) => (o.amount_usd != null ? `$${Number(o.amount_usd)}` : `${Number(o.amount_etb).toLocaleString("en-US")} ETB`);

/**
 * Sends one alert per new payment that hasn't been announced yet. Safe to call any number of times, from anywhere:
 * each row is claimed (notified_at set) before its alert is sent, so nothing is announced twice.
 */
export async function announceNew() {
  if (!telegramConfigured()) return 0;
  const chat = await getSetting("telegram");
  if (!chat?.chat_id) return 0; // not linked yet: leave rows unannounced so they go out once it is
  const claimed = { store_orders: [], manual_payments: [] };
  const since = new Date(Date.now() - 3 * 86400_000).toISOString();
  const now = new Date().toISOString();
  let sent = 0;
  const lines = [];
  // Brimful and other account-free products: birr orders waiting for review, and card orders that went through.
  const so = await db(`store_orders?select=id,product,method,amount_etb,amount_usd,status&notified_at=is.null&created_at=gte.${since}&or=(and(method.neq.whop,status.eq.pending),and(method.eq.whop,status.eq.approved))&limit=20`);
  for (const o of so.ok ? so.data : []) {
    const claim = await db(`store_orders?id=eq.${o.id}&notified_at=is.null`, { method: "PATCH", body: { notified_at: now }, prefer: "return=representation" });
    if (!claim.ok || !claim.data?.length) continue;
    claimed.store_orders.push(o.id);
    const name = STORE_PRODUCTS[o.product]?.name ?? o.product;
    lines.push(o.method === "whop" ? `✅ Card payment: ${name}, ${money(o)} (unlocked automatically)` : `🟡 Check payment: ${name}, ${money(o)} by ${METHOD_LABEL[o.method]}`);
  }
  // QuoteRevive birr payments waiting for review.
  const mp = await db(`manual_payments?select=id,method,amount_etb,promo_code&status=eq.pending&notified_at=is.null&created_at=gte.${since}&limit=20`);
  for (const p of mp.ok ? mp.data : []) {
    const claim = await db(`manual_payments?id=eq.${p.id}&notified_at=is.null`, { method: "PATCH", body: { notified_at: now }, prefer: "return=representation" });
    if (!claim.ok || !claim.data?.length) continue;
    claimed.manual_payments.push(p.id);
    lines.push(`🟡 Check payment: QuoteRevive Founding Access, ${money(p)}${p.promo_code ? ` (${p.promo_code})` : ""} by ${METHOD_LABEL[p.method]}`);
  }
  if (lines.length) {
    const ok = await sendAlert(`${lines.join("\n")}\n\nReview: ${SITE}/admin`, chat);
    if (ok) sent = lines.length;
    else for (const [table, ids] of Object.entries(claimed)) if (ids.length) await db(`${table}?id=in.(${ids.join(",")})`, { method: "PATCH", body: { notified_at: null }, prefer: "return=minimal" }); // try again next time
  }
  return sent;
}
