import { auth } from "@/auth"
import { db } from "@/db"
import { foodLogs, foods, waterLogs } from "@/db/schema"
import { redirect } from "next/navigation"
import { and, eq, gte, lt } from "drizzle-orm"
import Link from "next/link"
import { dayBounds, toDateParam, parseDateParam } from "@/lib/dates"
import { getTimezone } from "@/lib/timezone"
import { TimelineClient } from "./timeline-client"

export default async function TimelinePage({
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
  const prevDay = new Date(startOfDay.getTime() - 86_400_000)
  const nextDay = startOfNextDay

  // Both queries are independent - run concurrently rather than sequentially
  // (same reasoning as the dashboard's Promise.all: each is a separate D1
  // REST round-trip, not a local call).
  const [entries, waterEntries] = await Promise.all([
    db
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
      .orderBy(foodLogs.datetime),
    db
      .select({
        id: waterLogs.id,
        datetime: waterLogs.datetime,
        amountMl: waterLogs.amountMl,
      })
      .from(waterLogs)
      .where(
        and(
          eq(waterLogs.userId, session.user.id),
          gte(waterLogs.datetime, startOfDay),
          lt(waterLogs.datetime, startOfNextDay)
        )
      )
      .orderBy(waterLogs.datetime),
  ])

  const dateLabel = startOfDay.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: tz,
  })

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col gap-4 pt-16 pb-36 sm:max-w-xl">
      <div className="flex items-center justify-between px-4 sm:px-6">
        <Link
          href={`/timeline?date=${toDateParam(prevDay, tz)}`}
          className="font-mono text-lg text-text-muted transition-colors hover:text-text"
        >
          ‹
        </Link>
        <div className="text-center">
          <p className="font-mono text-sm tracking-wide text-text uppercase">
            {dateLabel}
          </p>
          <p className="font-mono text-[10px] text-text-faint">Hourly timeline</p>
        </div>
        <Link
          href={`/timeline?date=${toDateParam(nextDay, tz)}`}
          className="font-mono text-lg text-text-muted transition-colors hover:text-text"
        >
          ›
        </Link>
      </div>

      <TimelineClient
        entries={entries.map((e) => ({ ...e, datetime: e.datetime.toISOString() }))}
        waterEntries={waterEntries.map((w) => ({ ...w, datetime: w.datetime.toISOString() }))}
        dateParam={toDateParam(day, tz)}
        timezone={tz}
      />
    </div>
  )
}
