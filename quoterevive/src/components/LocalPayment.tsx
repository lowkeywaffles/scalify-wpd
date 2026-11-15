"use client";
/* eslint-disable @next/next/no-img-element -- small static QR served from /public */
import { useActionState, useState } from "react";
import { submitLocalPayment, type PayState } from "@/app/app/pay-actions";
import { aria, Field, Notice } from "./ui";

type Props = {
  priceEtb: string; promoPriceEtb: string; promoOpen: boolean; spotsLeft: number;
  telebirr: { label: string; accountName: string; qr: string; hint: string };
  boa: { label: string; accountName: string; accountNumber: string; hint: string };
};

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn btn-ghost !min-h-9 !px-3 text-xs" aria-label={`Copy ${label}`}
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* user can select the text */ } }}>
      <span aria-live="polite">{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function LocalPayment(p: Props) {
  const [s, action, pending] = useActionState<PayState, FormData>(submitLocalPayment, {});
  const [method, setMethod] = useState<"telebirr" | "boa">("telebirr");
  const [promo, setPromo] = useState("");
  const e = s.fieldErrors ?? {};
  const usingPromo = p.promoOpen && promo.trim().toUpperCase() === "FIRST6";
  if (s.ok) return <Notice kind="ok">{s.message}</Notice>;
  return (
    <div className="space-y-5">
      <ol className="space-y-5">
        <li>
          <p className="font-semibold">1. Send <span className="tabular-nums">{usingPromo ? p.promoPriceEtb : p.priceEtb}</span>{usingPromo && <span className="ml-2 text-sm font-normal text-muted line-through">{p.priceEtb}</span>}</p>
          <div role="radiogroup" aria-label="Payment method" className="mt-3 flex flex-wrap gap-2">
            {(["telebirr", "boa"] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${method === m ? "border-ink bg-ink text-bg" : "border-line"}`}>
                {m === "telebirr" ? p.telebirr.label : p.boa.label}
              </button>
            ))}
          </div>
          {method === "telebirr" ? (
            <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface-2 p-4">
              <img src={p.telebirr.qr} alt={`Telebirr payment QR code for ${p.telebirr.accountName}`} width={180} height={179} className="rounded-xl bg-white p-1" />
              <div className="min-w-0 space-y-1 text-sm">
                <p><span className="text-muted">Name:</span> <strong>{p.telebirr.accountName}</strong></p>
                <p className="text-muted">{p.telebirr.hint}</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2 rounded-2xl border border-line bg-surface-2 p-4 text-sm">
              <p><span className="text-muted">Bank:</span> <strong>{p.boa.label}</strong></p>
              <p className="flex flex-wrap items-center gap-2"><span className="text-muted">Account number:</span> <strong className="font-mono text-base tracking-wider select-all">{p.boa.accountNumber}</strong><Copy text={p.boa.accountNumber} label="account number" /></p>
              <p><span className="text-muted">Account name:</span> <strong>{p.boa.accountName}</strong></p>
              <p className="text-muted">{p.boa.hint}</p>
            </div>
          )}
        </li>
        <li>
          <p className="font-semibold">2. Tell us it&apos;s sent</p>
          <form action={action} className="mt-3 space-y-3" noValidate>
            <input type="hidden" name="method" value={method} />
            <Field id="payer_name" label="Name the payment came from" error={e.payer_name}><input {...aria("payer_name", e.payer_name)} className="input" autoComplete="name" maxLength={120} required /></Field>
            <Field id="reference" label="Transaction ID" hint="From the Telebirr SMS or your bank receipt, e.g. CK12AB34CD" error={e.reference}><input {...aria("reference", e.reference, true)} className="input uppercase" autoComplete="off" spellCheck={false} maxLength={60} required /></Field>
            {p.promoOpen && (
              <Field id="promo" label="Promo code" optional hint={`FIRST6 = 50% off · ${p.spotsLeft} of 6 spots left · ends Nov 18`} error={e.promo}><input {...aria("promo", e.promo, true)} className="input uppercase" value={promo} onChange={(ev) => setPromo(ev.target.value)} maxLength={20} autoComplete="off" /></Field>
            )}
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirm" className="mt-1 h-4 w-4" aria-describedby={e.confirm ? "confirm-error" : undefined} /> <span>I have already sent the payment above.</span></label>
            {e.confirm && <p id="confirm-error" className="text-sm text-bad">{e.confirm[0]}</p>}
            <button className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Submit for checking"}</button>
            <p className="hint">We check every payment by hand and unlock your account, usually within 24 hours. We only use these details to match your payment. 14-day refund to the same Telebirr or bank account.</p>
            <div aria-live="polite">{s.error && <Notice kind="error">{s.error}</Notice>}</div>
          </form>
        </li>
      </ol>
    </div>
  );
}
