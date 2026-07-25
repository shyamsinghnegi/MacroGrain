"use client"

import { useState } from "react"
import { Button } from "@/components/button"
import { LogEntryForm } from "./log-entry-form"
import type { LogContext } from "./food-search"

// Product detail — see design_handoff_macrograin/Macrograin.dc.html screen
// 10: serving selector, nutrition panel with a divider under "Energy" and
// sub-rows. The design's dithered header + striped image placeholder were
// removed - there's no real product image data behind them (no `foods`
// column for one), and the placeholder's back arrow duplicated the page's
// own back arrow above it. Saturated fat/fiber/sugars/sodium are shown only
// when present (mostly populated for Open Food Facts-sourced foods, not
// manual entries) rather than as fake zeros - same "don't fake confidence"
// pattern used elsewhere.

type Food = {
  id: string
  name: string
  brand: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  saturatedFatPer100g?: number | null
  fiberPer100g?: number | null
  sugarsPer100g?: number | null
  sodiumPer100g?: number | null
}

export function FoodDetail({
  food,
  context = {},
}: {
  food: Food
  context?: LogContext
}) {
  const [showQuantity, setShowQuantity] = useState(false)

  if (showQuantity) {
    return <LogEntryForm food={food} context={context} />
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 text-center">
        <p className="text-xl font-semibold text-text">{food.name}</p>
        {food.brand && <p className="text-sm text-text-muted">{food.brand}</p>}
      </div>

      <div className="mb-4.5 flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3">
        <span className="text-sm text-text-muted">Serving</span>
        <span className="font-mono text-sm text-text">100 g ▾</span>
      </div>

      <div className="rounded-card bg-surface p-5">
        <div className="flex items-baseline justify-between border-b-2 border-hairline pb-3.5">
          <span className="label-mono font-doto text-[11px] tracking-[0.16em] text-text-faint uppercase">
            Energy
          </span>
          <span>
            <span className="font-doto text-3xl font-black text-text">
              {Math.round(food.caloriesPer100g)}
            </span>{" "}
            <span className="font-mono text-xs text-text-faint">kcal</span>
          </span>
        </div>
        <div className="flex flex-col">
          <div className="flex justify-between border-b border-hairline py-2.5">
            <span className="text-sm text-protein">Protein</span>
            <span className="font-mono text-sm text-text">
              {food.proteinPer100g.toFixed(1)} g
            </span>
          </div>
          <div className="flex justify-between border-b border-hairline py-2.5">
            <span className="text-sm text-carbs">Carbohydrate</span>
            <span className="font-mono text-sm text-text">
              {food.carbsPer100g.toFixed(1)} g
            </span>
          </div>
          {food.sugarsPer100g != null && (
            <div className="flex justify-between border-b border-hairline py-2.5 pl-4">
              <span className="text-xs text-text-muted">of which sugars</span>
              <span className="font-mono text-xs text-text-muted">
                {food.sugarsPer100g.toFixed(1)} g
              </span>
            </div>
          )}
          <div className="flex justify-between border-b border-hairline py-2.5">
            <span className="text-sm text-fat">Fat</span>
            <span className="font-mono text-sm text-text">
              {food.fatPer100g.toFixed(1)} g
            </span>
          </div>
          {food.saturatedFatPer100g != null && (
            <div className="flex justify-between border-b border-hairline py-2.5 pl-4">
              <span className="text-xs text-text-muted">of which saturated</span>
              <span className="font-mono text-xs text-text-muted">
                {food.saturatedFatPer100g.toFixed(1)} g
              </span>
            </div>
          )}
          {food.fiberPer100g != null && (
            <div className="flex justify-between border-b border-hairline py-2.5">
              <span className="text-sm text-text-muted">Fiber</span>
              <span className="font-mono text-sm text-text">
                {food.fiberPer100g.toFixed(1)} g
              </span>
            </div>
          )}
          {food.sodiumPer100g != null && (
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-text-muted">Sodium</span>
              <span className="font-mono text-sm text-text">
                {(food.sodiumPer100g * 1000).toFixed(0)} mg
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-[11px] text-text-faint">
        per 100 g{food.saturatedFatPer100g == null && food.fiberPer100g == null
          ? " · values shown are for the manually entered food"
          : ""}
      </p>

      <Button
        variant="accent"
        className="mt-6"
        onClick={() => setShowQuantity(true)}
      >
        Add to log
      </Button>
    </div>
  )
}
