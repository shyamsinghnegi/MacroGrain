// Weight trend chart — see design_handoff_macrograin/README.md
// "Weight trend chart": raw dots (#8A8A8A, r=3, latest = accent r=4),
// smoothed trend = accent polyline (only drawn once there's enough data
// for a moving average to mean something — not with 1-2 points).

const WIDTH = 330
const HEIGHT = 150
const PADDING = 24
const TREND_MIN_ENTRIES = 3
const TREND_WINDOW = 7

type Entry = { date: string; weightKg: number }

function movingAverage(values: number[], window: number) {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1)
    return slice.reduce((sum, v) => sum + v, 0) / slice.length
  })
}

export function WeightChart({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center rounded-card border border-dashed border-hairline">
        <p className="text-sm text-text-muted">No weight entries yet</p>
      </div>
    )
  }

  const weights = entries.map((e) => e.weightKg)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 1

  const xFor = (i: number) =>
    entries.length === 1
      ? WIDTH / 2
      : PADDING + (i / (entries.length - 1)) * (WIDTH - PADDING * 2)
  const yFor = (weight: number) =>
    HEIGHT - PADDING - ((weight - minWeight) / range) * (HEIGHT - PADDING * 2)

  const showTrend = entries.length >= TREND_MIN_ENTRIES
  const trend = showTrend ? movingAverage(weights, TREND_WINDOW) : []
  const trendPoints = trend
    .map((weight, i) => `${xFor(i)},${yFor(weight)}`)
    .join(" ")

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 font-mono text-[10px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-text-muted" /> RAW
        </span>
        {showTrend && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 rounded-full bg-accent" /> TREND
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Weight trend chart"
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={HEIGHT * f}
            y2={HEIGHT * f}
            stroke="rgba(255,255,255,.06)"
          />
        ))}

        {showTrend && (
          <polyline
            points={trendPoints}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {entries.map((entry, i) => {
          const isLatest = i === entries.length - 1
          return (
            <circle
              key={entry.date}
              cx={xFor(i)}
              cy={yFor(entry.weightKg)}
              r={isLatest ? 4 : 3}
              fill={isLatest ? "var(--color-accent)" : "#8A8A8A"}
            />
          )
        })}
      </svg>

      <div className="flex justify-between font-mono text-[10px] text-text-muted">
        <span>
          {new Date(entries[0].date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })}
        </span>
        <span>
          {new Date(entries[entries.length - 1].date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })}
        </span>
      </div>
    </div>
  )
}
