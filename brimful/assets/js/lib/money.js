// Money helpers. Amounts are stored as whole numbers of the currency's smallest unit (cents, santim)
// so adding and subtracting never produces rounding errors.

export const CURRENCIES = ["ETB", "USD", "EUR", "GBP", "KES", "NGN", "ZAR", "GHS", "UGX", "TZS", "EGP", "AED", "SAR", "INR", "PKR", "PHP", "IDR", "CAD", "AUD", "BRL", "MXN", "TRY", "JPY"];

const digitsCache = new Map();
/** How many decimal places the currency uses (2 for USD/ETB, 0 for JPY/UGX). */
export function minorDigits(currency) {
  if (digitsCache.has(currency)) return digitsCache.get(currency);
  let d = 2;
  try { d = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits; } catch { d = 2; }
  digitsCache.set(currency, d);
  return d;
}

export function isCurrency(code) {
  if (typeof code !== "string" || !/^[A-Z]{3}$/.test(code)) return false;
  try { new Intl.NumberFormat("en", { style: "currency", currency: code }); return true; } catch { return false; }
}

export const MAX_MINOR = 1e13; // far above any realistic personal goal, far below Number.MAX_SAFE_INTEGER

/** Parses what a person typed ("1,250.50", "1250", "12.5") into minor units. Returns null if it isn't a valid amount. */
export function toMinor(input, currency) {
  if (typeof input === "number") input = String(input);
  if (typeof input !== "string") return null;
  const s = input.trim().replace(/[\s,_']/g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const d = minorDigits(currency);
  const [whole, frac = ""] = s.split(".");
  if (frac.length > d && /[1-9]/.test(frac.slice(d))) return null; // more precision than the currency has
  const minor = Number(whole) * 10 ** d + Number((frac + "0".repeat(d)).slice(0, d) || 0);
  if (!Number.isSafeInteger(minor) || minor > MAX_MINOR) return null;
  return minor;
}

export function fromMinor(minor, currency) {
  return minor / 10 ** minorDigits(currency);
}

/** "ETB 1,250.00" style text. `short` drops trailing .00 for big headline numbers. */
export function fmt(minor, currency, { short = false, sign = false } = {}) {
  const d = minorDigits(currency);
  const value = minor / 10 ** d;
  const whole = short && Number.isInteger(value);
  let out;
  try {
    out = new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: whole ? 0 : d, maximumFractionDigits: whole ? 0 : d }).format(Math.abs(value));
  } catch {
    out = `${currency} ${Math.abs(value).toFixed(whole ? 0 : d)}`;
  }
  if (minor < 0) return `−${out}`;
  return sign && minor > 0 ? `+${out}` : out;
}

/** Text for an <input> when editing an existing amount. */
export function toInput(minor, currency) {
  const d = minorDigits(currency);
  const v = minor / 10 ** d;
  return Number.isInteger(v) ? String(v) : v.toFixed(d);
}

/** Three friendly quick-add amounts for a goal, e.g. 50 / 100 / 500. */
export function quickAmounts(targetMinor, currency) {
  const unit = 10 ** minorDigits(currency);
  const target = Math.max(targetMinor / unit, 1);
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const pick = (ratio) => steps.reduce((best, s) => (Math.abs(s - target * ratio) < Math.abs(best - target * ratio) ? s : best), steps[0]);
  const out = [...new Set([pick(0.01), pick(0.05), pick(0.1)])].sort((a, b) => a - b);
  while (out.length < 3) out.push(steps[steps.indexOf(out[out.length - 1]) + 1]);
  return out.map((v) => v * unit);
}
