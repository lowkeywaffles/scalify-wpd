// Daily housekeeping (Vercel Cron). Idempotent and only removes data our retention rules say to remove:
//   * card checkouts that were started but never paid (older than 3 days; they hold no personal data)
//   * cloud backups nobody has updated for 400 days (the app says so before you turn backup on)
//   * shared jars with no activity for 400 days (the app says so when you create or join one)
//   * birr orders we marked "not received" more than 180 days ago (kept that long in case of a dispute)
// It also sends any payment alerts that were missed.
import { db } from "../_lib/db.js";
import { handler, send } from "../_lib/http.js";
import { announceNew } from "../_lib/notify.js";

export default handler(["GET"], async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return send(res, 401, { error: "unauthorized" });
  const ago = (days) => new Date(Date.now() - days * 86400_000).toISOString();
  const out = {};
  const del = async (path) => { const r = await db(path, { method: "DELETE", prefer: "return=minimal", count: true }); return r.ok ? r.count ?? 0 : "error"; };
  out.abandoned_checkouts = await del(`store_orders?method=eq.whop&status=eq.pending&created_at=lt.${ago(3)}`);
  out.old_backups = await del(`brimful_backups?updated_at=lt.${ago(400)}`);
  out.old_rejected = await del(`store_orders?status=eq.rejected&reviewed_at=lt.${ago(180)}`);
  out.old_shared_jars = await del(`shared_jars?updated_at=lt.${ago(400)}`); // deposits and members go with them (cascade)
  out.alerts = await announceNew().catch(() => "error");
  console.log(`[cron] ${JSON.stringify(out)}`);
  return send(res, 200, { ok: true, ...out });
});
