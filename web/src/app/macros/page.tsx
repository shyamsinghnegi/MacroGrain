import { auth } from "@/auth"
import { db } from "@/db"
import { foodLogs, profiles, weightLogs } from "@/db/schema"
import { and, eq, gte, lt, desc } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { resolveTarget, dailyExtendedLimits } from "@/lib/targets"
import { dayBounds } from "@/lib/dates"
import { SegBar } from "@/components/seg-bar"

// Daily macros detail — everything tracked for today in one place, plotted
// against each nutrient's daily limit. Core four (calories/protein/carbs/
// fat) always show since every logged food has them; the extended four
// (sodium/fiber/sugars/saturated fat) only show a bar once at least one of
// today's entries actually has that data (mostly Open Food Facts-sourced
// foods, not manual entries) - otherwise a 0-vs-limit bar would silently
// claim "you had none" when the truth is "we don't know."

export default async function MacrosPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) redirect("/profile/edit")

  const { startOfDay, startOfNextDay } = dayBounds(new Date(), profile.timezone)

  // Independent queries (both only need the userId already known) - run
  // concurrently rather than as two sequential D1 network round-trips.
  const [entries, latestWeight] = await Promise.all([
    db
      .select({
        calories: foodLogs.calories,
        protein: foodLogs.protein,
        carbs: foodLogs.carbs,
        fat: foodLogs.fat,
        saturatedFat: foodLogs.saturatedFat,
        fiber: foodLogs.fiber,
        sugars: foodLogs.sugars,
        sodium: foodLogs.sodium,
      })
      .from(foodLogs)
      .where(
        and(
          eq(foodLogs.userId, session.user.id),
          gte(foodLogs.datetime, startOfDay),
          lt(foodLogs.datetime, startOfNextDay)
        )
      ),
    db.query.weightLogs.findFirst({
      where: eq(weightLogs.userId, session.user.id),
      orderBy: desc(weightLogs.date),
    }),
  ])

  const sum = (pick: (e: (typeof entries)[number]) => number | null) =>
    entries.reduce((total, e) => total + (pick(e) ?? 0), 0)

  const hasAny = (pick: (e: (typeof entries)[number]) => number | null) =>
    entries.some((e) => pick(e) != null)

  const target = resolveTarget(profile, latestWeight?.weightKg)
  const limits = dailyExtendedLimits(target)

  const consumed = {
    calories: sum((e) => e.calories),
    protein: sum((e) => e.protein),
    carbs: sum((e) => e.carbs),
    fat: sum((e) => e.fat),
    saturatedFat: sum((e) => e.saturatedFat),
    fiber: sum((e) => e.fiber),
    sugars: sum((e) => e.sugars),
    sodium: sum((e) => e.sodium) * 1000, // stored in grams, displayed/limited in mg
  }

  const coreRows = [
    { label: "Calories", value: consumed.calories, limit: target, unit: "kcal", color: "var(--color-accent)" },
    { label: "Protein", value: consumed.protein, limit: null, unit: "g", color: "var(--color-protein)" },
    { label: "Carbohydrate", value: consumed.carbs, limit: null, unit: "g", color: "var(--color-carbs)" },
    { label: "Fat", value: consumed.fat, limit: null, unit: "g", color: "var(--color-fat)" },
  ]

  const extendedRows = [
    {
      label: "Saturated fat",
      value: consumed.saturatedFat,
      limit: limits.saturatedFatG,
      unit: "g",
      show: hasAny((e) => e.saturatedFat),
    },
    {
      label: "Fiber",
      value: consumed.fiber,
      limit: limits.fiberG,
      unit: "g",
      show: hasAny((e) => e.fiber),
    },
    {
      label: "Sugars",
      value: consumed.sugars,
      limit: limits.sugarsG,
      unit: "g",
      show: hasAny((e) => e.sugars),
    },
    {
      label: "Sodium",
      value: consumed.sodium,
      limit: limits.sodiumMg,
      unit: "mg",
      show: hasAny((e) => e.sodium),
    },
  ].filter((row) => row.show)

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="flex items-center gap-3.5">
        <Link href="/" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <h1 className="text-lg font-semibold text-text">Today&apos;s macros</h1>
      </div>

      <div className="flex flex-col gap-3">
        {coreRows.map((row) => {
          const pct = row.limit ? Math.min(1, row.value / row.limit) : null
          return (
            <div key={row.label} className="rounded-card bg-card p-4 shadow-card">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-text">{row.label}</p>
                <p className="font-mono text-sm text-text">
                  {Math.round(row.value)}
                  {row.limit ? ` / ${row.limit}` : ""} {row.unit}
                </p>
              </div>
              {pct !== null && (
                <div className="mt-2">
                  <SegBar
                    filled={Math.round(pct * 20)}
                    total={20}
                    color={row.color}
                    height={8}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {extendedRows.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-faint uppercase">
            Extended nutrition
          </p>
          <div className="flex flex-col gap-3">
            {extendedRows.map((row) => {
              const pct = Math.min(1, row.value / row.limit)
              const over = row.value > row.limit
              return (
                <div key={row.label} className="rounded-card bg-card p-4 shadow-card">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-text">{row.label}</p>
                    <p className={`font-mono text-sm ${over ? "text-warning" : "text-text"}`}>
                      {Math.round(row.value)} / {row.limit} {row.unit}
                    </p>
                  </div>
                  <div className="mt-2">
                    <SegBar
                      filled={Math.round(pct * 20)}
                      total={20}
                      color={over ? "var(--color-warning)" : "var(--color-info)"}
                      height={8}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-1 font-mono text-[10px] text-text-faint">
            Limits based on WHO/FDA daily guidelines, scaled to your calorie target.
          </p>
        </div>
      )}

      {extendedRows.length === 0 && (
        <p className="text-center font-mono text-xs text-text-faint">
          Log a food with full nutrition data (e.g. from a barcode scan) to see sodium,
          fiber, sugar, and saturated fat here.
        </p>
      )}
    </div>
  )
}
