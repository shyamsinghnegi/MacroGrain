"use client"

import { useEffect } from "react"

const REMINDER_INTERVAL_MS = 60 * 60 * 1000
const STORAGE_KEY = "macrograin:lastWaterReminder"

// No push-notification backend exists (would require a service worker +
// server-sent push subscriptions, well beyond the free-tier scope here).
// This uses the browser's Notification API instead: it only fires while
// the app is open in a tab, reminding roughly hourly rather than truly
// in the background. Good enough for "nudge me while I'm using the app."
export function WaterReminders({ goalMl }: { goalMl: number }) {
  useEffect(() => {
    if (typeof Notification === "undefined") return

    function maybeNotify() {
      const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0)
      if (Date.now() - last < REMINDER_INTERVAL_MS) return
      if (Notification.permission !== "granted") return

      new Notification("Time to drink water", {
        body: `Stay on track for your ${(goalMl / 1000).toFixed(1)} L daily goal.`,
        tag: "water-reminder",
      })
      localStorage.setItem(STORAGE_KEY, String(Date.now()))
    }

    if (Notification.permission === "default") {
      Notification.requestPermission()
    }

    const interval = setInterval(maybeNotify, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [goalMl])

  return null
}
