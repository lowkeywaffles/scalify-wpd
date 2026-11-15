// POST /api/hooks/payment — "a new payment may be waiting". Sent by QuoteRevive after a birr payment is submitted.
// It carries no data and needs no secret: it only makes us look for unannounced payments in the database.
import { handler, ipOf, rateLimit, send } from "../_lib/http.js";
import { announceNew } from "../_lib/notify.js";

export default handler(["POST"], async (req, res) => {
  if (!rateLimit(`payhook:${ipOf(req)}`, 60, 3600_000)) return send(res, 429, { error: "slow down" });
  const sent = await announceNew();
  return send(res, 200, { ok: true, sent });
});
