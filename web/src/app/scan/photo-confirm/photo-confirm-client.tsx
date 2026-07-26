"use client"

import { useState } from "react"
import { useActionState } from "react"
import Link from "next/link"
import { createAiFoodAndLog } from "@/app/log/actions"
import { FieldError } from "@/components/input"
import { Button } from "@/components/button"
import { SourceBadge } from "@/components/source-badge"
import type { FoodPhotoResult } from "@/lib/gemini"

function readStashedResult(): FoodPhotoResult | "invalid" {
  if (typeof window === "undefined") return "invalid"
  const raw = sessionStorage.getItem("mg_ai_photo_result")
  if (!raw) return "invalid"
  try {
    return JSON.parse(raw) as FoodPhotoResult
  } catch {
    return "invalid"
  }
}

export function PhotoConfirmClient() {
  const [result] = useState<FoodPhotoResult | "invalid">(readStashedResult)

  if (result === "invalid") {
    return (
      <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 sm:px-6 pb-28 text-center sm:max-w-xl">
        <p className="text-lg font-semibold text-text">No photo scan found</p>
        <p className="text-sm text-text-muted">
          Start a new scan to estimate a meal from a photo.
        </p>
        <Link href="/scan" className="rounded-pill bg-text px-5 py-2 text-sm font-medium text-bg">
          Back to scan
        </Link>
      </div>
    )
  }

  return <ConfirmForm estimate={result} />
}

function ConfirmForm({ estimate }: { estimate: FoodPhotoResult }) {
  const [state, formAction, pending] = useActionState(createAiFoodAndLog, undefined)
  const [portion, setPortion] = useState(() => {
    const match = estimate.portionDescription.match(/(\d+)\s*g/i)
    return match ? match[1] : "250"
  })
  const portionValue = Math.max(1, Number(portion) || 0)

  const scale = portionValue / (Number(estimate.portionDescription.match(/(\d+)\s*g/i)?.[1]) || 250)
  const isLow = estimate.confidence === "low"

  return (
    <div className="mx-auto flex w-full flex-col gap-5 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="flex items-center justify-between">
        <Link href="/scan" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <p className="text-base font-semibold text-text">Confirm entry</p>
        <SourceBadge source="ai_photo" />
      </div>

      <div className="flex items-center gap-3.5">
        <div className="size-16 shrink-0 rounded-card bg-[repeating-linear-gradient(45deg,var(--color-card-alt)_0_5px,var(--color-surface)_5px_10px)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-text">{estimate.name}</p>
          <p className="text-sm text-text-muted">
            estimated from photo · {estimate.portionDescription}
          </p>
        </div>
      </div>

      <div
        className={`flex items-center gap-2.5 rounded-card border-[1.5px] px-3.5 py-3 ${
          isLow ? "border-warning/40 bg-warning/10" : "border-accent/25 bg-accent/8"
        }`}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 w-4 rounded-[2px] ${
                isLow ? (i === 0 ? "bg-warning" : "bg-white/10") : "bg-accent"
              }`}
            />
          ))}
        </div>
        <p
          className={`font-mono text-xs tracking-wide uppercase ${
            isLow ? "text-warning" : "text-accent"
          }`}
        >
          {isLow ? "Low confidence · verify values" : "High confidence"}
        </p>
      </div>

      {estimate.notes && (
        <p className="text-sm leading-relaxed text-text-muted">{estimate.notes}</p>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="name" value={estimate.name} />
        <input type="hidden" name="returnTo" value="/" />

        <div className="flex items-center justify-between rounded-card border border-hairline bg-card px-4 py-3.5">
          <div>
            <p className="text-xs text-text-muted">Portion</p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={1}
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                className="w-16 bg-transparent font-mono text-base text-text outline-none"
              />
              <span className="font-mono text-sm text-text-muted">g</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setPortion(String(Math.max(1, portionValue - 25)))}
              className="flex size-9 items-center justify-center rounded-input border border-hairline text-lg text-text"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setPortion(String(portionValue + 25))}
              className="flex size-9 items-center justify-center rounded-input bg-text text-lg text-bg"
            >
              +
            </button>
          </div>
        </div>
        <input type="hidden" name="portionG" value={portionValue} />
        <FieldError message={state?.errors?.portionG?.[0]} />
        <FieldError message={state?.errors?.name?.[0]} />

        <div className={`rounded-hero p-5 ${isLow ? "border border-warning/25 bg-surface" : "bg-surface shadow-hero"}`}>
          <div className="mb-4 flex items-baseline justify-between">
            <p className="label-mono font-doto text-[11px] tracking-[0.2em] text-text-faint uppercase">
              Calories{isLow ? " · est" : ""}
            </p>
            <p className="flex items-baseline gap-1.5">
              {isLow && <span className="font-mono text-base text-warning">≈</span>}
              <span className="font-doto text-4xl font-black text-text">
                {Math.round(estimate.caloriesEstimate * scale)}
              </span>
            </p>
          </div>
          <input type="hidden" name="calories" value={estimate.caloriesEstimate * scale} />
          <div className="flex flex-col gap-3.5">
            {(
              [
                ["Protein", "protein", estimate.proteinEstimate, "var(--color-protein)"],
                ["Carbs", "carbs", estimate.carbsEstimate, "var(--color-carbs)"],
                ["Fat", "fat", estimate.fatEstimate, "var(--color-fat)"],
              ] as const
            ).map(([label, field, value, color]) => (
              <div key={field}>
                <div className="mb-1.5 flex justify-between">
                  <span className="text-sm" style={{ color }}>
                    {label}
                  </span>
                  <span className={`font-mono text-sm ${isLow ? "text-warning" : "text-text"}`}>
                    {isLow && "≈ "}
                    {(value * scale).toFixed(1)} g
                  </span>
                </div>
                <input type="hidden" name={field} value={value * scale} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/scan"
            className="flex-1 rounded-pill border-[1.5px] border-hairline py-4 text-center text-sm font-semibold text-text"
          >
            Discard
          </Link>
          <Button type="submit" variant="accent" disabled={pending} className="flex-1 py-4">
            {pending ? "Saving…" : "Verify & add"}
          </Button>
        </div>
        {state?.message && <p className="text-center text-sm text-warning">{state.message}</p>}
      </form>
    </div>
  )
}
