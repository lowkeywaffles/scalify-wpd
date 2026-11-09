import "server-only";

export interface WhopMembership { id: string; status: string; product_id: string | null; user_id: string | null }

/** Reads authoritative membership state from Whop (GET /api/v1/memberships/{id}). Verify endpoint against current docs. */
export async function fetchWhopMembership(id: string): Promise<{ ok: true; membership: WhopMembership } | { ok: false; error: string }> {
  const key = process.env.WHOP_API_KEY;
  const product = process.env.WHOP_PRODUCT_ID;
  const base = process.env.WHOP_API_BASE ?? "https://api.whop.com";
  if (!key || !product) return { ok: false, error: "Purchases can't be verified yet. Contact support for manual activation." };
  try {
    const res = await fetch(`${base}/api/v1/memberships/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (res.status === 404) return { ok: false, error: "We couldn't find that membership." };
    if (!res.ok) return { ok: false, error: "Couldn't reach Whop to verify. Please try again later." };
    const m = (await res.json()) as WhopMembership;
    if (m.product_id !== product) return { ok: false, error: "That membership is for a different product." };
    return { ok: true, membership: m };
  } catch {
    return { ok: false, error: "Couldn't reach Whop to verify. Please try again later." };
  }
}
