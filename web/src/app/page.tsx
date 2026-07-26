import { auth, signIn } from "@/auth"
import { db } from "@/db"
import { foodLogs, profiles, weightLogs } from "@/db/schema"
import { and, eq, gte, lt, sum, desc } from "drizzle-orm"
import Link from "next/link"
import { redirect } from "next/navigation"
import { resolveTarget, dailyMacroTargets } from "@/lib/targets"
import { dayBounds, toDateParam } from "@/lib/dates"
import { buttonClass } from "@/components/button"
import { SegBar } from "@/components/seg-bar"
import { Settings } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Onboarding } from "@/components/onboarding"
import { DitherBg } from "@/components/dither-bg"
import { CalorieChart } from "@/components/calorie-chart"
import { WaterWidget } from "@/components/water-widget"
import { todayWaterTotal } from "@/app/water/actions"
import { OnboardingCookieSync } from "@/components/onboarding-cookie-sync"

async function signInWithGoogle() {
  "use server"
  await signIn("google")
}

const chartRanges = { "7D": 7, "30D": 30 } as const
type ChartRange = keyof typeof chartRanges

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ chart?: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    return <Onboarding createAccount={signInWithGoogle} logIn={signInWithGoogle} />
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  if (!profile) {
    redirect("/profile/edit")
  }

  const { chart: chartParam } = await searchParams
  const chartRange: ChartRange =
    chartParam && chartParam in chartRanges ? (chartParam as ChartRange) : "7D"

  const tz = profile.timezone
  const { startOfDay, startOfNextDay } = dayBounds(new Date(), tz)

  const rangeDays = chartRanges[chartRange]
  const rangeStart = new Date(startOfDay.getTime() - (rangeDays - 1) * 86_400_000)

  // These four queries are independent of each other (only `profile`/`tz`
  // above are a real dependency), but were previously awaited one after
  // another - each is a separate network round-trip to D1's REST API (not
  // a local DB call), so sequential awaits summed their latencies instead
  // of overlapping. Running them concurrently cuts this page's D1 wait
  // time roughly 4x (confirmed the page issues exactly these 4 queries
  // plus the profile lookup already done above).
  const [todayTotalsResult, latestWeight, rangeRows, waterConsumedMl] = await Promise.all([
    db
      .select({
        calories: sum(foodLogs.calories),
        protein: sum(foodLogs.protein),
        carbs: sum(foodLogs.carbs),
        fat: sum(foodLogs.fat),
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
    db
      .select({
        calories: foodLogs.calories,
        datetime: foodLogs.datetime,
      })
      .from(foodLogs)
      .where(
        and(
          eq(foodLogs.userId, session.user.id),
          gte(foodLogs.datetime, rangeStart),
          lt(foodLogs.datetime, startOfNextDay)
        )
      ),
    todayWaterTotal(session.user.id, startOfDay, startOfNextDay),
  ])
  const todayTotals = todayTotalsResult[0]

  const consumed = {
    calories: Number(todayTotals?.calories ?? 0),
    protein: Number(todayTotals?.protein ?? 0),
    carbs: Number(todayTotals?.carbs ?? 0),
    fat: Number(todayTotals?.fat ?? 0),
  }

  const hasLoggedToday = consumed.calories > 0

  const target = resolveTarget(profile, latestWeight?.weightKg)
  const remaining = target - consumed.calories

  const calorieBlocksFilled = Math.round(
    Math.min(1, consumed.calories / target) * 26
  )

  const macroTargets = dailyMacroTargets(target, latestWeight?.weightKg ?? 70)

  const macros = [
    { label: "PROTEIN", value: consumed.protein, limit: macroTargets.proteinG, color: "var(--color-protein)" },
    { label: "CARBS", value: consumed.carbs, limit: macroTargets.carbsG, color: "var(--color-carbs)" },
    { label: "FAT", value: consumed.fat, limit: macroTargets.fatG, color: "var(--color-fat)" },
  ]

  const todayLabel = new Date()
    .toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", timeZone: tz })
    .toUpperCase()
    .replace(",", " ·")

  // Weekly/monthly calorie chart: sum per-day totals across the range,
  // including days with zero logged calories so the chart shows real gaps.
  // Fetches individual log rows (not a SQL sum()) and groups by day in JS -
  // selecting sum(calories) alongside a non-aggregated, non-grouped-by
  // `datetime` column previously returned exactly one collapsed row for the
  // whole range with datetime as null, since there was no GROUP BY at all.
  const caloriesByDate = new Map<string, number>()
  for (const row of rangeRows) {
    const key = toDateParam(row.datetime, tz)
    caloriesByDate.set(key, (caloriesByDate.get(key) ?? 0) + row.calories)
  }
  const chartDays = Array.from({ length: rangeDays }, (_, i) => {
    const date = new Date(rangeStart.getTime() + i * 86_400_000)
    const key = toDateParam(date, tz)
    return { date: key, calories: caloriesByDate.get(key) ?? 0 }
  })

  return (
    <div className="relative mx-auto flex min-h-screen w-full flex-col gap-8 overflow-hidden pt-16 pb-36 sm:max-w-xl">
      <DitherBg height={430} fadeAt={30} />

      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6">
        <div>
          <p className="font-mono text-xs text-text-muted">{todayLabel}</p>
          <p className="mt-0.5 text-xl font-semibold text-text">Today</p>
        </div>
        <Link
          href="/settings"
          className="flex size-9 items-center justify-center rounded-input border border-hairline bg-card text-text-muted"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>
      </div>

      <Link
        href="/macros"
        className="relative z-10 mx-4 block rounded-hero bg-surface p-6 shadow-hero transition-opacity active:opacity-80 sm:mx-6"
      >
        <p className="label-mono font-doto text-[11px] tracking-[0.18em] text-text-muted uppercase">
          Today
        </p>
        <p className="mt-2 font-doto text-5xl font-black text-text">
          {Math.round(consumed.calories)}
          <span className="ml-2 font-sans text-lg font-normal text-text-muted">
            / {target} kcal
          </span>
        </p>
        <p className="mt-1 font-mono text-sm text-text-muted">
          {remaining >= 0
            ? `${Math.round(remaining)} kcal remaining`
            : `${Math.round(-remaining)} kcal over`}
        </p>
        <div className="mt-4">
          <SegBar
            filled={calorieBlocksFilled}
            total={26}
            color="var(--color-accent)"
          />
        </div>
        <p className="mt-3 font-mono text-[10px] text-text-faint">
          Tap for full macro breakdown →
        </p>
      </Link>

      <div className="relative z-10 mx-4 sm:mx-6 rounded-hero bg-surface p-5 shadow-hero">
        <div className="flex items-center justify-between">
          <p className="label-mono font-doto text-[10px] tracking-[0.2em] text-text-muted uppercase">
            Calories vs target
          </p>
          <div className="flex gap-1.5">
            {(Object.keys(chartRanges) as ChartRange[]).map((r) => (
              <Link
                key={r}
                href={`/?chart=${r}`}
                className={`rounded-pill px-2.5 py-1 font-mono text-[10px] transition-colors ${
                  r === chartRange
                    ? "bg-text text-bg"
                    : "bg-card text-text-muted"
                }`}
              >
                {r}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <CalorieChart days={chartDays} target={target} />
        </div>
      </div>

      <div className="relative z-10 mx-4 sm:mx-6 flex flex-col gap-4">
        {macros.map((macro) => (
          <div key={macro.label} className="rounded-card bg-card p-4 shadow-card">
            <div className="flex items-baseline justify-between">
              <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-muted uppercase">
                {macro.label}
              </p>
              <p className="font-mono text-sm text-text">
                {Math.round(macro.value)} / {macro.limit}g
              </p>
            </div>
            <div className="mt-2">
              <SegBar
                filled={Math.round(Math.min(1, macro.value / macro.limit) * 20)}
                total={20}
                color={macro.color}
                height={8}
              />
            </div>
          </div>
        ))}
        <WaterWidget consumedMl={waterConsumedMl} goalMl={profile.waterGoalMl} />
      </div>

      <OnboardingCookieSync />

      {hasLoggedToday ? (
        <div className="relative z-10 mx-4 sm:mx-6 flex gap-2.5">
          <Link href="/scan" className={`flex-1 ${buttonClass("primary")}`}>
            + Scan
          </Link>
          <Link href="/log" className={`flex-1 ${buttonClass("secondary")}`}>
            Search
          </Link>
          <Link href="/log" className={`flex-1 ${buttonClass("secondary")}`}>
            Manual
          </Link>
        </div>
      ) : (
        <div className="relative z-10 mx-4 sm:mx-6">
          <EmptyState
            headline="Nothing logged yet"
            description="Scan a barcode, snap a photo, or search to add your first entry."
            ctaLabel="+ Add first food"
            ctaHref="/log"
          />
        </div>
      )}

      <div className="relative z-10 mx-4 sm:mx-6 flex justify-center gap-4">
        <Link href="/history" className="font-mono text-xs text-text-muted underline">
          View log history
        </Link>
        <Link href="/weekly-summary" className="font-mono text-xs text-text-muted underline">
          Weekly summary
        </Link>
      </div>
    </div>
  )
}
