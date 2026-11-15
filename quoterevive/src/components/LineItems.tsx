"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Row = { d: string; q: string; p: string };
const toRows = (items?: { d: string; q: number; p: number }[]): Row[] => (items ?? []).map((i) => ({ d: i.d, q: String(i.q), p: String(i.p) }));
const num = (s: string) => { const n = Number(String(s).replace(/,/g, "")); return Number.isFinite(n) && n >= 0 ? n : 0; };

/** Optional breakdown of a quote. When used, the quote amount becomes the sum of the lines. */
export function LineItems({ initial, currency }: { initial?: { d: string; q: number; p: number }[]; currency: string }) {
  const [rows, setRows] = useState<Row[]>(toRows(initial));
  const clean = rows.filter((r) => r.d.trim()).map((r) => ({ d: r.d.trim(), q: num(r.q), p: num(r.p) }));
  const total = Math.round(clean.reduce((s, r) => s + r.q * r.p, 0) * 100) / 100;
  useEffect(() => {
    const amount = document.getElementById("amount") as HTMLInputElement | null;
    if (!amount) return;
    amount.readOnly = clean.length > 0;
    if (clean.length) amount.value = String(total);
  }, [clean.length, total]);
  const set = (i: number, k: keyof Row, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-semibold">Line items <span className="font-normal text-muted">(optional)</span></legend>
      <p className="hint">Add a breakdown to show on the customer&apos;s quote page. The quote amount becomes the total of the lines.</p>
      <input type="hidden" name="items" value={JSON.stringify(clean)} />
      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="grid grid-cols-[1fr_4.5rem_6.5rem_auto] items-end gap-2">
              <label className="text-xs text-muted">Item<input className="input mt-1" value={r.d} maxLength={160} onChange={(e) => set(i, "d", e.target.value)} aria-label={`Line ${i + 1} description`} /></label>
              <label className="text-xs text-muted">Qty<input className="input mt-1" inputMode="decimal" value={r.q} onChange={(e) => set(i, "q", e.target.value)} aria-label={`Line ${i + 1} quantity`} /></label>
              <label className="text-xs text-muted">Price<input className="input mt-1" inputMode="decimal" value={r.p} onChange={(e) => set(i, "p", e.target.value)} aria-label={`Line ${i + 1} unit price`} /></label>
              <button type="button" className="btn btn-ghost !min-h-11 !px-3" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label={`Remove line ${i + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-ghost" disabled={rows.length >= 50} onClick={() => setRows((rs) => [...rs, { d: "", q: "1", p: "" }])}><Plus className="h-4 w-4" aria-hidden="true" /> Add line item</button>
        {clean.length > 0 && <p className="text-sm" aria-live="polite">Total: <strong className="tabular-nums">{total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</strong></p>}
      </div>
    </fieldset>
  );
}
