"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestReset, signIn, signUp, updatePassword, type AuthState } from "@/app/(auth)/actions";
import { aria, Field, Notice } from "./ui";

function Msg({ s }: { s: AuthState }) {
  return <div aria-live="polite">{s.error ? <Notice kind="error">{s.error}</Notice> : s.message ? <Notice kind="ok">{s.message}</Notice> : null}</div>;
}

export function LoginForm({ next }: { next?: string }) {
  const [s, a, p] = useActionState<AuthState, FormData>(signIn, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={a} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="email" label="Email" error={e.email}><input {...aria("email", e.email)} className="input" type="email" autoComplete="email" required /></Field>
      <Field id="password" label="Password" error={e.password}><input {...aria("password", e.password)} className="input" type="password" autoComplete="current-password" required /></Field>
      <button className="btn btn-primary w-full" disabled={p}>{p ? "Signing in…" : "Sign in"}</button>
      <Msg s={s} />
      <p className="flex justify-between text-sm"><Link className="link" href="/forgot-password">Forgot password?</Link><Link className="link" href="/signup">Create an account</Link></p>
    </form>
  );
}

export function SignupForm() {
  const [s, a, p] = useActionState<AuthState, FormData>(signUp, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={a} className="space-y-4" noValidate>
      <Field id="email" label="Email" hint="Used for sign-in and account messages only." error={e.email}><input {...aria("email", e.email, true)} className="input" type="email" autoComplete="email" required /></Field>
      <Field id="password" label="Password" hint="At least 10 characters." error={e.password}><input {...aria("password", e.password, true)} className="input" type="password" autoComplete="new-password" minLength={10} required /></Field>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" value="yes" className="mt-1 h-4 w-4" aria-invalid={e.terms ? true : undefined} aria-describedby={e.terms ? "terms-err" : undefined} />
          <span>I agree to the <Link className="link" href="/legal/terms" target="_blank">Terms</Link> and have read the <Link className="link" href="/legal/privacy" target="_blank">Privacy Policy</Link>.</span>
        </label>
        {e.terms && <p id="terms-err" className="err" role="alert">{e.terms[0]}</p>}
      </div>
      <p className="hint">We don&apos;t send marketing emails. There&apos;s no newsletter to opt out of.</p>
      <button className="btn btn-primary w-full" disabled={p}>{p ? "Creating…" : "Create free account"}</button>
      <Msg s={s} />
      <p className="text-sm">Already have an account? <Link className="link" href="/login">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [s, a, p] = useActionState<AuthState, FormData>(requestReset, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={a} className="space-y-4" noValidate>
      <Field id="email" label="Email" error={e.email}><input {...aria("email", e.email)} className="input" type="email" autoComplete="email" required /></Field>
      <button className="btn btn-primary w-full" disabled={p}>Send reset link</button>
      <Msg s={s} />
    </form>
  );
}

export function ResetForm() {
  const [s, a, p] = useActionState<AuthState, FormData>(updatePassword, {});
  const e = s.fieldErrors ?? {};
  return (
    <form action={a} className="space-y-4" noValidate>
      <Field id="password" label="New password" hint="At least 10 characters." error={e.password}><input {...aria("password", e.password, true)} className="input" type="password" autoComplete="new-password" minLength={10} required /></Field>
      <button className="btn btn-primary w-full" disabled={p}>Save new password</button>
      <Msg s={s} />
    </form>
  );
}
