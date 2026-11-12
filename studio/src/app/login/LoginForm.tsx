"use client";
import { useActionState } from "react";
import { requestCode, verifyCode, type LoginState } from "./actions";

export function LoginForm() {
  const [reqState, reqAction, reqPending] = useActionState(requestCode, { step: "email" } as LoginState);
  const [verState, verAction, verPending] = useActionState(verifyCode, { step: "code" } as LoginState);
  const onCode = reqState.step === "code" && verState.step !== "email";
  const email = verState.email ?? reqState.email ?? "";

  if (!onCode) {
    const error = verState.step === "email" ? verState.error : reqState.error;
    return (
      <form action={reqAction} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">Team email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" aria-describedby={error ? "email-error" : undefined} aria-invalid={Boolean(error)} />
        </div>
        {error && <p id="email-error" role="alert" className="text-sm font-semibold text-bad">{error}</p>}
        <button className="btn-primary w-full" disabled={reqPending}>{reqPending ? "Sending…" : "Email me a code"}</button>
      </form>
    );
  }
  return (
    <form action={verAction} className="space-y-4" noValidate>
      <p className="text-sm text-muted" role="status">{reqState.message}</p>
      <input type="hidden" name="email" value={email} />
      <div>
        <label htmlFor="code" className="label">Sign-in code</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={12} required className="input tracking-[0.3em]" aria-describedby={verState.error ? "code-error" : undefined} aria-invalid={Boolean(verState.error)} />
      </div>
      {verState.error && <p id="code-error" role="alert" className="text-sm font-semibold text-bad">{verState.error}</p>}
      <button className="btn-primary w-full" disabled={verPending}>{verPending ? "Checking…" : "Sign in"}</button>
      <p className="text-sm text-muted">Sent to {email}. <a href="/login" className="underline">Use a different email</a></p>
    </form>
  );
}
