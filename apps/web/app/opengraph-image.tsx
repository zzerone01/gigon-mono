import { ImageResponse } from "next/og";

export const alt = "GigOn — Your gig is on.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// White tile + royal power glyph, encoded as a data URI for Satori.
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="24" fill="#ffffff"/>
  <g transform="translate(15 15)" stroke="#103F96" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="M48 19.8 A21 21 0 1 1 18 19.8"/>
    <line x1="33" y1="33" x2="33" y2="12.6"/>
  </g>
</svg>`;
const mark = `data:image/svg+xml,${encodeURIComponent(markSvg)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(1100px 600px at 78% -8%, #1c54bd 0%, #103F96 46%, #0B2E6F 100%)",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <img src={mark} width={84} height={84} alt="" />
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
            <span>Gig</span>
            <span style={{ color: "#F5A623" }}>On</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
            }}
          >
            Your gig is&nbsp;<span style={{ color: "#F5A623" }}>on.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              color: "#CBD9F2",
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            Short, local gigs — matched with trusted people nearby.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#AEC2EA",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#34D27B",
                display: "flex",
              }}
            />
            Private beta · Cebu–Mactan
          </div>
          <div style={{ display: "flex" }}>gigon.io</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
