/* eslint-disable @next/next/no-img-element -- signed, short-lived Supabase URLs; next/image would cache them */
export function Thumb({ url, kind, label, className = "h-16 w-16" }: { url?: string; kind: "image" | "video"; label: string | null; className?: string }) {
  if (!url) return <div className={`${className} rounded-lg bg-surface-2`} role="img" aria-label="Preview unavailable" />;
  return kind === "video"
    ? <video src={url} className={`${className} rounded-lg bg-black object-cover`} muted playsInline preload="metadata" aria-label={label ? `Video: ${label}` : "Video"} />
    : <img src={url} alt={label ?? "Uploaded image"} className={`${className} rounded-lg object-cover`} loading="lazy" />;
}
