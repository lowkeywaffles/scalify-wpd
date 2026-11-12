const MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "text-muted" },
  scheduled: { label: "Scheduled", cls: "text-accent" },
  publishing: { label: "Publishing", cls: "text-warn" },
  published: { label: "Published", cls: "text-good" },
  failed: { label: "Failed", cls: "text-bad" },
  ready: { label: "Ready to post", cls: "text-warn" },
  posted_manually: { label: "Posted", cls: "text-good" },
  cancelled: { label: "Cancelled", cls: "text-muted" },
};
export function StatusPill({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: "text-muted" };
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}
export const PLATFORM_LABEL = { instagram: "Instagram", tiktok: "TikTok" } as const;
