import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { encryptSecret } from "@/lib/crypto";
import { publicEnv } from "@/lib/env";
import { exchangeCode, igConfigured } from "@/lib/instagram";
import { currentMember } from "@/lib/members";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const back = (q: string) => {
  const res = NextResponse.redirect(`${publicEnv.siteUrl}/studio/accounts?ig=${q}`);
  res.cookies.set("studio_ig_state", "", { path: "/api/instagram", maxAge: 0 });
  return res;
};

export async function GET(req: NextRequest) {
  const me = await currentMember();
  if (!me) return NextResponse.redirect(`${publicEnv.siteUrl}/login`);
  if (!igConfigured()) return back("not_configured");
  const p = req.nextUrl.searchParams;
  if (p.get("error")) return back("denied");
  const state = p.get("state") ?? "";
  const expected = req.cookies.get("studio_ig_state")?.value ?? "";
  if (!state || !expected || state.length !== expected.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) return back("state");
  const code = p.get("code");
  if (!code) return back("error");
  try {
    const r = await exchangeCode(code);
    const db = supabaseAdmin();
    for (const a of r.accounts) {
      const { data: acc, error } = await db.from("studio_accounts").upsert(
        { platform: "instagram", external_id: a.igId, username: a.username, token_expires_at: r.expiresAt?.toISOString() ?? null, token_refreshed_at: new Date().toISOString(), connected_by: me.email },
        { onConflict: "platform,external_id" },
      ).select("id").single();
      if (error || !acc) throw new Error(error?.message ?? "save failed");
      const { error: secErr } = await db.from("studio_secrets").upsert({ account_id: acc.id, token_ciphertext: encryptSecret(r.token), updated_at: new Date().toISOString() });
      if (secErr) throw new Error(secErr.message);
    }
    return back("connected");
  } catch (e) {
    console.error("[studio] instagram connect failed", e instanceof Error ? e.message : e);
    return back("error");
  }
}
