import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { Activity, Quote } from "./types";

export interface Business {
  id: string;
  name: string;
  industry: string | null;
  currency: string;
  typical_quote_value: number;
  preferred_channel: "whatsapp" | "email" | "phone" | "other";
  first_follow_up_days: number;
  follow_up_interval_days: number;
  max_follow_ups: number;
  display_name: string | null;
  avatar_data_url: string | null;
  onboarded_at: string | null;
}

/** Returns the signed-in user + their business. Redirects to login otherwise. Authorization = RLS + this check. */
export async function requireBusiness() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  let { data: business } = await supabase.from("businesses").select("*").eq("owner_id", auth.user.id).maybeSingle<Business>();
  if (!business) {
    const ins = await supabase.from("businesses").insert({ owner_id: auth.user.id }).select("*").single<Business>();
    business = ins.data;
  }
  if (!business) throw new Error("Could not load your workspace.");
  business.typical_quote_value = Number(business.typical_quote_value);
  return { supabase, user: auth.user, business };
}

export async function loadWorkspace() {
  const ctx = await requireBusiness();
  const [quotes, activities, ent] = await Promise.all([
    ctx.supabase.from("quotes").select("*").order("created_at", { ascending: false }).limit(5000),
    ctx.supabase.from("activities").select("*").order("occurred_at", { ascending: true }).limit(20000),
    ctx.supabase.from("entitlements").select("status, source, plan").maybeSingle(),
  ]);
  return {
    ...ctx,
    quotes: (quotes.data ?? []).map((q) => ({ ...q, amount: Number(q.amount) })) as Quote[],
    activities: (activities.data ?? []) as Activity[],
    paid: ent.data?.status === "active",
  };
}
