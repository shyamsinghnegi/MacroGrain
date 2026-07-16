"use client"

import { useActionState, useState } from "react"
import { logWeight } from "./actions"
import { Input, FieldError } from "@/components/input"
import { Button } from "@/components/button"

export function LogWeightForm() {
  const [state, formAction, pending] = useActionState(logWeight, undefined)
  const [open, setOpen] = useState(false)

  if (!open) {
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
