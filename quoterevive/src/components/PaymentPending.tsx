"use client";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const COOLDOWN = 10;

/** Shown after returning from Whop checkout: explains the delay and offers a refresh with a 10s cooldown ring. */
export function PaymentPending() {
  const router = useRouter();
  const [left, setLeft] = useState(COOLDOWN);
  const [checks, setChecks] = useState(0);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const ready = left <= 0 && !pending;
  const r = 20, c = 2 * Math.PI * r;
  return (
    <section aria-labelledby="pp-title" className="card relative overflow-hidden p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative h-14 w-14 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
            <circle cx="24" cy="24" r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
            <circle cx="24" cy="24" r={r} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (left / COOLDOWN)} style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <RefreshCw className={`absolute inset-0 m-auto h-5 w-5 text-accent ${pending ? "animate-spin" : ""}`} />
        </div>
        <div className="flex-1">
          <h2 id="pp-title" className="font-semibold">Confirming your payment with Whop…</h2>
          <p className="mt-1 text-sm text-muted">This usually takes under a minute, but can take a few minutes. You don&apos;t need to pay again — Founding Access switches on here automatically.</p>
          {checks > 0 && <p className="mt-1 text-xs text-muted" aria-live="polite">Checked {checks} time{checks === 1 ? "" : "s"}. Still processing — try again shortly.</p>}
        </div>
        <button type="button" className="btn btn-primary min-w-44" disabled={!ready}
          onClick={() => start(() => { router.refresh(); setChecks((n) => n + 1); setLeft(COOLDOWN); })}
          aria-describedby="pp-title">
          {pending ? "Checking…" : ready ? "Check again" : `Check again in ${left}s`}
        </button>
      </div>
      <p className="relative mt-4 text-xs text-muted">Waited more than 10 minutes? Email scalifywpd@gmail.com and we&apos;ll activate you manually.</p>
    </section>
  );
}
