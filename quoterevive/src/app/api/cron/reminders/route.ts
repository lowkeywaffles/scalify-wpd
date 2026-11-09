import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { today } from "@/lib/dates";

export const runtime = "nodejs";

/** Daily job (Vercel Cron). Creates one in-app reminder per due quote per day; unique index makes it idempotent. */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = supabaseAdmin();
  const day = today();
  const { data, error } = await admin
    .from("quotes")
    .select("id, business_id")
    .eq("archived", false).eq("opted_out", false)
    .not("status", "in", "(accepted,rejected,expired,draft)")
    .lte("next_follow_up_at", day)
    .limit(10000);
  if (error) return NextResponse.json({ error: "query failed" }, { status: 500 });
  const rows = (data ?? []).map((q) => ({ business_id: q.business_id, quote_id: q.id, due_on: day }));
  if (rows.length) {
    const up = await admin.from("reminders").upsert(rows, { onConflict: "business_id,quote_id,due_on", ignoreDuplicates: true });
    if (up.error) return NextResponse.json({ error: "insert failed" }, { status: 500 });
  }
  await admin.from("quotes").update({ status: "follow_up_due" }).in("id", rows.map((r) => r.quote_id)).in("status", ["sent", "awaiting_response"]);
  // Retention: webhook ids older than 30 days are no longer needed for de-duplication.
  await admin.from("webhook_events").delete().lt("received_at", new Date(Date.now() - 30 * 86400000).toISOString());
  return NextResponse.json({ ok: true, reminders: rows.length });
}
