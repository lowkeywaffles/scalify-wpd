"use client";
import { useActionState } from "react";
import { saveOnboarding, type ActionState } from "@/app/app/actions";
import type { Business } from "@/lib/data";
import { aria, Field, Notice } from "./ui";

const INDUSTRIES = ["Freelance / creative agency", "Printing & signage", "Furniture & interiors", "Repair & maintenance", "Events", "Contracting", "Other"];

export function OnboardingForm({ business }: { business: Business }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveOnboarding, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="card space-y-4 p-4 sm:p-6" noValidate>
      <Field id="business_name" label="1. Business name" error={e.business_name}><input {...aria("business_name", e.business_name)} className="input" defaultValue={business.name} required maxLength={120} autoComplete="organization" /></Field>
      <Field id="industry" label="2. Industry" optional error={e.industry}>
        <select {...aria("industry", e.industry)} className="input" defaultValue={business.industry ?? ""}><option value="">Choose…</option>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select>
      </Field>
      <Field id="currency" label="3. Currency" hint="3-letter code, e.g. USD, ETB, GBP" error={e.currency}><input {...aria("currency", e.currency, true)} className="input uppercase" defaultValue={business.currency} maxLength={3} required /></Field>
      <Field id="typical_quote_value" label="4. Typical quote value" optional hint="Used only to flag above-average quotes in the priority score" error={e.typical_quote_value}><input {...aria("typical_quote_value", e.typical_quote_value, true)} className="input" inputMode="decimal" defaultValue={business.typical_quote_value || ""} /></Field>
      <fieldset>
        <legend className="label">5. How do you usually follow up?</legend>
        <div className="grid grid-cols-2 gap-2">
          {[["whatsapp", "WhatsApp"], ["email", "Email"], ["phone", "Phone"], ["other", "Other"]].map(([v, l]) => (
            <label key={v} className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3"><input type="radio" name="preferred_channel" value={v} defaultChecked={business.preferred_channel === v} /> {l}</label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="create_first" value="yes" className="h-4 w-4" /> 6. Add my first quote next</label>
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Finish setup"}</button>
      {state.error && <Notice kind="error">{state.error}</Notice>}
    </form>
  );
}
