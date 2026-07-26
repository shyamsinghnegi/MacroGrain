"use client"

import { useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import { toggleUnitSystem } from "@/app/settings/actions"
import type { UnitSystem } from "@/lib/units"

const OPTIONS: { value: UnitSystem; label: string; meta: string }[] = [
  { value: "metric", label: "Metric", meta: "kg / cm" },
  { value: "imperial", label: "Imperial", meta: "lb / ft" },
]

export function UnitToggle({ unitSystem }: { unitSystem: UnitSystem }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const current = OPTIONS.find((o) => o.value === unitSystem) ?? OPTIONS[0]

  return (
    <div ref={containerRef} className="relative flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-text">Units</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="font-mono text-xs text-text-muted transition-colors hover:text-text"
      >
        {current.label.toLowerCase()} · {current.meta}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-4 z-30 mt-1 w-40 overflow-hidden rounded-input border border-hairline bg-surface shadow-hero"
        >
          {OPTIONS.map((option) => (
            <form
              key={option.value}
              action={toggleUnitSystem}
              onSubmit={() => setOpen(false)}
            >
              <input type="hidden" name="unitSystem" value={option.value} />
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm text-text transition-colors hover:bg-card"
              >
                <span>
                  {option.label}
                  <span className="ml-1.5 font-mono text-[10px] text-text-faint">{option.meta}</span>
                </span>
                {option.value === unitSystem && <Check size={14} className="text-accent" />}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  )
}
