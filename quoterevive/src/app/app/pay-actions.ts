"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/data";
import { first6Remaining, isOperator } from "@/lib/local-pay";
import { etbWithPromo, FIRST6, first6Active } from "@/lib/offer";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";
import { takeOnePromoSpot } from "@/lib/whop";

export type PayState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string[] | undefined> };

const submitSchema = z.object({
  method: z.enum(["telebirr", "boa"], { message: "Choose how you paid" }),
  payer_name: z.string().trim().min(2, "Enter the name the payment was sent from").max(120),
  reference: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,60}$/, "Enter the transaction ID from your Telebirr SMS or bank receipt (letters and numbers)"),
  promo: z.string().trim().toUpperCase().max(20).optional().transform((v) => v || ""),
  confirm: z.literal("on", { message: "Please confirm you have already sent the payment" }),
});

/** Records a local payment for the operator to check. Grants nothing by itself. */
export async function submitLocalPayment(_: PayState, fd: FormData): Promise<PayState> {
  const parsed = submitSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { supabase, business, user } = await requireBusiness();
  if (!rateLimit(`localpay:${user.id}`, 5, 60 * 60_000)) return { error: "Too many attempts. Please wait an hour or message us on WhatsApp." };
  const { data: ent } = await supabase.from("entitlements").select("status").maybeSingle();
  if (ent?.status === "active") return { error: "Founding Access is already active on this account." };

  const admin = supabaseAdmin();
  const { count: open } = await admin.from("manual_payments").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "pending");
  if ((open ?? 0) > 0) return { error: "You already have a payment waiting to be checked. We'll update this page as soon as it's reviewed." };

  let promo: string | null = null;
  if (parsed.data.promo) {
    if (parsed.data.promo !== FIRST6.code) return { fieldErrors: { promo: ["That code isn't valid."] } };
    if (!first6Active()) return { fieldErrors: { promo: ["FIRST6 has ended."] } };
    if ((await first6Remaining()) < 1) return { fieldErrors: { promo: ["All 6 FIRST6 spots are taken. You can still pay the normal price."] } };
    promo = FIRST6.code;
  }
  const { error } = await admin.from("manual_payments").insert({
    business_id: business.id, method: parsed.data.method, amount_etb: etbWithPromo(Boolean(promo)), promo_code: promo,
    payer_name: parsed.data.payer_name, reference: parsed.data.reference,
  });
  if (error) {
    if (error.code === "23505") return { fieldErrors: { reference: ["This transaction ID has already been submitted."] } };
    console.error("[localpay] insert failed", error.message);
    return { error: "We couldn't save that. Please try again, or message us on WhatsApp." };
  }
  revalidatePath("/app/billing");
  return { ok: true, message: "Thanks! We'll check the payment and unlock your account, usually within 24 hours. This page will update." };
}

async function requireOperator() {
  const ctx = await requireBusiness();
  if (!isOperator(ctx.user.email)) throw new Error("Not allowed");
  return ctx;
}

const Id = z.string().uuid();

/** Operator: confirm the money arrived, then unlock the payer's workspace. */
export async function approvePayment(id: string): Promise<PayState> {
  const { user } = await requireOperator();
  if (!Id.safeParse(id).success) return { error: "Invalid request." };
  const admin = supabaseAdmin();
  const { data: row } = await admin.from("manual_payments").update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.email })
    .eq("id", id).eq("status", "pending").select("business_id, promo_code").maybeSingle();
  if (!row) return { error: "Already reviewed, or not found." };
  const { error } = await admin.from("entitlements").upsert({ business_id: row.business_id, source: "manual", status: "active", plan: "founding", updated_at: new Date().toISOString() }, { onConflict: "business_id" });
  if (error) {
    await admin.from("manual_payments").update({ status: "pending", reviewed_at: null, reviewed_by: null }).eq("id", id);
    console.error("[localpay] entitlement failed", error.message);
    return { error: "Couldn't unlock the account. Nothing was changed; try again." };
  }
  let note = "";
  if (row.promo_code === FIRST6.code && !(await takeOnePromoSpot(FIRST6.whopPromoId))) note = " (Couldn't reduce the FIRST6 count on Whop. Lower it by one in Whop by hand.)";
  revalidatePath("/app/admin/payments");
  return { ok: true, message: `Approved and unlocked.${note}` };
}

/** Operator: the money wasn't found (or wrong amount). Tells the customer why. */
export async function rejectPayment(id: string, reason: string): Promise<PayState> {
  const { user } = await requireOperator();
  const r = z.string().trim().min(3, "Give a short reason the customer will see").max(300).safeParse(reason);
  if (!Id.safeParse(id).success || !r.success) return { error: r.success ? "Invalid request." : r.error.issues[0].message };
  const { data } = await supabaseAdmin().from("manual_payments").update({ status: "rejected", review_note: r.data, reviewed_at: new Date().toISOString(), reviewed_by: user.email })
    .eq("id", id).eq("status", "pending").select("id").maybeSingle();
  revalidatePath("/app/admin/payments");
  return data ? { ok: true, message: "Marked as not received. The customer sees your reason." } : { error: "Already reviewed, or not found." };
}
