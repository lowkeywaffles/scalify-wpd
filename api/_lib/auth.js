// Operator sign-in for /admin with a one-time code sent by email (Supabase Auth, same project as QuoteRevive).
// Only emails listed in OPERATOR_EMAILS can sign in. Tokens live in HttpOnly, Secure, SameSite=Strict cookies.
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./db.js";
import { ConfigError, fetchT } from "./http.js";

const AT = "__Host-sc_at", RT = "__Host-sc_rt";
const SESSION_MAX_S = 12 * 3600; // you are signed out after 12 hours at most

export function operators() {
  const raw = process.env.OPERATOR_EMAILS;
  if (!raw) throw new ConfigError("OPERATOR_EMAILS");
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
export const isOperator = (email) => Boolean(email) && operators().includes(String(email).trim().toLowerCase());

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
const cookie = (name, value, maxAge) => `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;

function setSession(res, s, startedAt) {
  const left = Math.max(60, SESSION_MAX_S - Math.floor((Date.now() - startedAt) / 1000));
  res.setHeader("Set-Cookie", [
    cookie(AT, s.access_token, Math.min(Number(s.expires_in) || 3600, left)),
    cookie(RT, `${startedAt}.${s.refresh_token}`, left),
  ]);
}
export function clearSession(res) {
  res.setHeader("Set-Cookie", [cookie(AT, "", 0), cookie(RT, "", 0)]);
}

async function authCall(path, init) {
  const r = await fetchT(`${SUPABASE_URL}/auth/v1/${path}`, { ...init, headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json", ...(init?.headers || {}) } });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}

/** Step 1: email a one-time code. Only operator emails get one, and the answer is the same either way. */
export async function sendCode(email) {
  if (!isOperator(email)) return { ok: true };
  const r = await authCall("otp", { method: "POST", body: JSON.stringify({ email: String(email).trim(), create_user: false }) });
  if (r.status === 429) return { ok: false, error: "Too many codes requested. Wait a few minutes." };
  if (!r.ok) console.error(`[auth] otp send failed: ${r.status}`);
  return { ok: true };
}

/** Step 2: check the code and start a session. */
export async function verifyCode(res, email, code) {
  const nope = { ok: false, error: "That code is wrong or has expired. Request a new one." };
  if (!isOperator(email)) return nope;
  const r = await authCall("verify", { method: "POST", body: JSON.stringify({ type: "email", email: String(email).trim(), token: String(code) }) });
  if (!r.ok || !r.data?.access_token) return r.status === 429 ? { ok: false, error: "Too many tries. Wait a few minutes." } : nope;
  const user = r.data.user;
  if (!user?.email_confirmed_at || !isOperator(user.email)) return nope;
  setSession(res, r.data, Date.now());
  return { ok: true, email: user.email };
}

const verified = new Map(); // access token -> { email, until } (60 s cache, per instance)

/** Returns the operator's email, refreshing the session when needed, or null if not signed in. */
export async function currentOperator(req, res) {
  const c = parseCookies(req);
  const at = c[AT];
  if (at) {
    const hit = verified.get(at);
    if (hit && hit.until > Date.now()) return hit.email;
    const r = await authCall("user", { headers: { Authorization: `Bearer ${at}` } });
    if (r.ok && r.data?.email && r.data.email_confirmed_at && isOperator(r.data.email)) {
      if (verified.size > 200) verified.clear();
      verified.set(at, { email: r.data.email, until: Date.now() + 60_000 });
      return r.data.email;
    }
  }
  const raw = c[RT];
  if (!raw || !raw.includes(".")) return null;
  const startedAt = Number(raw.slice(0, raw.indexOf(".")));
  const refresh = raw.slice(raw.indexOf(".") + 1);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt > SESSION_MAX_S * 1000) { clearSession(res); return null; }
  const r = await authCall("token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: refresh }) });
  if (!r.ok || !r.data?.access_token || !isOperator(r.data.user?.email) || !r.data.user?.email_confirmed_at) { clearSession(res); return null; }
  setSession(res, r.data, startedAt);
  return r.data.user.email;
}

/** Signs out everywhere this session was used (revokes the refresh token at Supabase). */
export async function signOut(req, res) {
  const at = parseCookies(req)[AT];
  if (at) { verified.delete(at); await authCall("logout?scope=local", { method: "POST", headers: { Authorization: `Bearer ${at}` } }).catch(() => {}); }
  clearSession(res);
}
