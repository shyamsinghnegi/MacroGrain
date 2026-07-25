"use client"

import { useTransition } from "react"
import { Droplet } from "lucide-react"
import { addWater } from "@/app/water/actions"
import { SegBar } from "@/components/seg-bar"

const QUICK_AMOUNTS = [250, 500]

export function WaterWidget({
  consumedMl,
  goalMl,
}: {
  consumedMl: number
  goalMl: number
}) {
  const [pending, startTransition] = useTransition()

  function logAmount(amountMl: number) {
    const formData = new FormData()
    formData.set("amountMl", String(amountMl))
    startTransition(async () => {
      await addWater(formData)
    })
  }

  const filled = Math.round(Math.min(1, consumedMl / goalMl) * 20)

  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="flex items-center gap-1.5 label-mono font-doto text-[10px] tracking-[0.18em] text-text-muted uppercase">
          <Droplet size={11} className="text-info" />
          Water
        </p>
        <p className="font-mono text-sm text-text">
          {(consumedMl / 1000).toFixed(1)} / {(goalMl / 1000).toFixed(1)} L
        </p>
      </div>
      <div className="mt-2">
        <SegBar filled={filled} total={20} color="var(--color-info)" height={8} />
      </div>
      <div className="mt-3 flex gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={pending}
            onClick={() => logAmount(amount)}
            className="flex-1 rounded-pill border border-hairline bg-surface py-2 font-mono text-xs text-text-muted transition-colors disabled:opacity-50"
          >
            +{amount} ml
          </button>
        ))}
      </div>
    </div>
  )
}
