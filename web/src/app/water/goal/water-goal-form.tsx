"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { saveWaterGoal } from "@/app/water/actions"
import { Button } from "@/components/button"
import { Droplet } from "lucide-react"

const PRESETS = [2000, 2500, 3000, 3500]

export function WaterGoalForm({ initialGoalMl }: { initialGoalMl: number }) {
  const [state, formAction, pending] = useActionState(saveWaterGoal, undefined)
  const [goalMl, setGoalMl] = useState(initialGoalMl)

  return (
    <div className="mx-auto flex w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="mb-5 flex items-center gap-3.5">
        <Link href="/settings" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <p className="text-lg font-semibold text-text">Water goal</p>
      </div>

      <form action={formAction} className="flex flex-col">
        <input type="hidden" name="waterGoalMl" value={goalMl} />

        <div className="rounded-hero bg-surface p-6.5 text-center shadow-hero">
          <p className="flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-wide text-text-muted uppercase">
            <Droplet size={12} className="text-info" />
            Daily target
          </p>
          <div className="mt-1.5 flex items-baseline justify-center gap-2">
            <span className="font-doto text-6xl font-black text-info">
              {(goalMl / 1000).toFixed(1)}
            </span>
            <span className="font-mono text-base text-text-faint">L</span>
          </div>
        </div>

        <div className="mt-6 flex gap-1.5 rounded-hero border border-hairline bg-card p-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setGoalMl(preset)}
              className={`flex-1 rounded-input py-3.5 text-sm font-semibold transition-all duration-150 ${
                goalMl === preset ? "bg-info text-bg" : "text-text-muted"
              }`}
            >
              {(preset / 1000).toFixed(1)}L
            </button>
          ))}
        </div>

        {state?.errors?.waterGoalMl && (
          <p className="mt-4 text-sm text-warning">{state.errors.waterGoalMl[0]}</p>
        )}

        <Button type="submit" disabled={pending} className="mt-8">
          {pending ? "Saving…" : "Save goal"}
        </Button>
      </form>
    </div>
  )
}
