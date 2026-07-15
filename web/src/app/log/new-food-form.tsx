"use client"

import { useActionState } from "react"
import { createFood } from "./actions"
import { Input, Label, FieldError } from "@/components/input"
import { Button } from "@/components/button"

export function NewFoodForm({ initialName }: { initialName?: string }) {
  const [state, formAction, pending] = useActionState(createFood, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={initialName} />
        <FieldError message={state?.errors?.name?.[0]} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand">Brand (optional)</Label>
        <Input id="brand" name="brand" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="caloriesPer100g">Calories per 100g</Label>
        <Input id="caloriesPer100g" name="caloriesPer100g" type="number" step="0.1" />
        <FieldError message={state?.errors?.caloriesPer100g?.[0]} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="proteinPer100g">Protein/100g</Label>
          <Input id="proteinPer100g" name="proteinPer100g" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="carbsPer100g">Carbs/100g</Label>
          <Input id="carbsPer100g" name="carbsPer100g" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fatPer100g">Fat/100g</Label>
          <Input id="fatPer100g" name="fatPer100g" type="number" step="0.1" />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Saving..." : "Create food"}
      </Button>
    </form>
  )
}
