import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { corsHeaders, isStoreProduct } from "@/lib/store-products";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

/** Licence status for a key. The key is a random UUID known only to the buyer. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ product: string; key: string }> }) {
  const headers = corsHeaders(req.headers.get("origin"));
  const { product, key } = await params;
  if (!isStoreProduct(product) || !z.string().uuid().safeParse(key).success) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`storeget:${ip}`, 120, 60 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  const { data } = await supabaseAdmin().from("store_orders").select("status, review_note").eq("id", key).eq("product", product).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  const status = data.status === "approved" ? "active" : data.status;
  return NextResponse.json({ status, note: data.status === "rejected" ? data.review_note ?? "" : "" }, { headers });
}
