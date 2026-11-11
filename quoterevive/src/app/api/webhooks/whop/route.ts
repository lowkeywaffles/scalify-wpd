import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyStandardWebhook } from "@/lib/webhook";
import { getMembership, getPayment, whopProductId } from "@/lib/whop";
import { processWhopEvent } from "@/lib/whop-events";

export const runtime = "nodejs";

/**
 * Whop webhook: verify signature (Standard Webhooks, 5-min tolerance) -> de-duplicate by webhook-id
 * -> re-read the payment/membership from the Whop API -> update entitlements. Payloads are never stored.
 */
export async function POST(req: Request) {
  const secret = process.env.WHOP_WEBHOOK_SECRET ?? "";
  const raw = await req.text();
  const headers = { id: req.headers.get("webhook-id"), timestamp: req.headers.get("webhook-timestamp"), signature: req.headers.get("webhook-signature") };
  if (!verifyStandardWebhook(secret, headers, raw)) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  let event: { type?: string; data?: Record<string, unknown> };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const admin = supabaseAdmin();
  const dup = await admin.from("webhook_events").insert({ id: headers.id });
  if (dup.error) return NextResponse.json({ ok: true, duplicate: true });

  const outcome = await processWhopEvent(event, {
    productId: whopProductId(),
    getPayment,
    getMembership,
    async businessIdForEmail(email) {
      const { data, error } = await admin.rpc("business_id_for_email", { p_email: email });
      if (error) { console.error(`[whop-webhook] email match failed: ${error.code}`); return null; }
      return typeof data === "string" ? data : null;
    },
    async link(businessId, membershipId) {
      const { data: owner } = await admin.from("entitlements").select("business_id").eq("whop_membership_id", membershipId).maybeSingle();
      if (owner && owner.business_id !== businessId) return; // never move a purchase between accounts automatically
      const { data: biz } = await admin.from("businesses").select("id").eq("id", businessId).maybeSingle();
      if (!biz) return;
      const { error } = await admin.from("entitlements").upsert({ business_id: businessId, source: "whop", whop_membership_id: membershipId, status: "active", updated_at: new Date().toISOString() });
      if (error) console.error(`[whop-webhook] link failed: ${error.code} ${error.message}`);
    },
    async setStatus(membershipId, status) {
      const { error } = await admin.from("entitlements").update({ status, updated_at: new Date().toISOString() }).eq("whop_membership_id", membershipId);
      if (error) console.error(`[whop-webhook] status update failed: ${error.code} ${error.message}`);
    },
  });

  console.log(`[whop-webhook] ${event.type ?? "unknown"} -> ${outcome}`);
  if (outcome === "retry") {
    await admin.from("webhook_events").delete().eq("id", headers.id); // let Whop retry
    return NextResponse.json({ error: "verification failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, outcome });
}
