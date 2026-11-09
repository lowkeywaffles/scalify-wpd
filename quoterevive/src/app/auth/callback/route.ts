import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Fallback for PKCE links (?code=). Fails if opened in a different browser than the one that started the flow. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL(`/login?error=${safeNext === "/reset-password" ? "reset" : "link"}`, url.origin));
}
