"use client"

import { useActionState, useState } from "react"
import { logWeight } from "./actions"
import { Input, FieldError } from "@/components/input"
import { Button } from "@/components/button"

export function LogWeightForm({
  emptyState,
}: {
  emptyState?: { headline: string; description: string; ctaLabel: string }
}) {
  const [state, formAction, pending] = useActionState(logWeight, undefined)
  const [open, setOpen] = useState(false)

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

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        name="weightKg"
        type="number"
        step="0.1"
        placeholder="Weight (kg)"
        autoFocus
      />
      <FieldError message={state?.errors?.weightKg?.[0]} />
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  )
}
