"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type R = { ok: boolean; error?: string; message?: string };

/** A button that runs a server action and announces the result. */
export function ActionButton({ action, label, pendingLabel, confirm, variant = "ghost" }: {
  action: () => Promise<R>; label: string; pendingLabel?: string; confirm?: string; variant?: "ghost" | "primary" | "danger";
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<R | null>(null);
  const router = useRouter();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" disabled={pending} className={`btn-${variant} min-h-9 px-4`}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => { const r = await action(); setMsg(r); router.refresh(); });
        }}>
        {pending ? pendingLabel ?? "Working…" : label}
      </button>
      <span role="status" className={`text-xs ${msg?.ok ? "text-good" : "text-bad"}`}>{msg ? (msg.ok ? msg.message : msg.error) : ""}</span>
    </span>
  );
}
