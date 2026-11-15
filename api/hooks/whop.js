// Whop webhook for account-free products (Brimful). We never trust the body: we take only the payment id from it
// and re-read that payment from the Whop API before changing anything, so a forged call can't unlock anything.
import { body, handler, ipOf, rateLimit, send } from "../_lib/http.js";
import { announceNew, sendAlert } from "../_lib/notify.js";
import { applyWhopPayment } from "../_lib/orders.js";

const payIdOf = (data) => {
  for (const v of [data?.id, data?.payment_id, data?.payment?.id]) if (typeof v === "string" && /^pay_\w+$/.test(v)) return v;
  return null;
};

export default handler(["POST"], async (req, res) => {
  if (!rateLimit(`whophook:${ipOf(req)}`, 600, 3600_000)) return send(res, 429, { error: "slow down" });
  const event = await body(req);
  const type = String(event?.type ?? "");
  if (!/^(payment|refund)\./.test(type)) return send(res, 200, { ok: true, outcome: "ignored" });
  const id = payIdOf(event?.data);
  if (!id) return send(res, 200, { ok: true, outcome: "ignored" });
  const outcome = await applyWhopPayment(id);
  console.log(`[whop-hook] ${type} -> ${outcome}`);
  if (outcome === "retry") return send(res, 502, { error: "verification failed" });
  if (outcome === "approved") await announceNew().catch(() => 0);
  if (outcome === "orphan" && type === "payment.succeeded") await sendAlert(`⚠️ A Brimful Plus card payment (${id}) came in without a licence key, so nothing unlocked. Find the buyer in Whop and refund or help them.`).catch(() => false);
  return send(res, 200, { ok: true, outcome });
});
