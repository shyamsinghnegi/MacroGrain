import { auth } from "@/auth"
import { db } from "@/db"
import { foodLogs, foods } from "@/db/schema"
import { redirect } from "next/navigation"
import { and, eq, gte, lt } from "drizzle-orm"
import Link from "next/link"
import { dayBounds, toDateParam, parseDateParam, MEALS, mealForTime } from "@/lib/dates"
import { SourceBadge } from "@/components/source-badge"

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const { date } = await searchParams
  const day = parseDateParam(date)
  const { startOfDay, startOfNextDay } = dayBounds(day)

  const prevDay = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000)
  const nextDay = startOfNextDay

  const entries = await db
    .select({
      id: foodLogs.id,
      datetime: foodLogs.datetime,
      quantityG: foodLogs.quantityG,
      calories: foodLogs.calories,
      protein: foodLogs.protein,
      carbs: foodLogs.carbs,
      fat: foodLogs.fat,
      source: foodLogs.source,
      name: foods.name,
      brand: foods.brand,
    })
    .from(foodLogs)
    .innerJoin(foods, eq(foodLogs.foodId, foods.id))
    .where(
      and(
        eq(foodLogs.userId, session.user.id),
        gte(foodLogs.datetime, startOfDay),
        lt(foodLogs.datetime, startOfNextDay)
      )
    )
    .orderBy(foodLogs.datetime)

  const dayTotal = entries.reduce((sum, e) => sum + e.calories, 0)

  const mealGroups = MEALS.map((meal) => ({
    meal,
    entries: entries.filter((e) => mealForTime(e.datetime) === meal),
  })).filter((group) => group.entries.length > 0)

  const dateLabel = startOfDay.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 pt-16 pb-28">
      <div className="flex items-center justify-between">
        <Link
          href={`/history?date=${toDateParam(prevDay)}`}
          className="font-mono text-lg text-text-muted transition-colors hover:text-text"
        >
          ‹
        </Link>
        <p className="font-mono text-sm tracking-wide text-text uppercase">
          {dateLabel}
        </p>
        <Link
          href={`/history?date=${toDateParam(nextDay)}`}
          className="font-mono text-lg text-text-muted transition-colors hover:text-text"
        >
          ›
        </Link>
      </div>

      <div className="rounded-hero bg-surface p-6 shadow-hero">
        <p className="font-doto text-[11px] tracking-[0.18em] text-text-muted uppercase">
          Total
        </p>
        <p className="mt-2 font-doto text-3xl font-black text-text">
          {Math.round(dayTotal)}
          <span className="ml-1 font-sans text-sm font-normal text-text-muted">
            kcal
          </span>
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-text-muted">No entries logged this day.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {mealGroups.map(({ meal, entries: mealEntries }) => {
            const mealTotal = mealEntries.reduce((sum, e) => sum + e.calories, 0)
            return (
              <div key={meal} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <p className="font-doto text-[10px] tracking-[0.2em] text-text-muted uppercase">
                    {meal}
                  </p>
                  <p className="font-mono text-xs text-text-muted">
                    {Math.round(mealTotal)} kcal
                  </p>
                </div>
                <ul className="flex flex-col gap-2">
                  {mealEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between rounded-card border border-hairline bg-card px-3 py-2.5 shadow-card"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-text">{entry.name}</p>
                          <SourceBadge source={entry.source} />
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-text-muted">
                          {Math.round(entry.quantityG)}g · P {Math.round(entry.protein)}g
                          · C {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g
                        </p>
                      </div>
                      <p className="font-mono text-sm text-text-muted">
                        {Math.round(entry.calories)} kcal
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
