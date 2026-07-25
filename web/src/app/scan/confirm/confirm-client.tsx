"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useActionState } from "react"
import { logEntry } from "@/app/log/actions"
import { FieldError } from "@/components/input"
import { Button } from "@/components/button"
import { SourceBadge } from "@/components/source-badge"

type Food = {
  id: string
  name: string
  brand: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

type LookupState =
  | { status: "loading" }
  | { status: "found"; food: Food }
  | { status: "not_found" }

export function ConfirmBarcodeClient({ barcode }: { barcode: string }) {
  const [lookup, setLookup] = useState<LookupState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    fetch(`/api/foods/barcode?code=${encodeURIComponent(barcode)}`)
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setLookup({ status: "not_found" })
          return
        }
        const food = await res.json()
        setLookup({ status: "found", food })
      })
      .catch(() => {
        if (!cancelled) setLookup({ status: "not_found" })
      })
    return () => {
      cancelled = true
    }
  }, [barcode])

  if (lookup.status === "loading") {
    return (
      <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 sm:px-6 pb-28 sm:max-w-xl">
        <div className="flex gap-1.5">
          {[0, 0.2, 0.4].map((delay) => (
            <span
              key={delay}
              className="size-2 animate-pulse rounded-full bg-accent"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
        <p className="font-mono text-sm text-text-muted">
          Looking up barcode {barcode}…
        </p>
      </div>
    )
  }

  if (lookup.status === "not_found") {
    return (
      <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 sm:px-6 pb-28 text-center sm:max-w-xl">
        <p className="text-lg font-semibold text-text">Product not found</p>
        <p className="text-sm text-text-muted">
          We couldn&apos;t find nutrition data for barcode {barcode} in Open
          Food Facts.
        </p>
        <div className="mt-2 flex gap-3">
          <Link href="/scan" className="rounded-pill border-[1.5px] border-hairline px-5 py-2 text-sm text-text">
            Try again
          </Link>
          <Link href="/log" className="rounded-pill bg-text px-5 py-2 text-sm font-medium text-bg">
            Search manually
          </Link>
        </div>
      </div>
    )
  }

  return <ConfirmForm food={lookup.food} />
}

function ConfirmForm({ food }: { food: Food }) {
  const [state, formAction, pending] = useActionState(logEntry, undefined)
  const [quantity, setQuantity] = useState(100)

  const ratio = quantity / 100

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col gap-5 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="flex items-center justify-between">
        <Link href="/scan" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <p className="text-base font-semibold text-text">Confirm entry</p>
        <SourceBadge source="barcode" />
      </div>

      <div className="flex items-center gap-3.5">
        <div className="size-16 shrink-0 rounded-card bg-[repeating-linear-gradient(45deg,var(--color-card-alt)_0_5px,var(--color-surface)_5px_10px)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-text">
            {food.name}
          </p>
          {food.brand && (
            <p className="text-sm text-text-muted">{food.brand}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-card border border-accent/25 bg-accent/8 px-3.5 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-4 rounded-[2px] bg-accent" />
          ))}
        </div>
        <p className="font-mono text-xs tracking-wide text-accent uppercase">
          High confidence · verified pack data
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="foodId" value={food.id} />
        <input type="hidden" name="source" value="barcode" />

        <div className="flex items-center justify-between rounded-card border border-hairline bg-card px-4 py-3.5">
          <div>
            <p className="text-xs text-text-muted">Quantity</p>
            <p className="mt-0.5 font-mono text-base text-text">
              {quantity} g
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 25))}
              className="flex size-9 items-center justify-center rounded-input border border-hairline text-lg text-text"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 25)}
              className="flex size-9 items-center justify-center rounded-input bg-text text-lg text-bg"
            >
              +
            </button>
          </div>
        </div>

        <input type="hidden" name="quantityG" value={quantity} />
        <FieldError message={state?.errors?.quantityG?.[0]} />

        <div className="rounded-hero bg-surface p-5 shadow-hero">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="label-mono font-doto text-[11px] tracking-[0.2em] text-text-muted uppercase">
              Calories
            </p>
            <p className="font-doto text-4xl font-black text-text">
              {Math.round(food.caloriesPer100g * ratio)}
            </p>
          </div>
          <div className="flex flex-col gap-3 font-mono text-sm">
            <div className="flex items-center justify-between">
              <span className="text-protein">Protein</span>
              <span className="text-text">
                {(food.proteinPer100g * ratio).toFixed(1)} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-carbs">Carbs</span>
              <span className="text-text">
                {(food.carbsPer100g * ratio).toFixed(1)} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fat">Fat</span>
              <span className="text-text">
                {(food.fatPer100g * ratio).toFixed(1)} g
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/log"
            className="rounded-pill border-[1.5px] border-hairline px-5 py-2.5 text-sm font-medium text-text"
          >
            Edit
          </Link>
          <Button
            type="submit"
            variant="accent"
            disabled={pending}
            className="flex-1"
          >
            {pending ? "Saving…" : "Add to log"}
          </Button>
        </div>
      </form>
    </div>
  )
}
