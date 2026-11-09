import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["signup", "recovery", "email_change", "email", "invite", "magiclink"];

/**
 * Email links (confirm signup, reset password, change email) land here with a token_hash.
 * Unlike the PKCE code flow, this works even if the link opens in a different browser
 * (e.g. Gmail's in-app browser on a phone).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : "/app/onboarding");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL(`/login?error=${type === "recovery" ? "reset" : "link"}`, url.origin));
}
