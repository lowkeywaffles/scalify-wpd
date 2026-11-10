"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { addDays, today } from "@/lib/dates";

export type RespondState = { ok?: boolean; error?: string; choice?: string };

const schema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/),
  choice: z.enum(["accept", "question", "not_now"]),
  message: z.string().trim().max(500).optional().transform((v) => v || null),
});

/** Public action: a customer answers their quote link. No login; the unguessable token is the only key. */
export async function respondToQuote(_: RespondState, fd: FormData): Promise<RespondState> {
  const p = schema.safeParse({ token: fd.get("token"), choice: fd.get("choice"), message: fd.get("message") ?? undefined });
  if (!p.success) return { error: "Please choose an option and keep your message under 500 characters." };
  if (p.data.choice === "question" && !p.data.message) return { error: "Please type your question." };
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!rateLimit(`qlink:${ip}`, 10, 60 * 60_000) || !rateLimit(`qlink-token:${p.data.token}`, 5, 60 * 60_000)) {
    return { error: "Too many responses. Please try again later." };
  }
  const admin = supabaseAdmin();
  const { data: q } = await admin.from("quotes").select("id, business_id, status, archived, share_enabled").eq("share_token", p.data.token).maybeSingle();
  if (!q || !q.share_enabled || q.archived) return { error: "This link is no longer active. Please contact the business directly." };
  if (["accepted", "rejected", "expired"].includes(q.status)) return { error: "This quote is already closed. Please contact the business directly." };

  const label = { accept: "Accepted via quote link", question: "Asked a question via quote link", not_now: "Said “not now” via quote link" }[p.data.choice];
  const summary = p.data.message ? `${label}: ${p.data.message}` : label;
  const newStatus = p.data.choice === "accept" ? "accepted" : p.data.choice === "question" ? "negotiating" : q.status;
  const t = today();
  const rows: Record<string, unknown>[] = [{ business_id: q.business_id, quote_id: q.id, kind: "customer_response", summary: summary.slice(0, 500), via_link: true }];
  if (newStatus !== q.status) rows.push({ business_id: q.business_id, quote_id: q.id, kind: "status_change", from_status: q.status, to_status: newStatus, via_link: true });
  const ins = await admin.from("activities").insert(rows);
  if (ins.error) { console.error(`[quote-link] ${ins.error.code} ${ins.error.message}`); return { error: "Something went wrong. Please try again." }; }
  await admin.from("quotes").update({
    status: newStatus,
    next_follow_up_at: p.data.choice === "accept" ? null : p.data.choice === "not_now" ? addDays(t, 30) : t,
  }).eq("id", q.id);
  // Let the business know in-app.
  await admin.from("reminders").upsert({ business_id: q.business_id, quote_id: q.id, due_on: t }, { onConflict: "business_id,quote_id,due_on", ignoreDuplicates: true });
  return { ok: true, choice: p.data.choice };
}
