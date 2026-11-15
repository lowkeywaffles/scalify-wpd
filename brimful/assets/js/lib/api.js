// The only network calls Brimful makes: buying or restoring Plus. They go to Scalify's payments service
// (hosted with QuoteRevive). Jar names, amounts and history are never sent.
export const API = "https://quoterevivepro.vercel.app/api/store/brimful";

async function call(url, init) {
  try {
    const res = await fetch(url, { ...init, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: { error: "You're offline, or the payment service can't be reached. Try again in a moment." } };
  }
}
export const fetchProduct = () => call(API);
export const createOrder = (data) => call(`${API}/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const fetchStatus = (key) => call(`${API}/orders/${encodeURIComponent(key)}`);
