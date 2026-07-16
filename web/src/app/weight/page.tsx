import { auth } from "@/auth"
import { db } from "@/db"
import { weightLogs } from "@/db/schema"
import { asc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { WeightChart } from "@/components/weight-chart"
import { LogWeightForm } from "./log-weight-form"

const ranges = { "1M": 30, "3M": 90, "6M": 180, ALL: Infinity } as const
type Range = keyof typeof ranges

export default async function WeightPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const { range: rangeParam } = await searchParams
  const range: Range = rangeParam && rangeParam in ranges ? (rangeParam as Range) : "1M"

  const allEntries = await db.query.weightLogs.findMany({
    where: eq(weightLogs.userId, session.user.id),
    orderBy: asc(weightLogs.date),
  })

  const cutoffDays = ranges[range]
  const entries =
    cutoffDays === Infinity
      ? allEntries
      : allEntries.filter((e) => {
          const daysAgo = (Date.now() - new Date(e.date).getTime()) / 86_400_000
          return daysAgo <= cutoffDays
        })

  const latest = allEntries.at(-1)
  const thirtyDaysAgoEntry = allEntries.findLast(
    (e) => Date.now() - new Date(e.date).getTime() >= 30 * 86_400_000
  )
  const delta =
    latest && thirtyDaysAgoEntry ? latest.weightKg - thirtyDaysAgoEntry.weightKg : null

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 pt-16 pb-28">
      <h1 className="text-2xl font-semibold text-text">Weight</h1>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-doto text-[11px] tracking-[0.18em] text-text-muted uppercase">
            Current
          </p>
          <p className="font-doto text-4xl font-black text-text">
            {latest ? latest.weightKg : "—"}
            <span className="ml-1 font-sans text-base font-normal text-text-muted">kg</span>
          </p>
        </div>
        {delta !== null && (
          <div className="text-right">
            <p
              className={`font-mono text-sm ${delta <= 0 ? "text-accent" : "text-warning"}`}
            >
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)} kg
            </p>
            <p className="font-mono text-xs text-text-muted">30 days</p>
          </div>
        )}
      </div>

      <div className="rounded-hero bg-surface p-4 shadow-hero">
        <WeightChart
          entries={entries.map((e) => ({ date: e.date, weightKg: e.weightKg }))}
        />
      </div>

      <div className="flex gap-2">
        {(Object.keys(ranges) as Range[]).map((r) => (
          <Link
            key={r}
            href={`/weight?range=${r}`}
            className={`flex-1 rounded-pill py-1.5 text-center font-mono text-xs transition-colors ${
              r === range ? "bg-text text-bg" : "bg-card text-text-muted"
            }`}
          >
            {r}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {[...allEntries].reverse().slice(0, 10).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-card border border-hairline bg-card px-4 py-3"
          >
            <p className="font-mono text-sm text-text-muted uppercase">
              {new Date(`${entry.date}T00:00:00.000Z`).toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "UTC",
              })}
            </p>
            <p className="font-mono text-sm text-text">{entry.weightKg} kg</p>
          </div>
        ))}
      </div>

      <LogWeightForm />
    </div>
  )
}
