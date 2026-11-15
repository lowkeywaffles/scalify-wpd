import { NextResponse, type NextRequest } from "next/server";
import { corsHeaders, isStoreProduct, payMethods, STORE_PRODUCTS } from "@/lib/store-products";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

/** Price and payment details for a product. Public information: no personal data in or out. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ product: string }> }) {
  const headers = corsHeaders(req.headers.get("origin"));
  const { product } = await params;
  if (!isStoreProduct(product)) return NextResponse.json({ error: "Unknown product" }, { status: 404, headers });
  const p = STORE_PRODUCTS[product];
  return NextResponse.json({ product, name: p.name, price_etb: p.priceEtb(), currency: "ETB", methods: payMethods() }, { headers });
}
