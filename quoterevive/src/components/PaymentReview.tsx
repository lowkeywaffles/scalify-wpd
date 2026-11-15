"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePayment, rejectPayment, reviewStoreOrder } from "@/app/app/pay-actions";

export function PaymentReview({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const run = (fn: () => Promise<{ ok?: boolean; error?: string; message?: string }>) =>
    start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: (r.ok ? r.message : r.error) ?? "" }); router.refresh(); });
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary !min-h-9" disabled={pending} onClick={() => run(() => approvePayment(id))}>Money received: unlock</button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-sm"><span className="sr-only">Reason shown to the customer</span>
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, e.g. No payment found with this ID" maxLength={300} /></label>
        <button type="button" className="btn btn-ghost !min-h-9" disabled={pending} onClick={() => run(() => rejectPayment(id, reason))}>Not received</button>
      </div>
      <p role="status" className={`text-sm ${msg?.ok ? "text-good" : "text-bad"}`}>{msg?.text}</p>
    </div>
  );
}

export function StoreOrderReview({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const run = (action: "approve" | "reject" | "refund") =>
    start(async () => { const r = await reviewStoreOrder(id, action, reason); setMsg({ ok: r.ok, text: (r.ok ? r.message : r.error) ?? "" }); router.refresh(); });
  return (
    <div className="space-y-2">
      {status === "pending" ? (
        <>
          <button type="button" className="btn btn-primary !min-h-9" disabled={pending} onClick={() => run("approve")}>Money received: unlock</button>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 text-sm"><span className="sr-only">Reason shown to the buyer</span>
              <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, e.g. No payment found with this ID" maxLength={300} /></label>
            <button type="button" className="btn btn-ghost !min-h-9" disabled={pending} onClick={() => run("reject")}>Not received</button>
          </div>
        </>
      ) : status === "approved" ? (
        <button type="button" className="btn btn-ghost !min-h-9" disabled={pending} onClick={() => run("refund")}>Mark refunded</button>
      ) : null}
      <p role="status" className={`text-sm ${msg?.ok ? "text-good" : "text-bad"}`}>{msg?.text}</p>
    </div>
  );
}
