"use client";
import { useActionState } from "react";
import { linkWhopMembership, type ActionState } from "@/app/app/actions";
import { aria, Field, Notice } from "./ui";

export function LinkWhopForm() {
  const [s, action, pending] = useActionState<ActionState, FormData>(linkWhopMembership, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3" noValidate>
      <Field id="membership_id" label="Whop membership ID" error={e.membership_id}><input {...aria("membership_id", e.membership_id)} className="input" placeholder="mem_…" autoComplete="off" required /></Field>
      <button className="btn btn-ghost" disabled={pending}>{pending ? "Verifying…" : "Verify and activate"}</button>
      <div aria-live="polite">{s.error ? <Notice kind="error">{s.error}</Notice> : s.message ? <Notice kind="ok">{s.message}</Notice> : null}</div>
    </form>
  );
}
