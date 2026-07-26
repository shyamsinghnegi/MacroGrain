"use client"

import { toggleUnitSystem } from "@/app/settings/actions"
import type { UnitSystem } from "@/lib/units"

export function UnitToggle({ unitSystem }: { unitSystem: UnitSystem }) {
  const next: UnitSystem = unitSystem === "metric" ? "imperial" : "metric"

  return (
    <form action={toggleUnitSystem} className="flex items-center justify-between px-4 py-3.5">
      <input type="hidden" name="unitSystem" value={next} />
      <span className="text-sm text-text">Units</span>
      <button
        type="submit"
        className="font-mono text-xs text-text-muted transition-colors hover:text-text"
      >
        {unitSystem === "metric" ? "metric · kg/cm" : "imperial · lb/ft"}
      </button>
    </form>
  )
}
