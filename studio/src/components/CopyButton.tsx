"use client";
import { useState } from "react";
export function CopyButton({ text, label = "Copy caption" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn-ghost min-h-9 px-4"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); } catch { window.prompt("Copy this:", text); } }}>
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}
