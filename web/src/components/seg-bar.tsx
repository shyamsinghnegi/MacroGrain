// Segmented pixel progress bar — the signature Macrograin progress element.
// Discrete blocks filled left-to-right, never a smooth gradient fill.
// See design_handoff_macrograin/README.md "Key Components > Segmented pixel progress bar"

export function SegBar({
  filled,
  total,
  color,
  gap = 3,
  height = 10,
}: {
  filled: number
  total: number
  color: string
  gap?: number
  height?: number
}) {
  const clampedTotal = Math.max(1, total)
  const clampedFilled = Math.max(0, Math.min(clampedTotal, filled))

  return (
    <div
      className="flex w-full items-stretch"
      style={{ gap, height }}
    >
      {Array.from({ length: clampedFilled }, (_, i) => (
        <div
          key={`on-${i}`}
          className="flex-1 rounded-[2px]"
          style={{ background: color }}
        />
      ))}
      {Array.from({ length: clampedTotal - clampedFilled }, (_, i) => (
        <div
          key={`off-${i}`}
          className="flex-1 rounded-[2px] bg-white/7 shadow-[inset_0_0_0_1px_rgba(255,255,255,.02)]"
        />
      ))}
    </div>
  )
}
