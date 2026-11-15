// The only network calls Brimful makes: buying or restoring Plus, and (only if you turn it on) the encrypted
// cloud backup. They go to Scalify's payments service. Jar names, amounts and history are never sent unencrypted.
export const BASE = "https://scalify-wpd.vercel.app/api/store/brimful";

async function call(url, init) {
  try {
    const res = await fetch(url, { ...init, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: { error: "You're offline, or the payment service can't be reached. Try again in a moment." } };
  }
}
// Until the new service has its database key, it answers 503 {missing}; then the previous endpoint (same database)
// takes birr orders and status checks, so buying never breaks during the move.
const OLD = "https://quoterevivepro.vercel.app/api/store/brimful";
async function store(path, init) {
  const r = await call(`${BASE}${path}`, init);
  return r.status === 503 && r.body?.missing ? call(`${OLD}${path}`, init) : r;
}
const json = (method, data) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export const fetchProduct = () => call(BASE);
export const createOrder = (data) => (data.method === "whop" ? call(`${BASE}/orders`, json("POST", data)) : store("/orders", json("POST", data)));
export const fetchStatus = (key) => store(`/orders/${encodeURIComponent(key)}`);

export const getBackup = (id) => call(`${BASE}/backup/${id}`);
export const putBackup = (id, data) => call(`${BASE}/backup/${id}`, json("PUT", { data }));
export const deleteBackup = (id) => call(`${BASE}/backup/${id}`, { method: "DELETE" });
