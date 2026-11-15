// Supabase (Postgres REST) with the service-role key. Server only: this key bypasses row-level security.
import { ConfigError, fetchT } from "./http.js";

export const SUPABASE_URL = process.env.SUPABASE_URL || "https://yardudilkrhhhhtvgyuh.supabase.co";
// The publishable ("anon") key is public by design (it ships in browser code). Used only for sign-in calls.
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_RGb3lT6OaEDfTVoWeHWa4w_0q8tgc-R";

function serviceHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new ConfigError("SUPABASE_SERVICE_ROLE_KEY");
  // New-style secret keys (sb_secret_…) go only in `apikey`; legacy JWT keys also go in Authorization.
  return key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

/**
 * db("store_orders?select=id&status=eq.pending", { method, body, prefer })
 * Returns { ok, status, data, count, code }. Never throws for HTTP errors.
 */
export async function db(path, { method = "GET", body, prefer, count = false } = {}) {
  const headers = { ...serviceHeaders(), "Content-Type": "application/json", Accept: "application/json" };
  const p = [prefer, count ? "count=exact" : null].filter(Boolean).join(",");
  if (p) headers.Prefer = p;
  const r = await fetchT(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  const range = r.headers.get("content-range");
  const total = range && range.includes("/") ? Number(range.split("/")[1]) : null;
  if (!r.ok) console.error(`[db] ${method} ${path.split("?")[0]} -> ${r.status} ${data?.code ?? ""}`);
  return { ok: r.ok, status: r.status, data, count: Number.isFinite(total) ? total : null, code: data?.code ?? null };
}

export const enc = encodeURIComponent;

/** Read one operator setting (small JSON values in ops_settings). */
export async function getSetting(key) {
  const r = await db(`ops_settings?select=value&key=eq.${enc(key)}`);
  return r.ok && r.data?.[0] ? r.data[0].value : null;
}
export async function setSetting(key, value) {
  return db("ops_settings?on_conflict=key", { method: "POST", body: { key, value, updated_at: new Date().toISOString() }, prefer: "resolution=merge-duplicates,return=minimal" });
}
export async function deleteSetting(key) {
  return db(`ops_settings?key=eq.${enc(key)}`, { method: "DELETE", prefer: "return=minimal" });
}
