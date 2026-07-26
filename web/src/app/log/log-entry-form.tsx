"use client"

import { useActionState, useState } from "react"
import { logEntry } from "./actions"
import { Input, Label, FieldError } from "@/components/input"
import { Button } from "@/components/button"
import type { LogContext } from "./food-search"

type Food = {
  id: string
  name: string
  brand: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

function hourLabel(hour: number) {
  if (hour === 0) return "12 AM"
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return "12 PM"
  return `${hour - 12} PM`
}

export function LogEntryForm({
  food,
  context = {},
}: {
  food: Food
  context?: LogContext
}) {
  const [state, formAction, pending] = useActionState(logEntry, undefined)
  const [quantityText, setQuantityText] = useState("100")

  // Read once via a lazy initializer rather than passed through the URL
  // context (which only ever carries returnTo/date/hour) - Intl is
  // available synchronously on mount, no need to wait for an effect.
  const [timezone] = useState(() =>
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""
  )

  // Track the raw text separately from the parsed number: a plain
  // `useState(100)` bound to value={quantity} re-renders "00" back to "0"
  // the moment the input is parsed, so backspacing "100" down to nothing
  // and typing "20" produces "020" instead of "20". Keeping the text as
  // typed (only falling back to 0 for the calorie math) lets the box
  // genuinely go empty while the user is mid-edit.
  const quantity = Number(quantityText) || 0
  const ratio = quantity / 100
  const targetHour = context.hour !== undefined ? Number(context.hour) : undefined

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="foodId" value={food.id} />
      {context.returnTo && (
        <input type="hidden" name="returnTo" value={context.returnTo} />
      )}
      {context.date && <input type="hidden" name="date" value={context.date} />}
      {context.hour && <input type="hidden" name="hour" value={context.hour} />}
      {timezone && <input type="hidden" name="timezone" value={timezone} />}

      <div>
        <p className="font-medium text-text">{food.name}</p>
        {food.brand && <p className="text-sm text-text-muted">{food.brand}</p>}
        {targetHour !== undefined && (
          <p className="mt-1 font-mono text-xs text-accent">
            Logging at {hourLabel(targetHour)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quantityG">Quantity (g)</Label>
        <Input
          id="quantityG"
          name="quantityG"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value)}
        />
        <FieldError message={state?.errors?.quantityG?.[0]} />
      </div>

      <div className="rounded-card bg-surface p-4 shadow-card">
        <p className="font-doto text-3xl font-black text-text">
          {Math.round(food.caloriesPer100g * ratio)}
          <span className="ml-1 font-sans text-sm font-normal text-text-muted">
            kcal
          </span>
        </p>
        <p className="mt-1 font-mono text-sm text-text-muted">
          P {Math.round(food.proteinPer100g * ratio)}g · C{" "}
          {Math.round(food.carbsPer100g * ratio)}g · F{" "}
          {Math.round(food.fatPer100g * ratio)}g
        </p>
      </div>

      <Button type="submit" variant="accent" disabled={pending} className="mt-2">
        {pending ? "Saving..." : "Add to log"}
      </Button>
    </form>
  )
}
