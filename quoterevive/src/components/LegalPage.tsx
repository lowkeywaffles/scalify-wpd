export const LEGAL_UPDATED = "9 November 2026";
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {LEGAL_UPDATED}</p>
      <p className="mt-4 rounded-xl border border-warn bg-surface p-3 text-sm text-warn" role="note">Draft template — items in [BRACKETS] must be completed and the whole document reviewed by a qualified lawyer before launch.</p>
      {children}
    </article>
  );
}
