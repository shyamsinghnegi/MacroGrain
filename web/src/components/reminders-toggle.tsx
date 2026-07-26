"use client"

import { useEffect, useState } from "react"
import { toggleReminders } from "@/app/settings/actions"
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-subscribe"

type PermissionState = "unsupported" | "default" | "granted" | "denied"
// Notification.permission granted != actually subscribed - subscribe can
// fail independently after permission is already granted, so both need
// tracking separately.
type SubStatus = "unknown" | "subscribed" | "not-subscribed"

function readPermission(): PermissionState {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported"
  }
  return Notification.permission
}

async function checkSubscribed(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration("/sw.js")
  const subscription = await registration?.pushManager.getSubscription()
  return Boolean(subscription)
}

// iOS Safari only exposes PushManager.subscribe() once added to the Home
// Screen (standalone mode) - Safari 16.4+.
function needsIosInstall(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  if (!isIos) return false

  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  return !isStandalone
}

export function RemindersToggle({ enabled }: { enabled: boolean }) {
  const [permission, setPermission] = useState<PermissionState>(readPermission)
  const [iosNeedsInstall] = useState(needsIosInstall)
  const [subStatus, setSubStatus] = useState<SubStatus>("unknown")
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeError, setSubscribeError] = useState<string | null>(null)

  useEffect(() => {
    checkSubscribed().then((subscribed) => setSubStatus(subscribed ? "subscribed" : "not-subscribed"))
  }, [])

  async function enablePush() {
    setSubscribing(true)
    setSubscribeError(null)
    try {
      await subscribeToPush()
      setPermission(readPermission())
      setSubStatus("subscribed")
    } catch (e) {
      setSubscribeError(e instanceof Error ? e.message : "Could not enable notifications.")
      setSubStatus("not-subscribed")
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 px-4 py-3.5">
      <form
        action={async (formData) => {
          const nextEnabled = formData.get("enabled") === "true"
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

      {enabled && iosNeedsInstall && (
        <p className="text-xs text-warning">
          On iPhone, push notifications only work after adding Macrograin to
          your Home Screen: tap Share, then &quot;Add to Home Screen,&quot; then
          open it from there and try this again.
        </p>
      )}

      {enabled && !iosNeedsInstall && permission === "denied" && (
        <p className="text-xs text-warning">
          Browser notifications are blocked, so this won&apos;t actually notify
          you. Allow notifications for this site in your browser settings to
          fix it.
        </p>
      )}

      {enabled && !iosNeedsInstall && permission === "unsupported" && (
        <p className="text-xs text-warning">
          This browser doesn&apos;t support notifications.
        </p>
      )}

      {enabled &&
        !iosNeedsInstall &&
        permission !== "denied" &&
        permission !== "unsupported" &&
        subStatus === "not-subscribed" && (
          <button
            type="button"
            onClick={enablePush}
            disabled={subscribing}
            className="w-fit text-xs text-accent underline disabled:opacity-50"
          >
            {subscribing
              ? "Enabling…"
              : permission === "granted"
                ? "Finish enabling notifications"
                : "Allow notifications"}
          </button>
        )}

      {enabled && subscribeError && (
        <p className="text-xs text-warning">{subscribeError}</p>
      )}
    </div>
  )
}
