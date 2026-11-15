"use client";
import { Printer } from "lucide-react";
export function PrintButton() {
  return (
    <button type="button" className="btn btn-ghost print:hidden" onClick={() => window.print()}>
      <Printer className="h-4 w-4" aria-hidden="true" /> Print or save as PDF
    </button>
  );
}
