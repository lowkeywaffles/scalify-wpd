"use client";
import { PartyPopper } from "lucide-react";
import { useEffect } from "react";

/** Short, dismissable celebration when a quote is accepted. Confetti is skipped for reduced-motion users. */
export function Celebration({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center pt-24" role="status" aria-live="polite">
      <div className="confetti" aria-hidden="true">
        {pieces.map((i) => <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 60}ms`, background: ["var(--accent)", "var(--good)", "var(--warn)"][i % 3] }} />)}
      </div>
      <div className="card rise flex items-center gap-3 px-5 py-4 shadow-2xl">
        <PartyPopper className="h-6 w-6 text-warn" aria-hidden="true" />
        <p className="font-semibold">Quote won! Nice follow-through.</p>
      </div>
    </div>
  );
}
