const DAY = 86_400_000;

/** Parse YYYY-MM-DD (or ISO) as a UTC calendar date. */
export function toDay(value: string): number {
  const d = value.length === 10 ? new Date(`${value}T00:00:00Z`) : new Date(value);
  return Math.floor(d.getTime() / DAY);
}

export function daysBetween(from: string, to: string): number {
  return toDay(to) - toDay(from);
}

export function addDays(date: string, days: number): string {
  return new Date((toDay(date) + days) * DAY).toISOString().slice(0, 10);
}

export function today(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function formatDate(value: string | null, locale?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(toDay(value) * DAY),
  );
}

export function formatMoney(amount: number, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString(locale)}`;
  }
}
