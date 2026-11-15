import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatDate, formatMoney } from "@/lib/dates";
import { LogoMark } from "@/components/Logo";
import { QuoteResponseForm } from "@/components/QuoteResponseForm";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Your quote", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Public page a business shares with its customer. Shows only what the customer needs; nothing about other quotes. */
export default async function PublicQuote({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) notFound();
  const admin = supabaseAdmin();
  const { data: q } = await admin
    .from("quotes")
    .select("customer_name, title, description, items, amount, currency, sent_at, expires_at, status, archived, share_enabled, business_id")
    .eq("share_token", token)
    .maybeSingle();
  if (!q || !q.share_enabled || q.archived) notFound();
  const { data: b } = await admin.from("businesses").select("name, payment_instructions").eq("id", q.business_id).maybeSingle();
  const items = (Array.isArray(q.items) ? q.items : []) as { d: string; q: number; p: number }[];
  const first = q.customer_name.trim().split(/\s+/)[0];
  const closed = ["accepted", "rejected", "expired"].includes(q.status);
  return (
    <main id="main" className="relative min-h-dvh overflow-hidden px-4 py-10 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 max-w-3xl rounded-full bg-accent/20 blur-3xl" />
      <div className="relative mx-auto max-w-xl space-y-6">
        <p className="text-sm text-muted">Quote from</p>
        <h1 className="font-display text-4xl sm:text-5xl">{b?.name || "Your supplier"}</h1>
        <article className="card space-y-4 p-6 sm:p-8">
          <p className="text-muted">Hi {first},</p>
          <h2 className="text-xl font-semibold">{q.title}</h2>
          {q.description && <p className="whitespace-pre-line text-muted">{q.description}</p>}
          {items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Quote breakdown</caption>
                <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th scope="col" className="py-2 pr-2 font-semibold">Item</th><th scope="col" className="py-2 px-2 text-right font-semibold">Qty</th><th scope="col" className="py-2 px-2 text-right font-semibold">Price</th><th scope="col" className="py-2 pl-2 text-right font-semibold">Amount</th></tr></thead>
                <tbody>{items.map((it, i) => (
                  <tr key={i} className="border-b border-line/60"><td className="py-2 pr-2">{it.d}</td><td className="py-2 px-2 text-right tabular-nums">{it.q}</td><td className="py-2 px-2 text-right tabular-nums">{formatMoney(it.p, q.currency)}</td><td className="py-2 pl-2 text-right tabular-nums">{formatMoney(Math.round(it.q * it.p * 100) / 100, q.currency)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div><dt className="text-xs uppercase tracking-wide text-muted">Total</dt><dd className="mt-1 font-display text-4xl">{formatMoney(Number(q.amount), q.currency)}</dd></div>
            {q.expires_at && <div><dt className="text-xs uppercase tracking-wide text-muted">Valid until</dt><dd className="mt-2 text-lg">{formatDate(q.expires_at)}</dd></div>}
          </dl>
          {q.sent_at && <p className="text-xs text-muted">Quote date: {formatDate(q.sent_at)}</p>}
        </article>
        {b?.payment_instructions && (
          <section aria-labelledby="pay-h" className="card space-y-2 p-5 sm:p-6">
            <h2 id="pay-h" className="font-semibold">How to pay</h2>
            <p className="whitespace-pre-line text-muted">{b.payment_instructions}</p>
            <p className="text-xs text-muted">Payment goes directly to {b?.name || "the business"}, not to QuoteRevive. Check the details with them if you&apos;re unsure.</p>
          </section>
        )}
        <div className="flex justify-center"><PrintButton /></div>
        {closed ? (
          <p className="card p-5 text-center">{q.status === "accepted" ? "This quote has been accepted. Thank you!" : "This quote is closed. Contact the business if you'd like a new one."}</p>
        ) : <QuoteResponseForm token={token} />}
        <p className="flex items-center justify-center gap-2 text-xs text-muted"><LogoMark size={16} /> Sent with QuoteRevive · Your answer goes only to {b?.name || "this business"}.</p>
      </div>
    </main>
  );
}
