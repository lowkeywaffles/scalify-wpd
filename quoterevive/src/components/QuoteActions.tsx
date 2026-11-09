"use client";
import { useState, useTransition } from "react";
import { deleteQuote, setQuoteFlags } from "@/app/app/actions";

export function QuoteActions({ id, archived, optedOut }: { id: string; archived: boolean; optedOut: boolean }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => start(() => setQuoteFlags(id, { archived: !archived }))}>{archived ? "Unarchive" : "Archive"}</button>
      <button type="button" className="btn btn-ghost" disabled={pending} aria-pressed={optedOut} onClick={() => start(() => setQuoteFlags(id, { opted_out: !optedOut }))}>{optedOut ? "Customer opted out ✓ (undo)" : "Customer asked not to be contacted"}</button>
      {confirm ? (
        <span className="flex items-center gap-2" role="group" aria-label="Confirm delete">
          <span className="text-sm">Delete permanently?</span>
          <button type="button" className="btn btn-danger" disabled={pending} onClick={() => start(() => deleteQuote(id))}>Yes, delete</button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
        </span>
      ) : <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>Delete</button>}
    </div>
  );
}
