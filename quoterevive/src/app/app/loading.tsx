export default function Loading() {
  return (<div aria-busy="true" aria-live="polite" className="space-y-4"><span className="sr-only">Loading…</span>{[0, 1, 2].map((i) => <div key={i} className="card h-24 animate-pulse bg-surface-2" />)}</div>);
}
