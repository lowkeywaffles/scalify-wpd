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
    if (!res.ok) {
      // Log Whop's status + error text (no secrets, no buyer data) so failures can be diagnosed in Vercel logs.
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[whop] GET membership failed: HTTP ${res.status} ${detail}`);
      if ([400, 404, 422].includes(res.status)) return { ok: false, error: "We couldn't find that membership. Check the ID starts with mem_ and was copied in full." };
      if (res.status === 401 || res.status === 403) return { ok: false, error: "Purchase verification is misconfigured on our side. Please contact support — we'll activate you manually." };
      return { ok: false, error: "Couldn't reach Whop to verify. Please try again in a few minutes." };
    }
    const m = (await res.json()) as WhopMembership;
    if (m.product_id !== product) console.error(`[whop] product mismatch: membership is for ${m.product_id}`);
    if (m.product_id !== product) return { ok: false, error: "That membership is for a different product." };
    return { ok: true, membership: m };
  } catch (e) {
    console.error(`[whop] network error: ${e instanceof Error ? e.message : "unknown"}`);
    return { ok: false, error: "Couldn't reach Whop to verify. Please try again in a few minutes." };
  }
}
