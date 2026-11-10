import "server-only";

/** Must match the price shown in src/lib/offer.ts and on Whop. */
export const FOUNDING_PRICE_USD = 39;

/**
 * Whop REST API (v1). Endpoints/fields checked against https://api.whop.com/api/v1/openapi.json (2026-11-10).
 * Key scopes needed: checkout_configuration:create, member:basic:read, payment:basic:read.
 */
export interface WhopMembership { id: string; status: string; product_id: string | null; metadata?: Record<string, unknown> | null }
export interface WhopPayment {
  id: string; status: string; product_id: string | null; membership_id: string | null;
  metadata?: Record<string, unknown> | null; refunded_at: string | null;
}
type Result<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

function config() {
  return {
    key: process.env.WHOP_API_KEY ?? "",
    base: process.env.WHOP_API_BASE ?? "https://api.whop.com",
    product: process.env.WHOP_PRODUCT_ID ?? "",
    plan: process.env.WHOP_PLAN_ID ?? "",
    account: process.env.WHOP_ACCOUNT_ID ?? "",
  };
}
export const whopConfigured = () => { const c = config(); return Boolean(c.key && c.product && c.account); };
export const whopProductId = () => config().product;

async function whop<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  const c = config();
  if (!c.key) return { ok: false, status: 0, error: "WHOP_API_KEY not set" };
  try {
    const res = await fetch(`${c.base}/api/v1${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${c.key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[whop] ${init?.method ?? "GET"} ${path.split("?")[0].replace(/(mem|pay)_\w+/, "$1_…")} -> HTTP ${res.status} ${detail}`);
      return { ok: false, status: res.status, error: detail };
    }
    return { ok: true, value: (await res.json()) as T };
  } catch (e) {
    console.error(`[whop] network error: ${e instanceof Error ? e.message : "unknown"}`);
    return { ok: false, status: 0, error: "network" };
  }
}

export const getMembership = (id: string) => whop<WhopMembership>(`/memberships/${encodeURIComponent(id)}`);
export const getPayment = (id: string) => whop<WhopPayment>(`/payments/${encodeURIComponent(id)}`);

/** Creates a one-off Whop checkout tagged with the buyer's QuoteRevive business id, so the webhook can activate them. */
export async function createCheckout(businessId: string, redirectUrl: string) {
  const c = config();
  return whop<{ id: string; purchase_url: string | null }>("/checkout_configurations", {
    method: "POST",
    body: JSON.stringify({
      account_id: c.account,
      // Use the plan ID if configured; otherwise let Whop find (or create) the matching $39 one-time option on the product.
      ...(c.plan
        ? { variant_id: c.plan }
        : { variant: { product_id: c.product, billing_type: "one_time", initial_price: FOUNDING_PRICE_USD, currency: "usd", unlimited_stock: true } }),
      redirect_url: redirectUrl,
      metadata: { qr_business_id: businessId },
    }),
  });
}

/** Back-compat helper used by the manual "link membership ID" fallback. */
export async function fetchWhopMembership(id: string): Promise<{ ok: true; membership: WhopMembership } | { ok: false; error: string }> {
  const c = config();
  if (!c.key || !c.product) return { ok: false, error: "Purchases can't be verified yet. Message us on Whop and we'll activate you manually." };
  const r = await getMembership(id);
  if (!r.ok) {
    if ([400, 404, 422].includes(r.status)) return { ok: false, error: "We couldn't find that membership. Check the ID starts with mem_ and was copied in full." };
    if (r.status === 401 || r.status === 403) return { ok: false, error: "Purchase verification isn't working on our side right now. Message us on Whop and we'll activate you manually." };
    return { ok: false, error: "Couldn't reach Whop to verify. Please try again in a few minutes." };
  }
  if (r.value.product_id !== c.product) return { ok: false, error: "That membership is for a different product." };
  return { ok: true, membership: r.value };
}
