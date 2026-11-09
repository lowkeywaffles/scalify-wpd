import { z } from "zod";
import { QUOTE_STATUSES } from "./types";

/** RFC 4180-style CSV parser (quotes, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

/** Escape a cell; also neutralises spreadsheet formula injection. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export const IMPORT_FIELDS = [
  "customer_name", "customer_email", "customer_phone", "title", "description",
  "amount", "currency", "sent_at", "expires_at", "status", "notes",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");
const opt = <T extends z.ZodTypeAny>(s: T) => z.preprocess((v) => (v === "" || v === undefined ? null : v), s.nullable());

export const importRowSchema = z.object({
  customer_name: z.string().trim().min(1, "Customer name is required").max(120),
  customer_email: opt(z.string().trim().email("Invalid email").max(200)),
  customer_phone: opt(z.string().trim().max(40)),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: opt(z.string().max(2000)),
  amount: z.preprocess((v) => (typeof v === "string" ? Number(v.replace(/[, ]/g, "")) : v), z.number({ message: "Amount must be a number" }).finite().min(0).max(1e10)),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
  sent_at: opt(isoDate),
  expires_at: opt(isoDate),
  status: z.preprocess((v) => (v === "" || v === undefined ? "sent" : String(v).trim().toLowerCase().replace(/\s+/g, "_")), z.enum(QUOTE_STATUSES)),
  notes: opt(z.string().max(4000)),
});
export type ImportRow = z.infer<typeof importRowSchema>;

export interface RowResult { line: number; ok: true; data: ImportRow }
export interface RowError { line: number; ok: false; errors: string[] }

/** Validate rows using a mapping from field -> column index. Line numbers are 1-based incl. header. */
export function validateImport(
  rows: string[][],
  mapping: Partial<Record<ImportField, number>>,
  defaultCurrency: string,
): (RowResult | RowError)[] {
  return rows.slice(1).map((r, i) => {
    const raw: Record<string, string> = {};
    for (const f of IMPORT_FIELDS) {
      const idx = mapping[f];
      raw[f] = idx === undefined ? "" : (r[idx] ?? "");
    }
    if (!raw.currency) raw.currency = defaultCurrency;
    const res = importRowSchema.safeParse(raw);
    return res.success
      ? { line: i + 2, ok: true as const, data: res.data }
      : { line: i + 2, ok: false as const, errors: res.error.issues.map((x) => `${String(x.path[0])}: ${x.message}`) };
  });
}

/** Guess mapping from header names. */
export function guessMapping(header: string[]): Partial<Record<ImportField, number>> {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const aliases: Record<ImportField, string[]> = {
    customer_name: ["customername", "customer", "name", "client"],
    customer_email: ["customeremail", "email"],
    customer_phone: ["customerphone", "phone", "whatsapp", "mobile"],
    title: ["title", "project", "job"],
    description: ["description", "details"],
    amount: ["amount", "value", "total", "price"],
    currency: ["currency"],
    sent_at: ["sentat", "datesent", "sent", "date"],
    expires_at: ["expiresat", "expiry", "expires", "expirationdate"],
    status: ["status"],
    notes: ["notes", "note"],
  };
  const out: Partial<Record<ImportField, number>> = {};
  const h = header.map(norm);
  for (const f of IMPORT_FIELDS) {
    const idx = h.findIndex((x) => aliases[f].includes(x));
    if (idx >= 0) out[f] = idx;
  }
  return out;
}

export const SAMPLE_CSV = toCsv(
  [...IMPORT_FIELDS],
  [
    ["Sample Customer", "sample@example.com", "+10000000000", "Shop sign", "Fictional example row", "450", "USD", "2026-01-05", "2026-02-05", "sent", "Delete this row"],
  ],
);
