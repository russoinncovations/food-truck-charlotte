import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "#faf6f0",
          padding: "56px",
          color: "#1e1e1e",
          fontFamily: "system-ui, sans-serif",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
          <span style={{ color: "#d97a2b", marginRight: 8 }}>Food Truck</span>
          <span>Charlotte</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.4 }}>
            Find Food Trucks. Discover Events. Book a Truck.
          </div>
          <div style={{ fontSize: 27, color: "#4c443d" }}>
            Charlotte&apos;s community-rooted local guide for food trucks and bookings.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#6f655c" }}>
          Local events • trusted recommendations • booking inquiries
        </div>
      </div>
    ),
    { ...size },
  );
}
