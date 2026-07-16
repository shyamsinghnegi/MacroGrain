// See design_handoff_macrograin/README.md "Key Components > Source badge"

const styles = {
  barcode: "bg-[#1e1e1e] text-text-muted",
  ai_photo: "bg-accent/12 text-accent",
  manual: "border-[1.5px] border-white/20 text-text",
} as const

const labels = {
  barcode: "SCAN",
  ai_photo: "AI PHOTO",
  manual: "MANUAL",
} as const

export function SourceBadge({ source }: { source: keyof typeof styles }) {
  return (
    <span
      className={`rounded-input px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase ${styles[source]}`}
    >
      {labels[source]}
    </span>
  )
}
