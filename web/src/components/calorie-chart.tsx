// Calorie-vs-target bar chart for the dashboard's weekly/monthly view.
// One bar per day: lime if at/under target, warning-orange if over —
// same semantic as the weight-delta coloring on /weight.

const WIDTH = 330
const HEIGHT = 140
const PADDING_BOTTOM = 20
const PADDING_TOP = 8

type DayTotal = { date: string; calories: number }

export function CalorieChart({
  days,
  target,
}: {
  days: DayTotal[]
  target: number
}) {
  if (days.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-card border border-dashed border-hairline">
        <p className="text-sm text-text-muted">No data for this range</p>
      </div>
    )
  }

  const maxValue = Math.max(target, ...days.map((d) => d.calories)) * 1.1
  const barWidth = (WIDTH / days.length) * 0.6
  const gap = WIDTH / days.length

  const yFor = (calories: number) =>
    HEIGHT -
    PADDING_BOTTOM -
    (calories / maxValue) * (HEIGHT - PADDING_BOTTOM - PADDING_TOP)
  const targetY = yFor(target)

  // Thin the x-axis labels so they don't overlap on longer ranges.
  const labelEvery = days.length > 14 ? 7 : days.length > 7 ? 2 : 1

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Calories vs target chart"
      >
        <line
          x1={0}
          x2={WIDTH}
          y1={targetY}
          y2={targetY}
          stroke="var(--color-text-faint)"
          strokeDasharray="3 3"
        />
        {days.map((day, i) => {
          const over = day.calories > target
          const x = i * gap + (gap - barWidth) / 2
          const y = yFor(day.calories)
          const h = HEIGHT - PADDING_BOTTOM - y
          return (
            <rect
              key={day.date}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(h, day.calories > 0 ? 2 : 0)}
              rx={2}
              fill={over ? "var(--color-warning)" : "var(--color-accent)"}
              opacity={day.calories === 0 ? 0.15 : 1}
            />
          )
        })}
      </svg>

      <div className="flex font-mono text-[9px] text-text-muted">
        {days.map((day, i) => (
          <span key={day.date} className="flex-1 text-center">
            {i % labelEvery === 0
              ? new Date(`${day.date}T00:00:00.000Z`).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })
              : ""}
          </span>
        ))}
      </div>
    </div>
  )
}
