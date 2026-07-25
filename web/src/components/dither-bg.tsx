// Dithered pixel-grain texture — see design_handoff_macrograin/README.md
// "Background texture": used sparingly behind heroes/headers, faded with a
// mask. "accent" (the default, and now used on every screen that has this
// texture - dashboard, search, onboarding) follows --color-accent so it
// re-tints with whichever accent/palette the user has picked, rather than
// a plain white/black overlay that ignores the chosen theme. "neutral" is
// kept for any spot that should deliberately NOT pick up the accent color.
export function DitherBg({
  height = 430,
  fadeAt = 30,
  tint = "accent",
}: {
  height?: number
  fadeAt?: number
  tint?: "neutral" | "accent" | "lime"
}) {
  const dotColor =
    tint === "neutral"
      ? "var(--mg-dither-dot)"
      : "color-mix(in srgb, var(--color-accent) 18%, transparent)"

  return (
    <div
      className="pointer-events-none absolute top-0 right-0 left-0"
      style={{
        height,
        backgroundImage: `radial-gradient(${dotColor} 0.8px, transparent 0.9px)`,
        backgroundSize: "4px 4px",
        maskImage: `linear-gradient(180deg, #000 ${fadeAt}%, transparent)`,
        WebkitMaskImage: `linear-gradient(180deg, #000 ${fadeAt}%, transparent)`,
      }}
    />
  )
}
