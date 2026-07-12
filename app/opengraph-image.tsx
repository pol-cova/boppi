import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Boppi — little moments, one tiny song";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ height: "100%", width: "100%", display: "flex", background: "#f4f3ed", color: "#191919", padding: "58px", position: "relative", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", position: "absolute", top: 58, left: 58, alignItems: "center", fontSize: 33, fontWeight: 700, letterSpacing: -2 }}><span style={{ width: 22, height: 22, borderRadius: 999, marginRight: 8, background: "conic-gradient(#ffb5ad 0 25%,#d8ff77 0 52%,#b5d6ff 0 75%,#ffc071 0)" }} />boppi</div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 44 }}><div style={{ display: "flex", fontSize: 15, letterSpacing: 3, marginBottom: 23, color: "#6a6b64" }}>A PRIVATE SONG FOR YOUR FAVORITE PEOPLE</div><div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 700, letterSpacing: -7, lineHeight: .82 }}>one photo.<span style={{ color: "#ed5c4b", fontFamily: "serif", fontWeight: 400 }}>one feeling.</span>one bop.</div></div>
      <div style={{ display: "flex", position: "absolute", right: 102, top: 129, width: 268, height: 268, borderRadius: 999, background: "#d8ff77", alignItems: "center", justifyContent: "center", fontSize: 88 }}>♫</div>
      <div style={{ display: "flex", position: "absolute", right: 215, bottom: 58, padding: "14px 19px", background: "#191919", color: "#f4f3ed", fontSize: 17, letterSpacing: 1 }}>LITTLE MOMENTS. ONE TINY SONG.</div>
    </div>,
    size,
  );
}
