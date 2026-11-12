"use client";
/** Shows a timestamp in the viewer's own time zone. */
export function LocalTime({ iso, fallback = "Not scheduled" }: { iso: string | null; fallback?: string }) {
  if (!iso) return <span>{fallback}</span>;
  const d = new Date(iso);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}
