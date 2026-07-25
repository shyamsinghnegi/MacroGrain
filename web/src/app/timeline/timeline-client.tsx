"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { X, GripVertical } from "lucide-react"
import { moveEntry, copyEntry, deleteEntry } from "./actions"
import { SourceBadge } from "@/components/source-badge"
import { hourInTimezone } from "@/lib/dates"

type Entry = {
  id: string
  datetime: string
  quantityG: number
  calories: number
  protein: number
  carbs: number
  fat: number
  source: "barcode" | "ai_photo" | "manual"
  name: string
}

// Long-press timing before the Move/Copy action menu appears - matches
// common mobile long-press conventions (iOS/Android context menus).
const LONG_PRESS_MS = 450

export function TimelineClient({
  entries,
  dateParam,
  timezone,
}: {
  entries: Entry[]
  dateParam: string
  timezone: string
}) {
  const [isPending, startTransition] = useTransition()
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null)
  const [dragEntryId, setDragEntryId] = useState<string | null>(null)
  const [dragMode, setDragMode] = useState<"move" | "copy" | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const entriesByHour = new Map<number, Entry[]>()
  for (const entry of entries) {
    const hour = hourInTimezone(new Date(entry.datetime), timezone)
    const list = entriesByHour.get(hour) ?? []
    list.push(entry)
    entriesByHour.set(hour, list)
  }

  function startLongPress(entryId: string) {
    longPressTimer.current = setTimeout(() => {
      setActionMenuFor(entryId)
    }, LONG_PRESS_MS)
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleDrop(hour: number) {
    if (!dragEntryId || !dragMode) return
    const formData = new FormData()
    formData.set("entryId", dragEntryId)
    formData.set("hour", String(hour))
    formData.set("timezone", timezone)
    const action = dragMode === "move" ? moveEntry : copyEntry
    startTransition(async () => {
      await action(formData)
    })
    setDragEntryId(null)
    setDragMode(null)
  }

  function handleDelete(entryId: string) {
    const formData = new FormData()
    formData.set("entryId", entryId)
    startTransition(async () => {
      await deleteEntry(formData)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/log?returnTo=/timeline&date=${dateParam}`}
        className="mx-auto block w-fit rounded-pill bg-accent px-5 py-2 text-sm font-bold text-bg shadow-accent-glow"
      >
        + Search food
      </Link>

      {dragEntryId && (
        <p className="text-center font-mono text-[10px] text-accent">
          Drop on an hour to {dragMode} · drag cancels if dropped nowhere
        </p>
      )}

      <div className="flex w-full flex-col">
        {Array.from({ length: 24 }, (_, hour) => hour).map((hour) => {
          const hourEntries = entriesByHour.get(hour) ?? []
          const nextHour = (hour + 1) % 24
          const period = hour < 12 ? "am" : "pm"
          const nextPeriod = nextHour < 12 ? "am" : "pm"
          const hour12 = hour % 12 === 0 ? 12 : hour % 12
          const nextHour12 = nextHour % 12 === 0 ? 12 : nextHour % 12
          const rangeLabel =
            period === nextPeriod
              ? `${hour12}–${nextHour12}${period}`
              : `${hour12}${period}–${nextHour12}${nextPeriod}`

          return (
            <div
              key={hour}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(hour)}
              className="flex min-h-24 w-full gap-3 border-t border-hairline px-4 py-3 first:border-t-0"
            >
              <div className="flex w-16 shrink-0 flex-col items-start gap-1.5 pt-1">
                <span className="font-mono text-[11px] whitespace-nowrap text-text-faint">
                  {rangeLabel}
                </span>
                <Link
                  href={`/log?returnTo=/timeline&date=${dateParam}&hour=${hour}`}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full border border-hairline text-xs text-text-muted"
                  aria-label={`Add food at ${rangeLabel}`}
                >
                  +
                </Link>
              </div>

              <div className="flex min-h-8 min-w-0 flex-1 flex-col gap-2">
                {hourEntries.length === 0 && (
                  <p className="pt-1 font-mono text-[11px] text-text-faint">
                    Nothing logged
                  </p>
                )}
                {hourEntries.map((entry) => (
                  <div
                    key={entry.id}
                    draggable
                    onDragStart={() => {
                      setDragEntryId(entry.id)
                      setDragMode("move")
                    }}
                    onDragEnd={() => {
                      setDragEntryId(null)
                      setDragMode(null)
                    }}
                    onPointerDown={() => startLongPress(entry.id)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    className="relative flex items-center gap-2 rounded-card border border-hairline bg-card px-3 py-2 shadow-card"
                  >
                    <GripVertical
                      size={14}
                      className="shrink-0 cursor-grab text-text-faint"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm text-text">{entry.name}</p>
                        <SourceBadge source={entry.source} />
                      </div>
                      <p className="font-mono text-[11px] text-text-muted">
                        {Math.round(entry.quantityG)}g ·{" "}
                        {Math.round(entry.calories)} kcal
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={isPending}
                      aria-label="Remove entry"
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-text-faint hover:text-warning"
                    >
                      <X size={14} />
                    </button>

                    {actionMenuFor === entry.id && (
                      <div
                        className="absolute top-full right-0 z-20 mt-1 flex gap-1 rounded-card border border-hairline bg-card-alt p-1 shadow-hero"
                        onPointerLeave={() => setActionMenuFor(null)}
                      >
                        <button
                          type="button"
                          className="rounded-input px-3 py-1.5 text-xs text-text"
                          onPointerDown={() => {
                            setDragEntryId(entry.id)
                            setDragMode("move")
                            setActionMenuFor(null)
                          }}
                        >
                          Move
                        </button>
                        <button
                          type="button"
                          className="rounded-input px-3 py-1.5 text-xs text-accent"
                          onPointerDown={() => {
                            setDragEntryId(entry.id)
                            setDragMode("copy")
                            setActionMenuFor(null)
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
