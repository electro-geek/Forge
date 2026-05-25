import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "UIWiz — Build stunning UI with one prompt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080C14",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid dots background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,107,53,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,107,53,0.08)",
            filter: "blur(80px)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,107,53,0.12)",
              border: "1.5px solid rgba(255,107,53,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <path d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z" fill="#FF6B35" />
              <circle cx="16.5" cy="5" r="1.8" fill="#FF6B35" opacity="0.55" />
              <circle cx="18" cy="9.5" r="1.1" fill="#FF6B35" opacity="0.35" />
            </svg>
          </div>
          <span style={{ color: "#E8ECF4", fontSize: 36, fontWeight: 700, letterSpacing: "-1px" }}>
            UIWiz
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#E8ECF4",
            textAlign: "center",
            lineHeight: 1.05,
            marginBottom: 24,
            letterSpacing: "-2px",
          }}
        >
          Build stunning UI
          <br />
          <span style={{ color: "#FF6B35" }}>with one prompt</span>
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 26,
            color: "#8892AA",
            textAlign: "center",
            maxWidth: 780,
            lineHeight: 1.5,
          }}
        >
          Natural language → production-ready Next.js + Tailwind code, instantly.
        </div>

        {/* Badge strip */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 48,
          }}
        >
          {["Powered by Gemini", "Your API Key", "Live Preview"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                border: "1px solid rgba(255,107,53,0.25)",
                background: "rgba(255,107,53,0.08)",
                color: "#FF6B35",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
