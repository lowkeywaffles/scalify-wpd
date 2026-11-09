import { NextResponse } from "next/server";
import { loadWorkspace } from "@/lib/data";
import { toCsv } from "@/lib/csv";

/** Full data export (quotes CSV or everything as JSON). Read-only, same-origin session cookie. */
export async function GET(req: Request) {
  const { quotes, activities, business, user } = await loadWorkspace();
  const format = new URL(req.url).searchParams.get("format");
  if (format === "json") {
    const body = JSON.stringify({ exported_at: new Date().toISOString(), account: { email: user.email }, business, quotes, activities }, null, 2);
    return new NextResponse(body, { headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="quoterevive-export.json"', "Cache-Control": "no-store" } });
  }
  const cols = ["customer_name", "customer_email", "customer_phone", "title", "description", "amount", "currency", "sent_at", "expires_at", "status", "next_follow_up_at", "notes", "archived"] as const;
  const csv = toCsv([...cols], quotes.map((q) => cols.map((c) => q[c])));
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="quoterevive-quotes.csv"', "Cache-Control": "no-store" } });
}
