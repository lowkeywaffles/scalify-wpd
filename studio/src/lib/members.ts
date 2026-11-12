import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";

export type Member = { userId: string; email: string; role: "owner" | "member" };

/** Returns the signed-in Studio member, or null. Membership is checked in the database (RLS function). */
export async function currentMember(): Promise<Member | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email || !user.email_confirmed_at) return null;
  const { data: row } = await supabase.from("studio_members").select("role").eq("email", user.email.toLowerCase()).maybeSingle();
  if (!row) return null;
  return { userId: user.id, email: user.email.toLowerCase(), role: row.role === "owner" ? "owner" : "member" };
}

export async function requireMember(): Promise<Member> {
  const m = await currentMember();
  if (!m) redirect("/login");
  return m;
}

export async function requireOwner(): Promise<Member> {
  const m = await requireMember();
  if (m.role !== "owner") redirect("/studio");
  return m;
}
