import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "HSC Data — NSW ATAR Calculator & Scaling Data";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 60%, #27272a 100%)",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "12px 24px",
            border: "1px solid #52525b",
            borderRadius: 8,
            marginBottom: 40,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#a1a1aa",
              fontFamily: "monospace",
            }}
          >
            hscdata.org
          </span>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#fafafa",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            maxWidth: "90%",
          }}
        >
          HSC Data
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#a1a1aa",
            lineHeight: 1.4,
            maxWidth: "80%",
          }}
        >
          NSW ATAR Calculator, Scaling Graphs &amp; Honor Roll.
          <br />
          No myths — just mathematics.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 80,
            display: "flex",
            gap: 24,
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "#52525b",
              fontFamily: "monospace",
            }}
          >
            ATAR Calculator
          </span>
          <span
            style={{
              fontSize: 20,
              color: "#52525b",
              fontFamily: "monospace",
            }}
          >
            Scaling Graphs
          </span>
          <span
            style={{
              fontSize: 20,
              color: "#52525b",
              fontFamily: "monospace",
            }}
          >
            Honor Roll
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
