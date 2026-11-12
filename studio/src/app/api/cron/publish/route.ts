import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { tick } from "@/lib/publisher";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Accepts Vercel's own cron (CRON_SECRET) or Supabase pg_cron (a secret generated inside the Supabase vault). */
async function authorized(req: NextRequest): Promise<boolean> {
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (given.length < 32 || given.length > 200) return false;
  const secret = process.env.CRON_SECRET ?? "";
  if (secret.length >= 32 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret))) return true;
  const { data, error } = await supabaseAdmin().rpc("studio_check_cron_token", { p_token: given });
  return !error && data === true;
}

async function handle(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await tick());
  } catch (e) {
    console.error("[studio] tick failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "tick failed" }, { status: 500 });
  }
}
export const GET = handle;
export const POST = handle;
