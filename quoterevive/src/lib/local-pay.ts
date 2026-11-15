import "server-only";
import { FIRST6, first6Active } from "./offer";
import { supabaseAdmin } from "./supabase/server";
import { getPromo } from "./whop";

/** Operators can review local payments. Set OPERATOR_EMAILS (comma-separated) in the environment. */
export function isOperator(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.OPERATOR_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

/**
 * FIRST6 spots left across BOTH channels: the Whop code's remaining stock, minus local FIRST6 requests that are
 * still waiting for review. (Approved local uses are already taken off the Whop stock when approved.)
 * Returns 0 when the offer has ended or the count can't be confirmed, so we never over-promise.
 */
export async function first6Remaining(): Promise<number> {
  if (!first6Active()) return 0;
  const p = await getPromo(FIRST6.whopPromoId);
  if (!p.ok || p.value.status !== "active") return 0;
  const { count } = await supabaseAdmin().from("manual_payments").select("id", { count: "exact", head: true }).eq("promo_code", FIRST6.code).eq("status", "pending");
  // Cautious reading of Whop's counters: treat stock as the total cap and subtract recorded uses.
  return Math.max(0, Math.min(FIRST6.spots, p.value.stock - (p.value.uses ?? 0)) - (count ?? 0));
}
