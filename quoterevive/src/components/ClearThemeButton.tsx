"use client";
import { useState } from "react";
export function ClearThemeButton() {
  const [done, setDone] = useState(false);
  return (
    <p>
      <button type="button" className="btn btn-ghost" onClick={() => { document.cookie = "qr_theme=; path=/; max-age=0"; delete document.documentElement.dataset.theme; setDone(true); }}>Clear theme preference cookie</button>
      <span role="status" className="ml-3 text-sm">{done ? "Cleared." : ""}</span>
    </p>
  );
}
