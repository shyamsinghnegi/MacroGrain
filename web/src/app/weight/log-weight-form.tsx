"use client"

import { useActionState, useState } from "react"
import { logWeight } from "./actions"
import { Input, FieldError } from "@/components/input"
import { Button } from "@/components/button"
import { parseWeightToKg, type UnitSystem } from "@/lib/units"

export function LogWeightForm({
  emptyState,
  unitSystem = "metric",
}: {
  emptyState?: { headline: string; description: string; ctaLabel: string }
  unitSystem?: UnitSystem
}) {
  const [state, formAction, pending] = useActionState(logWeight, undefined)
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  if (!open) {
    if (emptyState) {
      return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex size-24 items-center justify-center rounded-full border border-dashed border-hairline">
            <span className="font-doto text-3xl font-black text-text-ghost">
              0
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-semibold text-text">
              {emptyState.headline}
            </p>
            <p className="max-w-[260px] text-sm text-text-muted">
              {emptyState.description}
            </p>
          </div>
          <Button variant="accent" onClick={() => setOpen(true)}>
            {emptyState.ctaLabel}
          </Button>
        </div>
      )
    }
    return (
      <Button variant="accent" onClick={() => setOpen(true)}>
        + Log weight
      </Button>
    )
  }

  const unitLabel = unitSystem === "imperial" ? "lb" : "kg"
  const kgValue = inputValue === "" ? "" : parseWeightToKg(Number(inputValue), unitSystem)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        type="number"
        inputMode="decimal"
        step="0.1"
        placeholder={`Weight (${unitLabel})`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        autoFocus
      />
      <input type="hidden" name="weightKg" value={kgValue} />
      <FieldError message={state?.errors?.weightKg?.[0]} />
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  )
}
