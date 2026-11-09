/** Original QuoteRevive mark: a speech bubble whose tail curls into a "revive" arrow. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <path d="M9 11.5a4.5 4.5 0 0 1 4.5-4.5h5A4.5 4.5 0 0 1 23 11.5v3a4.5 4.5 0 0 1-4.5 4.5H15l-3.5 3v-3.3A4.5 4.5 0 0 1 9 14.5z" fill="none" stroke="var(--bg)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 13.2l2.2 2.1 4-4.3" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight text-ink">
      <LogoMark />
      <span className="text-[1.1rem]">Quote<span className="font-display italic font-normal text-accent">Revive</span></span>
    </span>
  );
}
