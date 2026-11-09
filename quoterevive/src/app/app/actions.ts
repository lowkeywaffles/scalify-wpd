"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBusiness } from "@/lib/data";
import { activitySchema, onboardingSchema, quoteSchema } from "@/lib/validation";
import { importRowSchema } from "@/lib/csv";
import { recommendFollowUp } from "@/lib/engine";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Activity, Quote } from "@/lib/types";
import { GRANTING_STATUSES } from "@/lib/webhook";
import { fetchWhopMembership } from "@/lib/whop";
import { rateLimit } from "@/lib/rate-limit";

export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[]>; message?: string };

function friendly(err: { message: string } | null): string | undefined {
  if (!err) return undefined;
  if (err.message.includes("FREE_LIMIT") || err.message.includes("PLAN_LIMIT")) return err.message.replace(/^.*?_LIMIT: /, "");
  return "Something went wrong saving your changes. Please try again.";
}

function formObject(fd: FormData) {
  return Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

export async function saveOnboarding(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse(formObject(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { supabase, business } = await requireBusiness();
  const { error } = await supabase.from("businesses").update({ ...parsed.data, onboarded_at: new Date().toISOString() }).eq("id", business.id);
  if (error) return { error: friendly(error) };
  redirect(fd.get("create_first") === "yes" ? "/app/quotes/new" : "/app");
}

export async function skipOnboarding() {
  const { supabase, business } = await requireBusiness();
  await supabase.from("businesses").update({ onboarded_at: new Date().toISOString() }).eq("id", business.id);
  redirect("/app");
}

export async function saveQuote(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = fd.get("id");
  const parsed = quoteSchema.safeParse(formObject(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { supabase, business } = await requireBusiness();
  const data = parsed.data;

  if (typeof id === "string" && id) {
    const { data: prev } = await supabase.from("quotes").select("status").eq("id", id).single();
    const { error } = await supabase.from("quotes").update(data).eq("id", id);
    if (error) return { error: friendly(error) };
    if (prev && prev.status !== data.status) {
      await supabase.from("activities").insert({ business_id: business.id, quote_id: id, kind: "status_change", from_status: prev.status, to_status: data.status });
    }
    revalidatePath("/app", "layout");
    return { ok: true, message: "Quote saved." };
  }

  // New quote: suggest a first follow-up if the user didn't pick one.
  if (!data.next_follow_up_at && data.sent_at) {
    const rec = recommendFollowUp({ ...data, id: "", archived: false, opted_out: false, created_at: "", updated_at: "" } as Quote, [], {
      firstFollowUpDays: business.first_follow_up_days, followUpIntervalDays: business.follow_up_interval_days, maxFollowUps: business.max_follow_ups,
    });
    data.next_follow_up_at = rec.date;
  }
  const { data: row, error } = await supabase.from("quotes").insert({ ...data, business_id: business.id }).select("id").single();
  if (error || !row) return { error: friendly(error) };
  revalidatePath("/app", "layout");
  redirect(`/app/quotes/${row.id}?created=1`);
}

export async function setQuoteFlags(id: string, flags: { archived?: boolean; opted_out?: boolean }) {
  z.string().uuid().parse(id);
  const clean = z.object({ archived: z.boolean().optional(), opted_out: z.boolean().optional() }).parse(flags);
  const { supabase } = await requireBusiness();
  await supabase.from("quotes").update(clean).eq("id", id);
  revalidatePath("/app", "layout");
}

export async function deleteQuote(id: string) {
  z.string().uuid().parse(id);
  const { supabase } = await requireBusiness();
  await supabase.from("quotes").delete().eq("id", id);
  revalidatePath("/app", "layout");
  redirect("/app/quotes?deleted=1");
}

export async function recordActivity(input: z.input<typeof activitySchema>): Promise<ActionState> {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the details and try again." };
  const { supabase, business } = await requireBusiness();
  const a = parsed.data;
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", a.quote_id).single<Quote>();
  if (!quote) return { error: "Quote not found." };

  const rows: Partial<Activity & { business_id: string }>[] = [
    { business_id: business.id, quote_id: a.quote_id, kind: a.kind, channel: a.channel ?? null, summary: a.summary, contributed_to_sale: a.contributed_to_sale ?? null },
  ];
  const update: Partial<Quote> = {};
  if (a.new_status && a.new_status !== quote.status) {
    update.status = a.new_status;
    rows.push({ business_id: business.id, quote_id: a.quote_id, kind: "status_change", from_status: quote.status, to_status: a.new_status });
  } else if (a.kind === "follow_up" && ["sent", "follow_up_due"].includes(quote.status)) {
    update.status = "awaiting_response";
    rows.push({ business_id: business.id, quote_id: a.quote_id, kind: "status_change", from_status: quote.status, to_status: "awaiting_response" });
  }
  const { error } = await supabase.from("activities").insert(rows);
  if (error) return { error: friendly(error) };

  if (a.next_follow_up_at !== null) update.next_follow_up_at = a.next_follow_up_at;
  else {
    const { data: acts } = await supabase.from("activities").select("*").eq("quote_id", a.quote_id);
    update.next_follow_up_at = recommendFollowUp({ ...quote, ...update }, (acts ?? []) as Activity[], {
      firstFollowUpDays: business.first_follow_up_days, followUpIntervalDays: business.follow_up_interval_days, maxFollowUps: business.max_follow_ups,
    }).date;
  }
  await supabase.from("quotes").update(update).eq("id", a.quote_id);
  revalidatePath("/app", "layout");
  return { ok: true, message: a.kind === "follow_up" ? "Follow-up recorded." : "Saved." };
}

export async function importQuotes(rows: unknown[]): Promise<ActionState & { inserted?: number }> {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 1000) return { error: "Import between 1 and 1,000 rows at a time." };
  const parsed = z.array(importRowSchema).safeParse(rows);
  if (!parsed.success) return { error: "Some rows are invalid. Fix the errors shown and try again." };
  const { supabase, business } = await requireBusiness();
  // Always inserts new records — never overwrites existing quotes.
  const { error, count } = await supabase.from("quotes").insert(parsed.data.map((r) => ({ ...r, business_id: business.id })), { count: "exact" });
  if (error) return { error: friendly(error) };
  revalidatePath("/app", "layout");
  return { ok: true, inserted: count ?? parsed.data.length };
}

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const schema = z.object({
    name: z.string().trim().min(1).max(120),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter code"),
    typical_quote_value: z.coerce.number().min(0).max(1e10),
    preferred_channel: z.enum(["whatsapp", "email", "phone", "other"]),
    first_follow_up_days: z.coerce.number().int().min(1).max(60),
    follow_up_interval_days: z.coerce.number().int().min(1).max(60),
    max_follow_ups: z.coerce.number().int().min(1).max(10),
    display_name: z.string().trim().max(80).transform((v) => v || null),
  });
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { supabase, business } = await requireBusiness();
  const { error } = await supabase.from("businesses").update(parsed.data).eq("id", business.id);
  if (error) return { error: friendly(error) };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Settings saved." };
}

export async function saveAvatar(dataUrl: string | null): Promise<ActionState> {
  if (dataUrl !== null && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl) || dataUrl.length > 70000)) {
    return { error: "Please use a JPEG, PNG or WebP image under 50 KB after resizing." };
  }
  const { supabase, business } = await requireBusiness();
  const { error } = await supabase.from("businesses").update({ avatar_data_url: dataUrl }).eq("id", business.id);
  if (error) return { error: friendly(error) };
  revalidatePath("/app", "layout");
  return { ok: true, message: dataUrl ? "Photo updated." : "Photo removed." };
}

async function reauth(email: string, password: string) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function changeEmail(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Enter your current password") }).safeParse(formObject(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { supabase, user } = await requireBusiness();
  if (!rateLimit(`reauth:${user.id}`, 5, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  if (!(await reauth(user.email ?? "", parsed.data.password))) return { fieldErrors: { password: ["Current password is incorrect"] } };
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
  if (error) return { error: "Could not change email. It may already be in use." };
  return { ok: true, message: "Check both inboxes to confirm the change." };
}

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z.object({ current: z.string().min(1, "Enter your current password"), password: z.string().min(10, "Use at least 10 characters").max(128) }).safeParse(formObject(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { supabase, user } = await requireBusiness();
  if (!rateLimit(`reauth:${user.id}`, 5, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  if (!(await reauth(user.email ?? "", parsed.data.current))) return { fieldErrors: { current: ["Current password is incorrect"] } };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not change password." };
  return { ok: true, message: "Password changed." };
}

export async function deleteAccount(_: ActionState, fd: FormData): Promise<ActionState> {
  if (fd.get("confirm") !== "DELETE") return { fieldErrors: { confirm: ['Type DELETE to confirm'] } };
  const { supabase, user } = await requireBusiness();
  // Cascades remove business, quotes, activities, reminders, entitlements.
  const { error } = await supabaseAdmin().auth.admin.deleteUser(user.id);
  if (error) return { error: "Could not delete your account. Contact support." };
  await supabase.auth.signOut();
  redirect("/?account_deleted=1");
}

export async function markRemindersRead() {
  const { supabase, business } = await requireBusiness();
  await supabase.from("reminders").update({ read_at: new Date().toISOString() }).eq("business_id", business.id).is("read_at", null);
  revalidatePath("/app", "layout");
}

/** Link a Whop purchase: verified server-side against the Whop API, never trusted from the client. */
export async function linkWhopMembership(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("membership_id") ?? "").trim();
  if (!/^mem_[A-Za-z0-9]+$/.test(id)) return { fieldErrors: { membership_id: ["Membership IDs start with mem_"] } };
  const { user, business } = await requireBusiness();
  if (!rateLimit(`whop:${user.id}`, 5, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  const m = await fetchWhopMembership(id);
  if (!m.ok) return { error: m.error };
  if (!GRANTING_STATUSES.has(m.membership.status)) return { error: `This membership is ${m.membership.status} and does not grant access.` };
  const admin = supabaseAdmin();
  const { data: existing } = await admin.from("entitlements").select("business_id").eq("whop_membership_id", id).maybeSingle();
  if (existing && existing.business_id !== business.id) return { error: "This membership is already linked to another QuoteRevive account. Contact support." };
  const { error } = await admin.from("entitlements").upsert({ business_id: business.id, source: "whop", whop_membership_id: id, status: "active", updated_at: new Date().toISOString() });
  if (error) return { error: "Could not activate access. Contact support." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Founding Access is active. Thank you!" };
}
