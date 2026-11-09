import { QuoteStatus, STATUS_LABEL } from "@/lib/types";

const STATUS_STYLE: Record<QuoteStatus, string> = {
  draft: "bg-surface-2 text-muted",
  sent: "bg-surface-2 text-ink",
  awaiting_response: "bg-accent-soft text-accent",
  follow_up_due: "bg-accent text-accent-ink",
  negotiating: "bg-surface-2 text-warn",
  accepted: "bg-surface-2 text-good",
  rejected: "bg-surface-2 text-bad",
  expired: "bg-surface-2 text-muted",
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Field({ id, label, error, hint, optional, children }: { id: string; label: string; error?: string[]; hint?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {hint && <p id={`${id}-hint`} className="hint mt-1">{hint}</p>}
      {error?.length ? <p id={`${id}-err`} className="err" role="alert">{error[0]}</p> : null}
    </div>
  );
}

/** aria props for an input inside <Field>. */
export function aria(id: string, error?: string[], hint?: boolean) {
  const ids = [hint ? `${id}-hint` : "", error?.length ? `${id}-err` : ""].filter(Boolean).join(" ");
  return { id, name: id, "aria-invalid": error?.length ? true : undefined, "aria-describedby": ids || undefined } as const;
}

export function Notice({ kind = "info", children }: { kind?: "info" | "ok" | "error"; children: React.ReactNode }) {
  const c = kind === "error" ? "border-bad text-bad" : kind === "ok" ? "border-good text-good" : "border-line text-muted";
  return <p role={kind === "error" ? "alert" : "status"} className={`rounded-xl border bg-surface px-3 py-2 text-sm ${c}`}>{children}</p>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <svg width="72" height="56" viewBox="0 0 72 56" aria-hidden="true"><rect x="4" y="6" width="44" height="30" rx="10" fill="var(--surface-2)" stroke="var(--line)" /><rect x="24" y="20" width="44" height="30" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" /><path d="M38 35l4 4 8-9" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="max-w-md text-muted">{body}</p>
      {action}
    </div>
  );
}
