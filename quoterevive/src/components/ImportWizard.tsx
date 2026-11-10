"use client";
import { useMemo, useState, useTransition } from "react";
import { importQuotes } from "@/app/app/actions";
import { guessMapping, IMPORT_FIELDS, ImportField, parseCsv, SAMPLE_CSV, validateImport } from "@/lib/csv";
import { Notice } from "./ui";

const LABEL: Record<ImportField, string> = { customer_name: "Customer name *", customer_email: "Customer email", customer_phone: "Customer phone", title: "Job / project *", description: "Details", amount: "Amount *", currency: "Currency", sent_at: "Date sent", expires_at: "Expiry date", status: "Status", notes: "Notes" };

export function ImportWizard({ currency }: { currency: string }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<ImportField, number>>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const results = useMemo(() => (rows ? validateImport(rows, mapping, currency) : []), [rows, mapping, currency]);
  const good = results.filter((r) => r.ok);
  const bad = results.filter((r) => !r.ok);

  async function onFile(f: File | undefined) {
    setMsg(null);
    if (!f) return;
    if (f.size > 2_000_000) return setMsg({ kind: "error", text: "File is larger than 2 MB." });
    const parsed = parseCsv(await f.text());
    if (parsed.length < 2) return setMsg({ kind: "error", text: "The file needs a header row and at least one data row." });
    if (parsed.length > 1001) return setMsg({ kind: "error", text: "Import up to 1,000 rows at a time." });
    setRows(parsed);
    setMapping(guessMapping(parsed[0]));
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-4 sm:p-6" data-tour="csv">
        <label htmlFor="csv" className="label">1. Choose a CSV file</label>
        <input id="csv" type="file" accept=".csv,text/csv" className="input py-2" onChange={(e) => onFile(e.target.files?.[0])} aria-describedby="csv-hint" />
        <p id="csv-hint" className="hint">Max 1,000 rows, 2 MB. Dates as YYYY-MM-DD. The file is read in your browser; only valid rows are sent when you confirm.</p>
        <a className="link text-sm" href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`} download="quoterevive-sample.csv">Download sample CSV</a>
      </div>

      {rows && (
        <div className="card space-y-4 p-4 sm:p-6">
          <h2 className="font-semibold">2. Match your columns</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {IMPORT_FIELDS.map((f) => (
              <div key={f}>
                <label htmlFor={`map-${f}`} className="label">{LABEL[f]}</label>
                <select id={`map-${f}`} className="input" value={mapping[f] ?? ""} onChange={(e) => setMapping({ ...mapping, [f]: e.target.value === "" ? undefined : Number(e.target.value) })}>
                  <option value="">— not in file —</option>
                  {rows[0].map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </div>
            ))}
          </div>
          <p className="hint">Missing currency defaults to {currency}. Missing status defaults to &quot;Sent&quot;.</p>

          <h2 className="font-semibold">3. Preview</h2>
          <p role="status">{good.length} row{good.length === 1 ? "" : "s"} ready · {bad.length} with errors</p>
          {bad.length > 0 && (
            <div className="max-h-56 overflow-auto rounded-xl border border-bad p-3 text-sm">
              <ul>{bad.slice(0, 100).map((r) => !r.ok && <li key={r.line}><strong>Row {r.line}:</strong> {r.errors.join("; ")}</li>)}</ul>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm"><caption className="sr-only">First valid rows</caption>
              <thead className="text-left text-muted"><tr><th scope="col" className="p-2">Customer</th><th scope="col" className="p-2">Project</th><th scope="col" className="p-2">Amount</th><th scope="col" className="p-2">Sent</th></tr></thead>
              <tbody>{good.slice(0, 5).map((r) => r.ok && <tr key={r.line} className="border-t border-line"><td className="p-2">{r.data.customer_name}</td><td className="p-2">{r.data.title}</td><td className="p-2">{r.data.currency} {r.data.amount}</td><td className="p-2">{r.data.sent_at ?? "—"}</td></tr>)}</tbody>
            </table>
          </div>
          <button className="btn btn-primary" disabled={pending || good.length === 0} onClick={() => start(async () => {
            const res = await importQuotes(good.map((r) => (r.ok ? r.data : null)));
            if (res.ok) { setMsg({ kind: "ok", text: `Imported ${res.inserted} new quotes. Existing quotes were not changed.` }); setRows(null); }
            else setMsg({ kind: "error", text: res.error ?? "Import failed." });
          })}>{pending ? "Importing…" : `Import ${good.length} valid row${good.length === 1 ? "" : "s"}`}</button>
          <p className="hint">Rows with errors are skipped. Importing always adds new quotes; it never overwrites existing ones, so importing the same file twice creates duplicates.</p>
        </div>
      )}
      <div aria-live="polite">{msg && <Notice kind={msg.kind}>{msg.text}</Notice>}</div>
    </div>
  );
}
