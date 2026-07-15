"use client"

import { useActionState, useState } from "react"
import { logEntry } from "./actions"
import { Input, Label, FieldError } from "@/components/input"
import { Button } from "@/components/button"

type Food = {
  id: string
  name: string
  brand: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

export function LogEntryForm({ food }: { food: Food }) {
  const [state, formAction, pending] = useActionState(logEntry, undefined)
  const [quantity, setQuantity] = useState(100)

  const ratio = quantity / 100

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="foodId" value={food.id} />

      <div>
        <p className="font-medium text-text">{food.name}</p>
        {food.brand && <p className="text-sm text-text-muted">{food.brand}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quantityG">Quantity (g)</Label>
        <Input
          id="quantityG"
          name="quantityG"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 0)}
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
