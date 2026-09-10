"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

function localDateKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
}

// Server components compute "today" once, at render time - a dashboard left
// open (or a backgrounded/locked phone) across midnight keeps showing
// yesterday's totals forever, since nothing re-renders without a navigation.
// This refreshes the current route once the browser's local calendar date
// actually advances, so returning to an already-open tab after midnight
// shows today's data instead of a stale pre-midnight snapshot.
export function DayRolloverRefresh() {
  const router = useRouter()
  const dateKeyRef = useRef<string>(localDateKey())

  useEffect(() => {
    function checkRollover() {
      const current = localDateKey()
      if (current !== dateKeyRef.current) {
        dateKeyRef.current = current
        router.refresh()
      }
    }

    // Catches the common case: phone was locked/tab backgrounded overnight,
    // user reopens it after midnight - fires before any scheduled timer would.
    function onVisible() {
      if (document.visibilityState === "visible") checkRollover()
    }

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", checkRollover)

    // Also catches the rarer case: the tab stays open and in the foreground
    // right through midnight, with no focus/visibility event to trigger a
    // check. Scheduled for just after the next local midnight, then
    // re-scheduled after each firing.
    let timeoutId: ReturnType<typeof setTimeout>
    function scheduleMidnightCheck() {
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5)
      timeoutId = setTimeout(() => {
        checkRollover()
        scheduleMidnightCheck()
      }, nextMidnight.getTime() - now.getTime())
    }
    scheduleMidnightCheck()

    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", checkRollover)
      clearTimeout(timeoutId)
    }
  }, [router])

  return null
}
