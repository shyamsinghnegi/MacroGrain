// Timezone-aware date/hour helpers. Every function here takes an explicit
// IANA timezone (e.g. "Asia/Kolkata") rather than assuming UTC - the
// previous UTC-only version caused logged entries to land in the wrong
// timeline hour for any user not in UTC+0 (typing "12-1pm" landed the
// entry hours away from where it displayed). No date library needed:
// Intl.DateTimeFormat already resolves any IANA zone's offset/DST rules.

export const DEFAULT_TIMEZONE = "UTC"

type WallClock = { year: number; month: number; day: number; hour: number; minute: number }

// Breaks a UTC instant down into its wall-clock date/time as seen in `tz`.
function toWallClock(date: Date, tz: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  // Intl reports midnight as hour "24" in some environments - normalize to 0.
  const hour = get("hour") % 24

  return { year: get("year"), month: get("month"), day: get("day"), hour, minute: get("minute") }
}

// Builds the UTC instant for a given wall-clock date+hour:minute as seen in
// `tz`. Works by guessing UTC = wall-clock, checking how far off that guess
// reads back in `tz`, and correcting - two iterations always converges since
// no real timezone offset changes by more than itself in a day.
function fromWallClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tz: string
): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute))
  for (let i = 0; i < 2; i++) {
    const seen = toWallClock(guess, tz)
    const seenUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute)
    const wantUtc = Date.UTC(year, month - 1, day, hour, minute)
    const diff = wantUtc - seenUtc
    if (diff === 0) break
    guess = new Date(guess.getTime() + diff)
  }
  return guess
}

export function dayBounds(date: Date, tz: string = DEFAULT_TIMEZONE) {
  const wc = toWallClock(date, tz)
  const startOfDay = fromWallClock(wc.year, wc.month, wc.day, 0, 0, tz)
  const startOfNextDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  return { startOfDay, startOfNextDay }
}

export function toDateParam(date: Date, tz: string = DEFAULT_TIMEZONE) {
  const wc = toWallClock(date, tz)
  return `${wc.year}-${String(wc.month).padStart(2, "0")}-${String(wc.day).padStart(2, "0")}`
}

export function parseDateParam(value: string | undefined, tz: string = DEFAULT_TIMEZONE): Date {
  if (!value) return new Date()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date()
  const [, y, m, d] = match
  const parsed = fromWallClock(Number(y), Number(m), Number(d), 0, 0, tz)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

// Hour-of-day (0-23) as seen in `tz` - the timeline groups entries by this,
// not by UTC hour, so "logged at 2pm" means 2pm in the user's own timezone.
export function hourInTimezone(date: Date, tz: string = DEFAULT_TIMEZONE) {
  return toWallClock(date, tz).hour
}

// Builds the UTC instant for a given calendar date (YYYY-MM-DD) + hour-of-day
// as seen in `tz` - the inverse of hourInTimezone, used when logging or
// moving an entry to a specific timeline slot.
export function dateAndHourToUtc(dateParam: string, hour: number, tz: string = DEFAULT_TIMEZONE) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam)
  if (!match) return new Date()
  const [, y, m, d] = match
  return fromWallClock(Number(y), Number(m), Number(d), hour, 0, tz)
}

// Changes only the hour-of-day (in `tz`) of an existing UTC instant, keeping
// its calendar date (in `tz`) and minute unchanged - used by move/copy on
// the timeline ("just the time, same day").
export function withHourInTimezone(date: Date, hour: number, tz: string = DEFAULT_TIMEZONE) {
  const wc = toWallClock(date, tz)
  return fromWallClock(wc.year, wc.month, wc.day, hour, wc.minute, tz)
}

// The most recently *completed* Monday-Sunday week (in `tz`), as UTC
// instant bounds - used by the adaptive TDEE weekly checkpoint. "Completed"
// means strictly before today's week, so a check on any day always looks
// at a full 7-day window that has already finished, not a partial
// in-progress week.
export function lastCompletedWeek(date: Date, tz: string = DEFAULT_TIMEZONE) {
  const wc = toWallClock(date, tz)
  const todayStart = fromWallClock(wc.year, wc.month, wc.day, 0, 0, tz)
  // Weekday of the wall-clock date itself (not the UTC instant, which can
  // land on a different calendar date near midnight for non-UTC zones) -
  // Date.UTC's own getUTCDay() on the y/m/d triple directly is unambiguous.
  const isoWeekday = new Date(Date.UTC(wc.year, wc.month - 1, wc.day)).getUTCDay() || 7 // Mon=1..Sun=7
  const thisWeekMonday = new Date(todayStart.getTime() - (isoWeekday - 1) * 86_400_000)
  const lastWeekMonday = new Date(thisWeekMonday.getTime() - 7 * 86_400_000)
  return { weekStart: lastWeekMonday, weekEnd: thisWeekMonday }
}

// Time-of-day heuristic for grouping food log entries into meals — no
// per-meal data is stored, this is purely a display grouping.
// See design_handoff_macrograin "Food log history": Breakfast/Lunch/Snacks.
export const MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const

export function mealForTime(date: Date, tz: string = DEFAULT_TIMEZONE): (typeof MEALS)[number] {
  const hour = hourInTimezone(date, tz)
  if (hour < 11) return "Breakfast"
  if (hour < 16) return "Lunch"
  if (hour < 19) return "Snacks"
  return "Dinner"
}
