"use client"

import { useState } from "react"
import { useActionState } from "react"
import Link from "next/link"
import { createLabelFoodAndLog } from "@/app/log/actions"
import { FieldError } from "@/components/input"
import { Button } from "@/components/button"
import type { NutritionLabelResult } from "@/lib/gemini"

const FIELD_LABELS: Record<string, string> = {
  calories: "Energy",
  protein: "Protein",
  carbs: "Carbohydrate",
  fat: "Fat",
  saturatedFat: "Saturated fat",
  fiber: "Fiber",
  sugars: "Sugars",
  sodium: "Sodium",
}

function readStashedResult(): NutritionLabelResult | "invalid" {
  if (typeof window === "undefined") return "invalid"
  const raw = sessionStorage.getItem("mg_ai_label_result")
  if (!raw) return "invalid"
  try {
    return JSON.parse(raw) as NutritionLabelResult
  } catch {
    return "invalid"
  }
}

export function LabelConfirmClient() {
  const [result] = useState<NutritionLabelResult | "invalid">(readStashedResult)

  if (result === "invalid") {
    return (
      <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 sm:px-6 pb-28 text-center sm:max-w-xl">
        <p className="text-lg font-semibold text-text">No label scan found</p>
        <p className="text-sm text-text-muted">
          Start a new scan to read a nutrition label.
        </p>
        <Link href="/scan" className="rounded-pill bg-text px-5 py-2 text-sm font-medium text-bg">
          Back to scan
        </Link>
      </div>
    )
  }

  return <ConfirmForm result={result} />
}

type FieldKey = "calories" | "protein" | "carbs" | "fat" | "saturatedFat" | "fiber" | "sugars" | "sodium"

function ConfirmForm({ result }: { result: NutritionLabelResult }) {
  const [state, formAction, pending] = useActionState(createLabelFoodAndLog, undefined)
  const servingMatch = result.servingSizeDescription?.match(/(\d+(?:\.\d+)?)\s*g/i)
  const [serving, setServing] = useState(servingMatch ? Number(servingMatch[1]) : 100)
  const [name, setName] = useState("Scanned product")

  const [values, setValues] = useState<Record<FieldKey, number | "">>({
    calories: result.caloriesPerServing ?? "",
    protein: result.proteinPerServing ?? "",
    carbs: result.carbsPerServing ?? "",
    fat: result.fatPerServing ?? "",
    saturatedFat: result.saturatedFatPerServing ?? "",
    fiber: result.fiberPerServing ?? "",
    sugars: result.sugarsPerServing ?? "",
    sodium: result.sodiumMgPerServing ?? "",
  })

  const flagged = new Set(result.flaggedFields)

  const rows: { key: FieldKey; unit: string; required?: boolean }[] = [
    { key: "calories", unit: "kcal", required: true },
    { key: "protein", unit: "g", required: true },
    { key: "carbs", unit: "g", required: true },
    { key: "fat", unit: "g", required: true },
    { key: "saturatedFat", unit: "g" },
    { key: "fiber", unit: "g" },
    { key: "sugars", unit: "g" },
    { key: "sodium", unit: "mg" },
  ]

  return (
    <div className="mx-auto flex w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="mb-4.5 flex items-center justify-between">
        <Link href="/scan" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <p className="text-base font-semibold text-text">Read from label</p>
        <span className="w-5" />
      </div>

      <form action={formAction} className="flex flex-col gap-2.5">
        <input type="hidden" name="returnTo" value="/" />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          name="name"
          placeholder="Product name"
          className="mb-2 rounded-input bg-card px-4 py-3.5 text-sm text-text shadow-inset-input outline-none focus-visible:outline-2 focus-visible:outline-accent"
        />
        <FieldError message={state?.errors?.name?.[0]} />

        <div className="flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3.5">
          <span className="text-sm text-text">Serving size</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={serving}
              onChange={(e) => setServing(Number(e.target.value))}
              name="servingG"
              className="w-16 bg-transparent text-right font-mono text-sm text-text outline-none"
            />
            <span className="font-mono text-sm text-text-muted">g</span>
          </div>
        </div>
        <FieldError message={state?.errors?.servingG?.[0]} />

        {rows.map(({ key, unit, required }) => {
          const isFlagged = flagged.has(key)
          return (
            <div key={key}>
              <div
                className={`flex items-center justify-between rounded-input px-4 py-3.5 ${
                  isFlagged
                    ? "border-[1.5px] border-warning/50 bg-warning/10"
                    : "border border-hairline bg-card"
                }`}
              >
                <span className="flex items-center gap-2 text-sm text-text">
                  {isFlagged && <span className="size-1.5 rounded-full bg-warning" />}
                  {FIELD_LABELS[key]}
                  {required && values[key] === "" && (
                    <span className="text-xs text-warning">required</span>
                  )}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={values[key]}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        [key]: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className={`w-16 bg-transparent text-right font-mono text-sm outline-none ${
                      isFlagged ? "text-warning" : "text-text"
                    }`}
                  />
                  <span className={`text-xs ${isFlagged ? "text-warning" : "text-text-muted"}`}>
                    {unit}
                  </span>
                </div>
              </div>
              <input
                type="hidden"
                name={key === "sodium" ? "sodiumMg" : key}
                value={values[key]}
              />
            </div>
          )
        })}

        {flagged.size > 0 && (
          <p className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-warning">
            <span>⚠</span> {flagged.size} field{flagged.size > 1 ? "s" : ""} need review — double
            check against the label
          </p>
        )}

        <FieldError message={state?.errors?.calories?.[0]} />
        <FieldError message={state?.errors?.protein?.[0]} />
        <FieldError message={state?.errors?.carbs?.[0]} />
        <FieldError message={state?.errors?.fat?.[0]} />
        {state?.message && <p className="text-sm text-warning">{state.message}</p>}

        <div className="flex-1" />

        <Button type="submit" variant="accent" disabled={pending} className="mt-4 py-4">
          {pending ? "Saving…" : "Confirm & add"}
        </Button>
      </form>
    </div>
  )
}
