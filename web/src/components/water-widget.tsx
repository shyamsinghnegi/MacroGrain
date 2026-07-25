"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Droplet, ChevronRight } from "lucide-react"
import { addWater } from "@/app/water/actions"
import { SegBar } from "@/components/seg-bar"

export function WaterWidget({
  consumedMl,
  goalMl,
}: {
  consumedMl: number
  goalMl: number
}) {
  const [pending, startTransition] = useTransition()
  const [showCustom, setShowCustom] = useState(false)
  const [customAmount, setCustomAmount] = useState("")

  function logAmount(amountMl: number) {
    const formData = new FormData()
    formData.set("amountMl", String(amountMl))
    startTransition(async () => {
      await addWater(formData)
    })
  }

  function logCustomAmount() {
    const amount = Number(customAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    logAmount(Math.round(amount))
    setCustomAmount("")
    setShowCustom(false)
  }

  const filled = Math.round(Math.min(1, consumedMl / goalMl) * 20)

  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="flex items-center gap-1.5 label-mono font-doto text-[10px] tracking-[0.18em] text-text-muted uppercase">
          <Droplet size={11} className="text-info" />
          Water
        </p>
        <div className="flex items-center gap-1">
          <p className="font-mono text-sm text-text">
            {(consumedMl / 1000).toFixed(1)} / {(goalMl / 1000).toFixed(1)} L
          </p>
          <Link
            href="/timeline"
            aria-label="Edit logged water"
            className="flex size-5 items-center justify-center text-text-faint"
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
      <div className="mt-2">
        <SegBar filled={filled} total={20} color="var(--color-info)" height={8} />
      </div>
      {showCustom ? (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            autoFocus
            placeholder="Amount in ml"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") logCustomAmount()
              if (e.key === "Escape") {
                setShowCustom(false)
                setCustomAmount("")
              }
            }}
            className="min-w-0 flex-1 rounded-pill border border-hairline bg-surface px-3 py-2 font-mono text-xs text-text outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={logCustomAmount}
            className="rounded-pill bg-accent px-4 py-2 font-mono text-xs font-bold text-bg transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustom(false)
              setCustomAmount("")
            }}
            className="rounded-pill border border-hairline px-3 py-2 font-mono text-xs text-text-muted"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => logAmount(250)}
            className="flex-1 rounded-pill border border-hairline bg-surface py-2 font-mono text-xs text-text-muted transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            +250 ml
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowCustom(true)}
            className="flex-1 rounded-pill border border-hairline bg-surface py-2 font-mono text-xs text-text-muted transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            Custom
          </button>
        </div>
      )}
    </div>
  )
}
