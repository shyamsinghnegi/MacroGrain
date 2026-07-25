"use client"

import { useState } from "react"
import { toggleReminders } from "@/app/settings/actions"
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-subscribe"

type PermissionState = "unsupported" | "default" | "granted" | "denied"

function readPermission(): PermissionState {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported"
  }
  return Notification.permission
}

// Wraps the plain server-action toggle with the real Web Push subscribe
// flow, plus live browser permission status - the DB's remindersEnabled
// flag only controls whether the server *tries* to push; if the browser
// permission was denied, the device doesn't support push, or the browser
// was never actually subscribed (a separate step from permission alone),
// the toggle can read "on" while nothing will ever fire, silently.
// Surfacing that here so it's not a mystery why reminders "don't work."
// Permission read via a lazy useState initializer, not an effect -
// Notification.permission is synchronously available, not an async
// external subscription.
export function RemindersToggle({ enabled }: { enabled: boolean }) {
  const [permission, setPermission] = useState<PermissionState>(readPermission)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeError, setSubscribeError] = useState<string | null>(null)

  async function enablePush() {
    setSubscribing(true)
    setSubscribeError(null)
    try {
      await subscribeToPush()
      setPermission(readPermission())
    } catch (e) {
      setSubscribeError(e instanceof Error ? e.message : "Could not enable notifications.")
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 px-4 py-3.5">
      <form
        action={async (formData) => {
          const nextEnabled = formData.get("enabled") === "true"
          // Unsubscribing this browser when turning reminders off - not
          // strictly required (the cron route only pushes to
          // remindersEnabled users anyway), but avoids leaving a stale
          // subscription row + an orphaned SW push registration around.
          if (!nextEnabled) {
            await unsubscribeFromPush().catch(() => {})
          }
          await toggleReminders(formData)
        }}
        className="flex items-center justify-between"
      >
        <input type="hidden" name="enabled" value={(!enabled).toString()} />
        <span className="text-sm text-text">Reminders</span>
        <button
          type="submit"
          aria-label="Toggle reminders"
          className={`relative h-6 w-10 rounded-full transition-colors ${
            enabled ? "bg-accent" : "bg-card-alt"
          }`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-surface shadow-[0_0_0_1px_var(--color-hairline)] transition-all ${
              enabled ? "left-4.5" : "left-0.5"
            }`}
          />
        </button>
      </form>

      <p className="font-mono text-[10px] text-text-faint">
        Hourly water nudges, delivered as a real push notification - works
        even if the app is closed, once notifications are allowed below.
      </p>

      {enabled && permission === "denied" && (
        <p className="text-xs text-warning">
          Browser notifications are blocked, so this won&apos;t actually notify
          you. Allow notifications for this site in your browser settings to
          fix it.
        </p>
      )}

      {enabled && permission === "unsupported" && (
        <p className="text-xs text-warning">
          This browser doesn&apos;t support notifications.
        </p>
      )}

      {enabled && permission === "default" && (
        <button
          type="button"
          onClick={enablePush}
          disabled={subscribing}
          className="w-fit text-xs text-accent underline disabled:opacity-50"
        >
          {subscribing ? "Enabling…" : "Allow notifications"}
        </button>
      )}

      {enabled && permission === "granted" && subscribeError && (
        <p className="text-xs text-warning">{subscribeError}</p>
      )}
    </div>
  )
}
