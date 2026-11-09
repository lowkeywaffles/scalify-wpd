"use client";
import { useActionState } from "react";
import { saveQuote, type ActionState } from "@/app/app/actions";
import { Quote, QUOTE_STATUSES, STATUS_LABEL } from "@/lib/types";
import { aria, Field, Notice } from "./ui";

export function QuoteForm({ quote, currency }: { quote?: Quote; currency: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveQuote, {});
  const e = state.fieldErrors ?? {};
  const v = (k: keyof Quote) => (quote?.[k] ?? "") as string;
  return (
    <form action={action} className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-6" noValidate>
      {quote && <input type="hidden" name="id" value={quote.id} />}
      <Field id="customer_name" label="Customer name" error={e.customer_name}><input {...aria("customer_name", e.customer_name)} className="input" defaultValue={v("customer_name")} required maxLength={120} autoComplete="off" /></Field>
      <Field id="title" label="Job or project" error={e.title}><input {...aria("title", e.title)} className="input" defaultValue={v("title")} required maxLength={160} placeholder="e.g. Shopfront sign" /></Field>
      <Field id="customer_phone" label="Customer WhatsApp / phone" optional hint="Include country code for WhatsApp, e.g. +251…" error={e.customer_phone}><input {...aria("customer_phone", e.customer_phone, true)} className="input" type="tel" defaultValue={v("customer_phone")} maxLength={40} autoComplete="off" /></Field>
      <Field id="customer_email" label="Customer email" optional error={e.customer_email}><input {...aria("customer_email", e.customer_email)} className="input" type="email" defaultValue={v("customer_email")} maxLength={200} autoComplete="off" /></Field>
      <Field id="amount" label="Quote amount" error={e.amount}><input {...aria("amount", e.amount)} className="input" inputMode="decimal" defaultValue={quote ? String(quote.amount) : ""} required /></Field>
      <Field id="currency" label="Currency" hint="3-letter code, e.g. USD, ETB, EUR" error={e.currency}><input {...aria("currency", e.currency, true)} className="input uppercase" defaultValue={quote?.currency ?? currency} maxLength={3} required /></Field>
      <Field id="sent_at" label="Date sent" optional hint="Needed for follow-up suggestions" error={e.sent_at}><input {...aria("sent_at", e.sent_at, true)} className="input" type="date" defaultValue={v("sent_at") || (quote ? "" : new Date().toISOString().slice(0, 10))} /></Field>
      <Field id="expires_at" label="Expiry date" optional error={e.expires_at}><input {...aria("expires_at", e.expires_at)} className="input" type="date" defaultValue={v("expires_at")} /></Field>
      <Field id="status" label="Status" error={e.status}>
        <select {...aria("status", e.status)} className="input" defaultValue={quote?.status ?? "sent"}>{QUOTE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
      </Field>
      <Field id="next_follow_up_at" label="Next follow-up" optional hint={quote ? undefined : "Leave blank and we'll suggest one"} error={e.next_follow_up_at}><input {...aria("next_follow_up_at", e.next_follow_up_at, !quote)} className="input" type="date" defaultValue={v("next_follow_up_at")} /></Field>
      <div className="sm:col-span-2"><Field id="description" label="Details" optional error={e.description}><textarea {...aria("description", e.description)} className="input min-h-20" defaultValue={v("description")} maxLength={2000} /></Field></div>
      <div className="sm:col-span-2"><Field id="notes" label="Private notes" optional hint="Only you can see these. Don't store sensitive personal data." error={e.notes}><textarea {...aria("notes", e.notes, true)} className="input min-h-20" defaultValue={v("notes")} maxLength={4000} /></Field></div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : quote ? "Save changes" : "Save quote"}</button>
        <div aria-live="polite">{state.error ? <Notice kind="error">{state.error}</Notice> : state.message ? <Notice kind="ok">{state.message}</Notice> : Object.keys(e).length ? <Notice kind="error">Please fix the highlighted fields.</Notice> : null}</div>
      </div>
    </form>
  );
}
