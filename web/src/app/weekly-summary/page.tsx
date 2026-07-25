import { auth } from "@/auth"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getOrComputeWeeklySummary } from "@/lib/weekly-summary"
import { acceptWeeklyTarget } from "./actions"
import { Button } from "@/components/button"

// Real weekly TDEE checkpoint - see design_handoff_macrograin screens 12/13
// ("Weekly summary — TDEE update" / "sparse data"), previously built only
// as static previews under /preview since the algorithm didn't exist yet.

export default async function WeeklySummaryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) redirect("/profile/edit")

  const summary = await getOrComputeWeeklySummary(session.user.id, profile.timezone)

  if (!summary) {
    return (
      <div className="mx-auto flex w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
        <div className="mb-5 flex items-center gap-3.5">
          <Link href="/" className="font-mono text-lg text-text-muted">
            ←
          </Link>
          <h1 className="text-lg font-semibold text-text">Weekly summary</h1>
        </div>
        <p className="text-sm text-text-muted">
          Not enough history yet for a weekly check-in - log your weight and
          food for at least a week and check back.
        </p>
      </div>
    )
  }

  const isHighConfidence = summary.confidence === "high"
  const targetChanged = summary.suggestedTargetKcal !== summary.previousTargetKcal
  const delta = summary.suggestedTargetKcal - summary.previousTargetKcal

  return (
    <div className="mx-auto flex w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="mb-5 flex items-center gap-3.5">
        <Link href="/" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <h1 className="text-lg font-semibold text-text">Weekly summary</h1>
      </div>

      <p className="font-mono text-xs tracking-wide text-text-muted uppercase">
        Week of {summary.weekStart}
      </p>
      <h2 className="mt-1 mb-5 text-2xl font-semibold text-text">
        {isHighConfidence ? (targetChanged ? "Target updated" : "Target held") : "Target held"}
      </h2>

      {isHighConfidence ? (
        <>
          <div className="rounded-hero border border-accent/25 bg-surface p-5.5 shadow-hero">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="mb-1 font-mono text-[10px] text-text-faint">WAS</p>
                <p className="font-doto text-3xl font-black text-text-faint">
                  {summary.previousTargetKcal}
                </p>
              </div>
              <span className="font-mono text-2xl text-accent">→</span>
              <div className="text-center">
                <p className="mb-1 font-mono text-[10px] text-accent">NOW</p>
                <p className="font-doto text-3xl font-black text-accent">
                  {summary.suggestedTargetKcal}
                </p>
              </div>
              <div className="text-center">
                <p className="mb-1 font-mono text-[10px] text-text-faint">KCAL</p>
                <p className="font-mono text-sm text-text">
                  {delta > 0 ? "+" : ""}
                  {delta}
                </p>
              </div>
            </div>
          </div>

          <div className="my-4 flex items-center gap-2.5 rounded-card border border-accent/25 bg-accent/8 px-3.5 py-2.5">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-3.5 rounded-[2px] bg-accent" />
              ))}
            </div>
            <p className="font-mono text-xs text-accent">
              HIGH CONFIDENCE · {summary.daysLogged} / 7 days logged
            </p>
          </div>

          <p className="mb-2.5 label-mono font-doto text-[10px] tracking-[0.18em] text-text-faint uppercase">
            Why it changed
          </p>
          <p className="mb-4.5 text-sm leading-relaxed text-text-muted">
            Your weight {summary.weightDeltaKg <= 0 ? "fell" : "rose"}{" "}
            {Math.abs(summary.weightDeltaKg)} kg while you averaged {summary.avgIntakeKcal}{" "}
            kcal. Measured burn is estimated at {summary.estimatedTdeeKcal} kcal/day, so the
            target is adjusted to keep your goal&apos;s pace.
          </p>

          <div className="flex gap-2.5">
            <div className="flex-1 rounded-input border border-hairline bg-card p-3.5">
              <p className="font-mono text-[10px] text-text-muted">AVG INTAKE</p>
              <p className="mt-1 font-mono text-lg text-text">{summary.avgIntakeKcal}</p>
            </div>
            <div className="flex-1 rounded-input border border-hairline bg-card p-3.5">
              <p className="font-mono text-[10px] text-text-muted">EST TDEE</p>
              <p className="mt-1 font-mono text-lg text-text">{summary.estimatedTdeeKcal}</p>
            </div>
            <div className="flex-1 rounded-input border border-hairline bg-card p-3.5">
              <p className="font-mono text-[10px] text-text-muted">Δ WEIGHT</p>
              <p
                className={`mt-1 font-mono text-lg ${
                  summary.weightDeltaKg <= 0 ? "text-accent" : "text-warning"
                }`}
              >
                {summary.weightDeltaKg > 0 ? "+" : ""}
                {summary.weightDeltaKg}
              </p>
            </div>
          </div>

          {summary.accepted ? (
            <p className="mt-6 text-center font-mono text-xs text-text-faint">
              Accepted
            </p>
          ) : (
            <form action={acceptWeeklyTarget} className="mt-6">
              <input type="hidden" name="updateId" value={summary.id} />
              <Button type="submit" variant="accent">
                {targetChanged ? "Accept new target" : "Got it"}
              </Button>
            </form>
          )}
        </>
      ) : (
        <>
          <div className="rounded-hero border-[1.5px] border-warning/40 bg-surface p-5.5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-3.5 rounded-[2px] bg-warning" />
                <span className="h-2 w-3.5 rounded-[2px] bg-card-alt" />
                <span className="h-2 w-3.5 rounded-[2px] bg-card-alt" />
              </div>
              <p className="font-mono text-xs text-warning">LOW CONFIDENCE · rough estimate</p>
            </div>
            <div className="text-center">
              <p className="mb-1.5 font-mono text-[10px] text-text-faint">TARGET UNCHANGED</p>
              <p className="font-doto text-4xl font-black text-text">
                {summary.previousTargetKcal}
              </p>
            </div>
          </div>

          <div className="my-4.5">
            <div className="mb-2.5 flex justify-between">
              <span className="label-mono font-doto text-[10px] tracking-[0.16em] text-text-faint uppercase">
                Days logged
              </span>
              <span className="font-mono text-xs text-warning">{summary.daysLogged} / 7</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < summary.daysLogged
                      ? "h-[26px] flex-1 rounded-[5px] bg-warning/80"
                      : "h-[26px] flex-1 rounded-[5px] border border-dashed border-hairline bg-card-alt"
                  }
                />
              ))}
            </div>
          </div>

          <p className="mb-4.5 text-sm leading-relaxed text-text-muted">
            Only {summary.daysLogged} day{summary.daysLogged === 1 ? "" : "s"} were logged
            this week — not enough to trust a weight trend or recalculate your burn. Log at
            least 5 days and 3 weight entries next week for an updated target.
          </p>

          {summary.accepted ? (
            <p className="text-center font-mono text-xs text-text-faint">Acknowledged</p>
          ) : (
            <form action={acceptWeeklyTarget}>
              <input type="hidden" name="updateId" value={summary.id} />
              <Button type="submit">Got it</Button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
