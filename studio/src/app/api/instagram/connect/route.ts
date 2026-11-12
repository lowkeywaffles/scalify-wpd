import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeUrl, igConfigured } from "@/lib/instagram";
import { currentMember } from "@/lib/members";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await currentMember();
  if (!me) return NextResponse.redirect(`${publicEnv.siteUrl}/login`);
  if (!igConfigured()) return NextResponse.redirect(`${publicEnv.siteUrl}/studio/accounts?ig=not_configured`);
  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("studio_ig_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/instagram", maxAge: 600 });
  return res;
}
