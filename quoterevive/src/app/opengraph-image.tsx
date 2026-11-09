import { ImageResponse } from "next/og";
export const alt = "QuoteRevive — Your next customer might be in your unanswered quotes.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OG() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "#17181c", color: "#f7f4ee", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80 }}>
      <div style={{ fontSize: 40, display: "flex" }}>Quote<span style={{ color: "#8aa4ff", fontStyle: "italic" }}>Revive</span></div>
      <div style={{ fontSize: 76, lineHeight: 1.05, maxWidth: 950 }}>Your next customer might be in your unanswered quotes.</div>
      <div style={{ fontSize: 30, color: "#a5a7ae" }}>Track quotes · follow up on time · recover opportunities</div>
    </div>,
    size,
  );
}
