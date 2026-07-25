"use client"

import { useActionState, useRef, useState } from "react"
import Link from "next/link"
import { saveGoal } from "./actions"
import { Button } from "@/components/button"
import { GOAL_COPY } from "@/lib/targets"
import { initialTarget, GOAL_RATE_KG_PER_WEEK, type ProfileForTdee } from "@/lib/tdee"
import type { goal as goalEnumType } from "@/db/schema"

type Goal = (typeof goalEnumType)[number]

const goals: { value: Goal; label: string }[] = [
  { value: "cut", label: "Cut" },
  { value: "maintain", label: "Maintain" },
  { value: "bulk", label: "Bulk" },
]

// Slider range per goal direction - "maintain" has no meaningful rate to
// drag (0 kg/week always). `slow`/`aggressive` name the left/right ends of
// the track directly (rather than min/max), since for a cut the aggressive
// end is the more-negative number - using min/max here previously meant
// "min" (-1, the big/aggressive deficit) got treated as the slow/left end,
// so dragging right toward "aggressive" actually shrank the deficit and
// increased the calorie target instead of decreasing it.
const RATE_RANGE: Record<Goal, { slow: number; aggressive: number }> = {
  cut: { slow: -0.1, aggressive: -1 },
  maintain: { slow: 0, aggressive: 0 },
  bulk: { slow: 0.1, aggressive: 0.5 },
}

function rateToSliderPct(rate: number, goal: Goal) {
  const { slow, aggressive } = RATE_RANGE[goal]
  if (slow === aggressive) return 50
  return ((rate - slow) / (aggressive - slow)) * 100
}

function sliderPctToRate(pct: number, goal: Goal) {
  const { slow, aggressive } = RATE_RANGE[goal]
  return slow + (pct / 100) * (aggressive - slow)
}

export function GoalForm({
  initialGoal,
  initialRateKgPerWeek,
  profile,
  weightKg,
}: {
  initialGoal: Goal
  initialRateKgPerWeek?: number
  profile: ProfileForTdee
  weightKg: number
}) {
  const [state, formAction, pending] = useActionState(saveGoal, undefined)
  const [goal, setGoal] = useState<Goal>(initialGoal)
  const [rate, setRate] = useState<number>(
    initialRateKgPerWeek ?? GOAL_RATE_KG_PER_WEEK[initialGoal]
  )
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const copy = GOAL_COPY[goal]
  const target = initialTarget({ ...profile, goal }, weightKg, rate)
  const sliderPct = rateToSliderPct(rate, goal)

  function selectGoal(next: Goal) {
    setGoal(next)
    setRate(GOAL_RATE_KG_PER_WEEK[next])
  }

  function updateFromPointer(clientX: number) {
    const track = trackRef.current
    if (!track || RATE_RANGE[goal].slow === RATE_RANGE[goal].aggressive) return
    const rect = track.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setRate(sliderPctToRate(pct, goal))
  }

  function handlePointerDown(e: React.PointerEvent) {
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromPointer(e.clientX)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return
    updateFromPointer(e.clientX)
  }

  function handlePointerUp() {
    draggingRef.current = false
  }

  return (
    <div className="mx-auto flex w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="mb-5 flex items-center gap-3.5">
        <Link href="/settings" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <p className="text-lg font-semibold text-text">Goal</p>
      </div>

      <form action={formAction} className="flex flex-col">
        <input type="hidden" name="goal" value={goal} />
        <input type="hidden" name="goalRate" value={Math.round(rate * 100)} />

        <div className="mb-6 flex gap-1.5 rounded-hero border border-hairline bg-card p-1.5">
          {goals.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => selectGoal(g.value)}
              className={`flex-1 rounded-input py-3.5 text-sm font-semibold transition-all duration-150 ${
                goal === g.value ? "bg-accent text-bg" : "text-text-muted"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="rounded-hero bg-surface p-6.5 text-center shadow-hero">
          <p className="font-mono text-[11px] tracking-wide text-text-muted uppercase">
            Daily target
          </p>
          <div className="mt-1.5 flex items-baseline justify-center gap-2">
            <span className="font-doto text-6xl font-black text-accent">
              {target}
            </span>
            <span className="font-mono text-base text-text-faint">kcal</span>
          </div>
          <p className="mt-2 font-mono text-sm text-text">
            {goal === "maintain" ? copy.rate : `${rate > 0 ? "+" : ""}${rate.toFixed(2)} kg / week`}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Mifflin-St Jeor estimate from your height, weight, age &amp; activity
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex justify-between">
            <span className="text-sm text-text-muted">Target rate</span>
            <span className="font-mono text-xs text-text">
              {goal === "maintain" ? "—" : `${rate > 0 ? "+" : ""}${rate.toFixed(2)} kg / week`}
            </span>
          </div>
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`relative flex h-5.5 items-center ${
              goal === "maintain" ? "" : "cursor-pointer touch-none"
            }`}
          >
            <div className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-card-alt">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-accent"
                style={{ width: `${sliderPct}%` }}
              />
            </div>
            <span
              className="pointer-events-none absolute top-1/2 size-5.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text shadow-[0_2px_8px_rgba(0,0,0,.5)]"
              style={{ left: `${sliderPct}%` }}
            />
          </div>
          <div className="mt-2.5 flex justify-between font-mono text-[10px] text-text-faint">
            <span>slow</span>
            <span>steady</span>
            <span>aggressive</span>
          </div>
        </div>

        {state?.errors?.goal && (
          <p className="mt-4 text-sm text-warning">{state.errors.goal[0]}</p>
        )}

        <Button type="submit" disabled={pending} className="mt-8">
          {pending ? "Saving…" : "Save goal"}
        </Button>
      </form>
    </div>
  )
}
