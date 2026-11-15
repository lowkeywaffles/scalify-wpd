// Brimful's optional cloud backup. The app encrypts everything in the browser with a key made from the buyer's
// recovery code; we receive only ciphertext and a lookup id (a SHA-256 hash of the code). We can't read backups.
//   GET    /api/brimful/backup/:id   -> { data, updated_at }
//   PUT    /api/brimful/backup/:id   { data }
//   DELETE /api/brimful/backup/:id
import { db } from "../_lib/db.js";
import { body, cors, handler, ipOf, rateLimit, send } from "../_lib/http.js";

const ID = /^[0-9a-f]{64}$/;
const DATA = /^[A-Za-z0-9+/=.:_-]+$/; // "v1.<iv>.<ciphertext>" in base64

export default handler(["GET", "PUT", "DELETE"], async (req, res) => {
  const allowed = cors(req, res, "GET, PUT, DELETE");
  if (req.method === "OPTIONS") return send(res, 204);
  if (!allowed) return send(res, 403, { error: "Not allowed" });
  const id = String(req.query.id || "");
  if (!ID.test(id)) return send(res, 404, { error: "Not found" });
  const ip = ipOf(req);

  if (req.method === "GET") {
    if (!rateLimit(`bkget:${ip}`, 30, 3600_000)) return send(res, 429, { error: "Too many tries. Wait an hour and try again." });
    const r = await db(`brimful_backups?select=data,updated_at&id=eq.${id}`);
    if (!r.ok) return send(res, 503, { error: "Backups can't be reached right now." });
    if (!r.data?.[0]) return send(res, 404, { error: "No backup found for this recovery code." });
    return send(res, 200, r.data[0]);
  }

  if (req.method === "DELETE") {
    if (!rateLimit(`bkdel:${ip}`, 20, 3600_000)) return send(res, 429, { error: "Too many requests." });
    const r = await db(`brimful_backups?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
    return r.ok ? send(res, 200, { ok: true }) : send(res, 503, { error: "Couldn't delete right now. Try again." });
  }

  if (!rateLimit(`bkput:${ip}`, 120, 3600_000)) return send(res, 429, { error: "Too many backups in a short time. It will retry later." });
  const b = await body(req);
  const data = typeof b?.data === "string" ? b.data : "";
  if (data.length < 16 || data.length > 700000 || !DATA.test(data) || !data.startsWith("v1.")) return send(res, 400, { error: "Backup is too large or damaged." });
  const exists = await db(`brimful_backups?select=id&id=eq.${id}`);
  if (!exists.ok) return send(res, 503, { error: "Backups can't be reached right now." });
  if (!exists.data?.length) {
    const total = await db("brimful_backups?select=id&limit=1", { count: true });
    if ((total.count ?? 0) >= 50000) return send(res, 503, { error: "Cloud backup is full right now. Use 'Download backup' instead." });
  }
  const r = await db("brimful_backups?on_conflict=id", { method: "POST", body: { id, data, updated_at: new Date().toISOString() }, prefer: "resolution=merge-duplicates,return=minimal" });
  return r.ok ? send(res, 200, { ok: true, updated_at: new Date().toISOString() }) : send(res, 503, { error: "Couldn't save the backup. It will retry." });
});
