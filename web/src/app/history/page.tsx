import { auth } from "@/auth"
import { db } from "@/db"
import { foodLogs, foods } from "@/db/schema"
import { redirect } from "next/navigation"
import { and, eq, gte, lt } from "drizzle-orm"
import Link from "next/link"
import { dayBounds, toDateParam, parseDateParam, MEALS, mealForTime } from "@/lib/dates"
import { getTimezone } from "@/lib/timezone"
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

  const tz = await getTimezone()
  const { date } = await searchParams
  const day = parseDateParam(date, tz)
  const { startOfDay, startOfNextDay } = dayBounds(day, tz)

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
    entries: entries.filter((e) => mealForTime(e.datetime, tz) === meal),
  })).filter((group) => group.entries.length > 0)

  const dateLabel = startOfDay.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: tz,
  })

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="flex items-center justify-between">
        <Link
          href={`/history?date=${toDateParam(prevDay, tz)}`}
          className="font-mono text-lg text-text-muted transition-colors hover:text-text"
        >
          ‹
        </Link>
        <p className="font-mono text-sm tracking-wide text-text uppercase">
          {dateLabel}
        </p>
        <Link
          href={`/history?date=${toDateParam(nextDay, tz)}`}
          className="font-mono text-lg text-text-muted transition-colors hover:text-text"
        >
          ›
        </Link>
      </div>

      <div className="rounded-hero bg-surface p-6 shadow-hero">
        <p className="label-mono font-doto text-[11px] tracking-[0.18em] text-text-muted uppercase">
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
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-2xl border border-dashed border-hairline">
            <span className="font-doto text-2xl font-black text-text-ghost">
              +
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-semibold text-text">
              No entries this day
            </p>
            <p className="max-w-[260px] text-sm text-text-muted">
              Add a food to start this day&apos;s log, or use ‹ › to move
              between days.
            </p>
          </div>
          <Link
            href="/log"
            className="rounded-pill border-[1.5px] border-hairline px-5 py-2 text-sm font-medium text-text"
          >
            + Add food
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {mealGroups.map(({ meal, entries: mealEntries }) => {
            const mealTotal = mealEntries.reduce((sum, e) => sum + e.calories, 0)
            return (
              <div key={meal} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <p className="label-mono font-doto text-[10px] tracking-[0.2em] text-text-muted uppercase">
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
