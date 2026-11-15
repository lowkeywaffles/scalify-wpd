// Small helpers shared by the Scalify API functions. No dependencies.

export function send(res, status, body, headers = {}) {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.statusCode = status;
  res.end(status === 204 ? "" : JSON.stringify(body ?? {}));
}

/** Client IP, used only for rate limiting in memory. Never stored or logged. */
export const ipOf = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

// Best-effort, per-instance rate limiter. Each serverless instance keeps its own counts.
const buckets = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) { buckets.set(key, { n: 1, reset: now + windowMs }); return true; }
  b.n += 1;
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  return b.n <= max;
}

/** JSON body (Vercel parses JSON already; this also accepts a raw string). Returns null when it is not an object. */
export async function body(req) {
  let b = req.body;
  if (b === undefined) {
    const chunks = [];
    let size = 0;
    for await (const c of req) { size += c.length; if (size > 1_000_000) return null; chunks.push(c); }
    b = Buffer.concat(chunks).toString("utf8");
  }
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { return null; } }
  return b && typeof b === "object" && !Array.isArray(b) ? b : null;
}

/** CORS for the public store API: only our own product sites may call it from a browser. */
export function cors(req, res, methods) {
  const allowed = (process.env.STORE_ALLOWED_ORIGINS || "https://brimful.vercel.app").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");
  const ok = Boolean(origin && allowed.includes(origin));
  if (ok) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", `${methods}, OPTIONS`);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  return ok;
}

/** For admin calls that change things: the request must come from this site (CSRF guard on top of SameSite cookies). */
export function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return Boolean(origin && host && origin === `https://${host}`) || (process.env.ALLOW_LOCAL_ORIGIN === "1" && origin === `http://${host}`);
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ConfigError extends Error {
  constructor(name) { super(`${name} is not set`); this.missing = name; }
}

/** Wraps a handler: method check, and turns a missing setting into a clear 503 instead of a crash. */
export function handler(methods, fn) {
  return async (req, res) => {
    try {
      if (req.method === "OPTIONS") return fn(req, res);
      if (!methods.includes(req.method)) return send(res, 405, { error: "Method not allowed" }, { Allow: methods.join(", ") });
      return await fn(req, res);
    } catch (e) {
      if (e instanceof ConfigError) {
        console.error(`[config] ${e.message}`);
        return send(res, 503, { error: "This service isn't set up yet. Please try again later.", missing: e.missing });
      }
      console.error(`[api] ${req.method} ${String(req.url).split("?")[0]} failed: ${e instanceof Error ? e.message : "unknown"}`);
      return send(res, 500, { error: "Something went wrong. Please try again." });
    }
  };
}

/** fetch with a timeout, so one slow service can't hang a request. */
export async function fetchT(url, init = {}, ms = 8000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...init, signal: ac.signal }); } finally { clearTimeout(t); }
}
