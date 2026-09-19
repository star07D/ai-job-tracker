import { ImageResponse } from "next/og";

export const alt = "Rolio — the job hunt, under control";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "#F2EEE4",
          color: "#1C1B17",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#B4361A" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              fill="#FBF8F1"
              d="M8 7.5h10.1c4 0 6.6 2.7 6.6 6.6 0 3.1-1.7 5.5-4.5 6.5l4.9 4.1h-5.7l-4.2-4H12.7v4H8V7.5Zm4.7 3.7v5.3h4.8c2 0 3.2-1.2 3.2-2.6 0-1.5-1.2-2.7-3.2-2.7h-4.8Z"
            />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 800 }}>Rolio</div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 104,
            lineHeight: 1,
            letterSpacing: -4,
            // the default OG font has no bold weight — a stroke fakes the heavy display feel
            WebkitTextStroke: "3px #1C1B17",
          }}
        >
          <span style={{ marginRight: 28 }}>The job hunt,</span>
          <span
            style={{
              background: "#F5D547",
              padding: "0 18px",
              marginRight: 28,
            }}
          >
            finally
          </span>
          <span>under control.</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#575248",
          }}
        >
          <span>Track every application from applied to offer.</span>
          <span
            style={{
              background: "#B4361A",
              color: "#FBF8F1",
              padding: "12px 26px",
              borderRadius: 14,
              fontWeight: 700,
            }}
          >
            Start free
          </span>
        </div>
      </div>
    ),
    size,
  );
}
