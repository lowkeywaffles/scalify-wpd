"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

export type AuthState = { error?: string; message?: string; fieldErrors?: Record<string, string[]> };

async function ipKey(prefix: string) {
  const h = await headers();
  return `${prefix}:${(h.get("x-forwarded-for") ?? "local").split(",")[0].trim()}`;
}
const email = z.string().trim().toLowerCase().email("Enter a valid email");

export async function signIn(_: AuthState, fd: FormData): Promise<AuthState> {
  const p = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { fieldErrors: z.flattenError(p.error).fieldErrors };
  if (!rateLimit(await ipKey("signin"), 10, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(p.data);
  if (error) return { error: error.message.toLowerCase().includes("confirm") ? "Please confirm your email first — check your inbox." : "Email or password is incorrect." };
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/app") ? next : "/app/queue");
}

export async function signUp(_: AuthState, fd: FormData): Promise<AuthState> {
  const p = z.object({
    email,
    password: z.string().min(10, "Use at least 10 characters").max(128),
    terms: z.literal("yes", { message: "Please accept the Terms and Privacy Policy to create an account" }),
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { fieldErrors: z.flattenError(p.error).fieldErrors };
  if (!rateLimit(await ipKey("signup"), 5, 60 * 60_000)) return { error: "Too many sign-ups from this network. Try again later." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signUp({
    email: p.data.email,
    password: p.data.password,
    options: { emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/app/onboarding`, data: { terms_accepted_at: new Date().toISOString(), terms_version: "2026-11-09" } },
  });
  if (error) return { error: "Couldn't create the account. If you already have one, sign in or reset your password." };
  return { message: "Check your inbox to confirm your email, then sign in." };
}

export async function requestReset(_: AuthState, fd: FormData): Promise<AuthState> {
  const p = email.safeParse(fd.get("email"));
  if (!p.success) return { fieldErrors: { email: ["Enter a valid email"] } };
  if (!rateLimit(await ipKey("reset"), 5, 60 * 60_000)) return { error: "Too many requests. Try again later." };
  const supabase = await supabaseServer();
  await supabase.auth.resetPasswordForEmail(p.data, { redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/reset-password` });
  // Same answer whether or not the account exists (prevents account enumeration).
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const p = z.string().min(10, "Use at least 10 characters").max(128).safeParse(fd.get("password"));
  if (!p.success) return { fieldErrors: { password: [p.error.issues[0].message] } };
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: p.data });
  if (error) return { error: "Could not update password." };
  redirect("/app/queue");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
