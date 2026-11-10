import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatDate, formatMoney } from "@/lib/dates";
import { LogoMark } from "@/components/Logo";
import { QuoteResponseForm } from "@/components/QuoteResponseForm";

export const metadata = { title: "Your quote", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Public page a business shares with its customer. Shows only what the customer needs; nothing about other quotes. */
export default async function PublicQuote({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) notFound();
  const admin = supabaseAdmin();
  const { data: q } = await admin
    .from("quotes")
    .select("customer_name, title, description, amount, currency, expires_at, status, archived, share_enabled, business_id")
    .eq("share_token", token)
    .maybeSingle();
  if (!q || !q.share_enabled || q.archived) notFound();
  const { data: b } = await admin.from("businesses").select("name").eq("id", q.business_id).maybeSingle();
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
          <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div><dt className="text-xs uppercase tracking-wide text-muted">Total</dt><dd className="mt-1 font-display text-4xl">{formatMoney(Number(q.amount), q.currency)}</dd></div>
            {q.expires_at && <div><dt className="text-xs uppercase tracking-wide text-muted">Valid until</dt><dd className="mt-2 text-lg">{formatDate(q.expires_at)}</dd></div>}
          </dl>
        </article>
        {closed ? (
          <p className="card p-5 text-center">{q.status === "accepted" ? "This quote has been accepted. Thank you!" : "This quote is closed. Contact the business if you'd like a new one."}</p>
        ) : <QuoteResponseForm token={token} />}
        <p className="flex items-center justify-center gap-2 text-xs text-muted"><LogoMark size={16} /> Sent with QuoteRevive · Your answer goes only to {b?.name || "this business"}.</p>
      </div>
    </main>
  );
}
