import "server-only"
import { db } from "@/db"
import { foodLogs, weightLogs, weeklyTargetUpdates, profiles } from "@/db/schema"
import { and, eq, gte, lt, lte, asc } from "drizzle-orm"
import { lastCompletedWeek, toDateParam } from "@/lib/dates"
import { weeklyTargetSuggestion } from "@/lib/tdee"

// Computes (and caches, one row per user per week) the adaptive TDEE
// checkpoint for the most recently completed week. Idempotent: if a row
// for this weekStart already exists, returns it unchanged rather than
// recomputing - the whole point is a stable weekly snapshot, and this
// also means visiting the summary screen repeatedly doesn't burn extra
// D1 queries recalculating something that can't have changed.
export async function getOrComputeWeeklySummary(userId: string, timezone: string) {
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) })
  if (!profile) return null

  const { weekStart, weekEnd } = lastCompletedWeek(new Date(), timezone)
  const weekStartParam = toDateParam(weekStart, timezone)

  const existing = await db.query.weeklyTargetUpdates.findFirst({
    where: and(eq(weeklyTargetUpdates.userId, userId), eq(weeklyTargetUpdates.weekStart, weekStartParam)),
  })
  if (existing) return existing

  const previousTargetKcal = profile.currentTargetKcal
  // No target has ever been set (brand new account) - nothing to check
  // against yet, the initial estimate is still in effect and there's no
  // "previous" to compare a suggestion to.
  if (!previousTargetKcal) return null

  const dailyRows = await db
    .select({ calories: foodLogs.calories, datetime: foodLogs.datetime })
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, userId),
        gte(foodLogs.datetime, weekStart),
        lt(foodLogs.datetime, weekEnd)
      )
    )

  const caloriesByDate = new Map<string, number>()
  for (const row of dailyRows) {
    const key = toDateParam(row.datetime, timezone)
    caloriesByDate.set(key, (caloriesByDate.get(key) ?? 0) + row.calories)
  }
  const dailyIntakesKcal = Array.from(caloriesByDate.values())

  const weekStartStr = toDateParam(weekStart, timezone)
  const weekEndStr = toDateParam(new Date(weekEnd.getTime() - 1), timezone)
  const weightRows = await db.query.weightLogs.findMany({
    where: and(
      eq(weightLogs.userId, userId),
      // weightLogs.date is a plain calendar string, so an inclusive
      // lower/upper bound compare works directly - no lt() needed against
      // an exclusive UTC instant boundary here like the datetime columns.
      gte(weightLogs.date, weekStartStr),
      lte(weightLogs.date, weekEndStr)
    ),
    orderBy: asc(weightLogs.date),
  })
  const weightEntries = weightRows.map((w) => w.weightKg)

  const suggestion = weeklyTargetSuggestion({
    previousTargetKcal,
    dailyIntakesKcal,
    weightEntries,
    userGoal: profile.goal ?? "maintain",
  })
  if (!suggestion) return null

  const [inserted] = await db
    .insert(weeklyTargetUpdates)
    .values({
      userId,
      weekStart: weekStartParam,
      previousTargetKcal,
      suggestedTargetKcal: suggestion.suggestedTargetKcal,
      estimatedTdeeKcal: suggestion.estimatedTdeeKcal,
      avgIntakeKcal: suggestion.avgIntakeKcal,
      weightDeltaKg: suggestion.weightDeltaKg,
      daysLogged: suggestion.daysLogged,
      confidence: suggestion.confidence,
    })
    .returning()

  return inserted
}
