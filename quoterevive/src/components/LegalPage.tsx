export const LEGAL_UPDATED = "10 November 2026";
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {LEGAL_UPDATED}</p>
      {children}
    </article>
  );
}
