import { ImageResponse } from "next/og";

export const alt = "GlideWay — route by how it feels, not just how fast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  const colors = ["#8B5CF6", "#10B981", "#3B82F6", "#F59E0B"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#090D16", color: "#fff" }}>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>Glide<span style={{ color: "#10B981" }}>Way</span></div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, display: "flex", flexWrap: "wrap" }}>Stop taking dark, pothole-filled shortcuts to save 60 seconds.</div>
          <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
            {["Fastest", "Signal-Free", "Better Roads", "Night-Safe"].map((l, i) => (
              <div key={l} style={{ display: "flex", padding: "12px 24px", borderRadius: 999, border: `3px solid ${colors[i]}`, color: colors[i], fontSize: 28, fontWeight: 600 }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
