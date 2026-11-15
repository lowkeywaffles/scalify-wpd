import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { corsHeaders, isStoreProduct, STORE_PRODUCTS } from "@/lib/store-products";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  method: z.enum(["telebirr", "boa"]),
  payer_name: z.string().trim().min(2).max(120),
  reference: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,60}$/),
});

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

/** Records "I paid by Telebirr/bank" for the operator to check. Returns the licence key; grants nothing yet. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ product: string }> }) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  if (!headers["Access-Control-Allow-Origin"]) return NextResponse.json({ error: "Not allowed" }, { status: 403, headers });
  const { product } = await params;
  if (!isStoreProduct(product)) return NextResponse.json({ error: "Unknown product" }, { status: 404, headers });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"; // used for rate limiting only, never stored
  if (!rateLimit(`store:${ip}`, 5, 60 * 60_000)) return NextResponse.json({ error: "Too many attempts. Please try again in an hour." }, { status: 429, headers });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check your name and transaction ID (letters and numbers only)." }, { status: 400, headers });

  const admin = supabaseAdmin();
  const { count } = await admin.from("store_orders").select("id", { count: "exact", head: true }).eq("status", "pending");
  if ((count ?? 0) >= 300) return NextResponse.json({ error: "We can't take new payments right now. Please contact us." }, { status: 503, headers });

  const { data, error } = await admin.from("store_orders")
    .insert({ product, method: parsed.data.method, amount_etb: STORE_PRODUCTS[product].priceEtb(), payer_name: parsed.data.payer_name, reference: parsed.data.reference })
    .select("id, status, amount_etb").single();
  if (error || !data) {
    if (error?.code === "23505") return NextResponse.json({ error: "This transaction ID was already submitted. If that was you, use your licence key to restore." }, { status: 409, headers });
    console.error("[store] insert failed", error?.message);
    return NextResponse.json({ error: "Couldn't save that. Please try again." }, { status: 500, headers });
  }
  return NextResponse.json({ key: data.id, status: data.status, amount_etb: Number(data.amount_etb) }, { status: 201, headers });
}
