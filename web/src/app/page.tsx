import { auth, signIn } from "@/auth"
import { db } from "@/db"
import { foodLogs, profiles } from "@/db/schema"
import { and, eq, gte, lt, sum } from "drizzle-orm"
import Link from "next/link"
import { STATIC_TARGETS } from "@/lib/targets"
import { dayBounds } from "@/lib/dates"
import { Button, buttonClass } from "@/components/button"
import { SegBar } from "@/components/seg-bar"
import { Settings } from "lucide-react"

export default async function Home() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
        <form
          action={async () => {
            "use server"
            await signIn("google")
          }}
        >
          <Button type="submit">Sign in with Google</Button>
        </form>
      </div>
    )
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-text-muted">Set up your profile to see your dashboard.</p>
        <Link href="/profile/edit" className={buttonClass("primary")}>
          Set up profile
        </Link>
      </div>
    )
  }

  const { startOfDay, startOfNextDay } = dayBounds(new Date())

  const [todayTotals] = await db
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
    )

  const consumed = {
    calories: Number(todayTotals?.calories ?? 0),
    protein: Number(todayTotals?.protein ?? 0),
    carbs: Number(todayTotals?.carbs ?? 0),
    fat: Number(todayTotals?.fat ?? 0),
  }

  const target = profile.goal ? STATIC_TARGETS[profile.goal] : STATIC_TARGETS.maintain
  const remaining = target - consumed.calories

  const calorieBlocksFilled = Math.round(
    Math.min(1, consumed.calories / target) * 26
  )

  const macros = [
    { label: "PROTEIN", value: consumed.protein, color: "var(--color-protein)" },
    { label: "CARBS", value: consumed.carbs, color: "var(--color-carbs)" },
    { label: "FAT", value: consumed.fat, color: "var(--color-fat)" },
  ]

  const todayLabel = new Date()
    .toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase()
    .replace(",", " ·")

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 pt-16 pb-28">
      <div className="flex items-center justify-between">
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

      <div className="rounded-hero bg-surface p-6 shadow-hero">
        <p className="font-doto text-[11px] tracking-[0.18em] text-text-muted uppercase">
          Today
        </p>
        <p className="mt-2 font-doto text-5xl font-black">
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
      </div>

      <div className="flex flex-col gap-4">
        {macros.map((macro) => (
          <div key={macro.label} className="rounded-card bg-card p-4 shadow-card">
            <div className="flex items-baseline justify-between">
              <p className="font-doto text-[10px] tracking-[0.18em] text-text-muted uppercase">
                {macro.label}
              </p>
              <p className="font-mono text-sm text-text">
                {Math.round(macro.value)}g
              </p>
            </div>
            <div className="mt-2">
              <SegBar
                filled={Math.round(Math.min(1, macro.value / 100) * 20)}
                total={20}
                color={macro.color}
                height={8}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5">
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

      <Link
        href="/history"
        className="text-center font-mono text-xs text-text-muted underline"
      >
        View log history
      </Link>
    </div>
  )
}
