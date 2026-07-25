import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

// Generates the PWA install icons (192x192, 512x512) referenced from
// manifest.ts, at request time via next/og's ImageResponse. PNG is used
// (not the app's real logo.svg directly) because iOS Safari's "Add to
// Home Screen" doesn't reliably read SVG manifest icons - ImageResponse
// (satori) only supports flexbox/CSS shapes, not arbitrary SVG paths, so
// the reticle-seed mark is approximated here with borders/rotated divs
// rather than rendered from public/logo.svg. Keep this in sync with the
// logo.svg reticle-seed shape (same accent hex, same proportions) if that
// source mark changes.
export async function GET(request: NextRequest) {
  const size = Number(request.nextUrl.searchParams.get("size") ?? "192")
  const accent = "#c6f24d"
  const ringD = size * 0.7 // ring diameter, matches logo.svg's r=70 of a 200 viewBox
  const tickLen = size * 0.07
  // Ticks sit flush against the ring's outer edge and extend outward -
  // matches logo.svg's ticks starting exactly at r=70 (see that file's
  // comment on why a small gap there read as "not lined up").
  const ringEdgeOffset = size / 2 - ringD / 2

  const tick = (side: "top" | "bottom" | "left" | "right") => {
    const horizontal = side === "left" || side === "right"
    const base = {
      position: "absolute" as const,
      background: accent,
      borderRadius: size * 0.015,
    }
    const thickness = size * 0.03
    if (horizontal) {
      return {
        ...base,
        width: tickLen,
        height: thickness,
        top: size / 2 - thickness / 2,
        [side]: ringEdgeOffset - tickLen,
      }
    }
    return {
      ...base,
      height: tickLen,
      width: thickness,
      left: size / 2 - thickness / 2,
      [side]: ringEdgeOffset - tickLen,
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: size * 0.21,
        }}
      >
        <div style={{ position: "relative", width: size, height: size, display: "flex" }}>
          {/* reticle ring */}
          <div
            style={{
              position: "absolute",
              width: ringD,
              height: ringD,
              top: size / 2 - ringD / 2,
              left: size / 2 - ringD / 2,
              borderRadius: "50%",
              border: `${size * 0.03}px solid ${accent}`,
            }}
          />
          <div style={tick("top")} />
          <div style={tick("bottom")} />
          <div style={tick("left")} />
          <div style={tick("right")} />
          {/* seed - two arcs meeting in a point, approximated as a rotated rounded square */}
          <div
            style={{
              position: "absolute",
              width: size * 0.24,
              height: size * 0.24,
              top: size / 2 - size * 0.12,
              left: size / 2 - size * 0.12,
              border: `${size * 0.035}px solid ${accent}`,
              borderRadius: "50% 8% 50% 8%",
              transform: "rotate(45deg)",
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
