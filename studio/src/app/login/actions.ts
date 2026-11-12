"use server";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { allow } from "@/lib/rate-limit";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export type LoginState = { step: "email" | "code"; email?: string; message?: string; error?: string };
const Email = z.string().trim().toLowerCase().email().max(254);
const GENERIC = "If this email is on the Studio team list, we've sent it an 8-digit sign-in code. It can take a minute.";

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function requestCode(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = Email.safeParse(form.get("email"));
  if (!parsed.success) return { step: "email", error: "Enter a valid email address." };
  const email = parsed.data;
  if (!allow(`req:${await ip()}`, 8, 15 * 60_000) || !allow(`req:${email}`, 4, 15 * 60_000)) {
    return { step: "email", error: "Too many attempts. Wait 15 minutes and try again." };
  }
  const admin = supabaseAdmin();
  const { data: member } = await admin.from("studio_members").select("email").eq("email", email).maybeSingle();
  if (member) {
    const { data: rows } = await admin.rpc("studio_auth_user", { p_email: email });
    const existing = Array.isArray(rows) ? (rows[0] as { id: string; confirmed: boolean } | undefined) : undefined;
    if (!existing) {
      const { error } = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (error) console.error("[studio] createUser failed", error.message);
    } else if (!existing.confirmed) {
      // Someone may have pre-registered this email elsewhere with their own password. Wipe it before confirming.
      const { error } = await admin.auth.admin.updateUserById(existing.id, { password: randomBytes(32).toString("base64url"), email_confirm: true });
      if (error) console.error("[studio] secure pre-existing user failed", error.message);
    }
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) {
      console.error("[studio] signInWithOtp failed", error.message);
      if (/rate|seconds/i.test(error.message)) return { step: "email", error: "Please wait a minute before asking for another code." };
    }
  }
  return { step: "code", email, message: GENERIC };
}

export async function verifyCode(_: LoginState, form: FormData): Promise<LoginState> {
  const email = Email.safeParse(form.get("email"));
  const code = z.string().trim().regex(/^\d{6,10}$/).safeParse(String(form.get("code") ?? "").replace(/\s/g, ""));
  if (!email.success) return { step: "email", error: "Start again with your email." };
  if (!code.success) return { step: "code", email: email.data, error: "Enter the code from the email (digits only)." };
  if (!allow(`ver:${email.data}`, 8, 15 * 60_000)) return { step: "code", email: email.data, error: "Too many attempts. Request a new code in 15 minutes." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token: code.data, type: "email" });
  if (error) return { step: "code", email: email.data, error: "That code is wrong or has expired. Check the latest email, or request a new code." };
  const { data: member } = await supabase.from("studio_members").select("email").eq("email", email.data).maybeSingle();
  if (!member) {
    await supabase.auth.signOut();
    return { step: "email", error: "This account doesn't have Studio access." };
  }
  redirect("/studio");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
