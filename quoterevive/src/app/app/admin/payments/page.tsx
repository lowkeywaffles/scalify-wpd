import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/data";
import { isOperator } from "@/lib/local-pay";
import { formatEtb, LOCAL_PAY } from "@/lib/offer";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PaymentReview, StoreOrderReview } from "@/components/PaymentReview";
import { STORE_PRODUCTS, type StoreProduct } from "@/lib/store-products";

export const metadata = { title: "Local payments" };
export const dynamic = "force-dynamic";

type Row = { id: string; business_id: string; method: "telebirr" | "boa"; amount_etb: number; promo_code: string | null; payer_name: string; reference: string; status: string; review_note: string | null; created_at: string; reviewed_by: string | null };

export default async function PaymentsAdmin() {
  const { user } = await requireBusiness();
  if (!isOperator(user.email)) notFound();
  const admin = supabaseAdmin();
  const { data } = await admin.from("manual_payments").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];
  const ids = [...new Set(rows.map((r) => r.business_id))];
  const { data: biz } = ids.length ? await admin.from("businesses").select("id, name").in("id", ids) : { data: [] };
  const name = new Map((biz ?? []).map((b) => [b.id, b.name as string]));
  const { data: so } = await admin.from("store_orders").select("*").order("created_at", { ascending: false }).limit(100);
  const orders = (so ?? []) as { id: string; product: StoreProduct; method: "telebirr" | "boa"; amount_etb: number; payer_name: string; reference: string; status: string; review_note: string | null; created_at: string }[];
  const openOrders = orders.filter((o) => o.status === "pending");
  const pastOrders = orders.filter((o) => o.status !== "pending");
  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");
  const when = (s: string) => new Date(s).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Local payments</h1>
        <p className="text-muted">Check each one in your Telebirr or Bank of Abyssinia history (same transaction ID and amount) before unlocking. Times are Addis Ababa time.</p>
      </div>
      <section aria-labelledby="p-h" className="space-y-3">
        <h2 id="p-h" className="font-display text-2xl">Waiting ({pending.length})</h2>
        {pending.length === 0 && <p className="text-muted">Nothing to check right now.</p>}
        {pending.map((r) => (
          <article key={r.id} className="card space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{name.get(r.business_id) || "Unnamed workspace"}</p>
              <p className="text-sm text-muted">{when(r.created_at)}</p>
            </div>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div><dt className="inline text-muted">Method: </dt><dd className="inline font-semibold">{LOCAL_PAY[r.method].label}</dd></div>
              <div><dt className="inline text-muted">Amount expected: </dt><dd className="inline font-semibold tabular-nums">{formatEtb(Number(r.amount_etb))}{r.promo_code ? ` (${r.promo_code})` : ""}</dd></div>
              <div><dt className="inline text-muted">From: </dt><dd className="inline">{r.payer_name}</dd></div>
              <div><dt className="inline text-muted">Transaction ID: </dt><dd className="inline font-mono">{r.reference}</dd></div>
            </dl>
            <PaymentReview id={r.id} />
          </article>
        ))}
      </section>
      <section aria-labelledby="so-h" className="space-y-3">
        <h2 id="so-h" className="font-display text-2xl">Other products: waiting ({openOrders.length})</h2>
        {openOrders.length === 0 && <p className="text-muted">Nothing to check right now.</p>}
        {openOrders.map((o) => (
          <article key={o.id} className="card space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{STORE_PRODUCTS[o.product]?.name ?? o.product}</p>
              <p className="text-sm text-muted">{when(o.created_at)}</p>
            </div>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div><dt className="inline text-muted">Method: </dt><dd className="inline font-semibold">{LOCAL_PAY[o.method].label}</dd></div>
              <div><dt className="inline text-muted">Amount expected: </dt><dd className="inline font-semibold tabular-nums">{formatEtb(Number(o.amount_etb))}</dd></div>
              <div><dt className="inline text-muted">From: </dt><dd className="inline">{o.payer_name}</dd></div>
              <div><dt className="inline text-muted">Transaction ID: </dt><dd className="inline font-mono">{o.reference}</dd></div>
            </dl>
            <StoreOrderReview id={o.id} status={o.status} />
          </article>
        ))}
        {pastOrders.length > 0 && (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {pastOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
                <span className={`font-semibold ${o.status === "approved" ? "text-good" : "text-bad"}`}>{o.status === "approved" ? "Unlocked" : o.status === "refunded" ? "Refunded" : "Not received"}</span>
                <span>{STORE_PRODUCTS[o.product]?.name ?? o.product}</span>
                <span className="tabular-nums">{formatEtb(Number(o.amount_etb))}</span>
                <span className="font-mono text-muted">{o.reference}</span>
                <span className="text-muted">{o.payer_name} · {when(o.created_at)}</span>
                {o.status === "approved" && <span className="w-full"><StoreOrderReview id={o.id} status={o.status} /></span>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {done.length > 0 && (
        <section aria-labelledby="d-h" className="space-y-2">
          <h2 id="d-h" className="font-display text-2xl">Reviewed</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {done.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
                <span className={`font-semibold ${r.status === "approved" ? "text-good" : "text-bad"}`}>{r.status === "approved" ? "Unlocked" : "Not received"}</span>
                <span>{name.get(r.business_id) || "Workspace"}</span>
                <span className="tabular-nums">{formatEtb(Number(r.amount_etb))}</span>
                <span className="font-mono text-muted">{r.reference}</span>
                <span className="text-muted">{when(r.created_at)}{r.reviewed_by ? ` · by ${r.reviewed_by}` : ""}</span>
                {r.review_note && <span className="w-full text-muted">Reason: {r.review_note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
