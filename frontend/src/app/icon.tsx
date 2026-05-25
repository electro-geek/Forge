import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "rgba(255,107,53,0.12)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z"
            fill="#FF6B35"
          />
          <circle cx="16.5" cy="5" r="1.8" fill="#FF6B35" opacity="0.6" />
          <circle cx="18" cy="9.5" r="1.1" fill="#FF6B35" opacity="0.4" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
