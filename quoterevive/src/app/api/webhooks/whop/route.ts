import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { GRANTING_STATUSES, verifyStandardWebhook } from "@/lib/webhook";
import { fetchWhopMembership } from "@/lib/whop";

export const runtime = "nodejs";

/**
 * Whop webhook. Signature verified (Standard Webhooks), de-duplicated by webhook-id,
 * then the membership state is RE-READ from the Whop API (webhooks may arrive out of order).
 * Only updates entitlements already linked to an account; linking happens in-app.
 */
export async function POST(req: Request) {
  const secret = process.env.WHOP_WEBHOOK_SECRET ?? "";
  const raw = await req.text();
  const headers = { id: req.headers.get("webhook-id"), timestamp: req.headers.get("webhook-timestamp"), signature: req.headers.get("webhook-signature") };
  if (!verifyStandardWebhook(secret, headers, raw)) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  const admin = supabaseAdmin();
  const dup = await admin.from("webhook_events").insert({ id: headers.id });
  if (dup.error) return NextResponse.json({ ok: true, duplicate: true }); // already processed

  let event: { type?: string; data?: { id?: string; membership_id?: string; membership?: { id?: string } } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const d = event.data ?? {};
  const membershipId = [d.membership_id, d.membership?.id, d.id].find((x) => typeof x === "string" && x.startsWith("mem_"));
  if (!membershipId) return NextResponse.json({ ok: true, ignored: event.type ?? "unknown" });

  const m = await fetchWhopMembership(membershipId);
  if (!m.ok) {
    await admin.from("webhook_events").delete().eq("id", headers.id); // allow Whop retry
    return NextResponse.json({ error: "verification failed" }, { status: 502 });
  }
  const status = GRANTING_STATUSES.has(m.membership.status) ? "active" : "revoked";
  // Refunds: Whop typically moves the membership out of a granting state; we additionally revoke on refund events.
  const finalStatus = event.type?.startsWith("refund.") ? "revoked" : status;
  await admin.from("entitlements").update({ status: finalStatus, updated_at: new Date().toISOString() }).eq("whop_membership_id", membershipId);
  return NextResponse.json({ ok: true });
}
