// "Day" boundaries measured in UTC for now — real per-user timezone handling
// is a Phase 7 item (schematic.md flags this explicitly as a known gap).

export function dayBounds(date: Date) {
  const startOfDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const startOfNextDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  return { startOfDay, startOfNextDay }
}

export function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}

export function parseDateParam(value: string | undefined): Date {
  if (!value) return new Date()
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

// Time-of-day heuristic for grouping food log entries into meals — no
// per-meal data is stored, this is purely a display grouping.
// See design_handoff_macrograin "Food log history": Breakfast/Lunch/Snacks.
export const MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const

export function mealForTime(date: Date): (typeof MEALS)[number] {
  const hour = date.getUTCHours()
  if (hour < 11) return "Breakfast"
  if (hour < 16) return "Lunch"
  if (hour < 19) return "Snacks"
  return "Dinner"
}
