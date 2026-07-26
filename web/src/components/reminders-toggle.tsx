"use client"

import { useEffect, useState } from "react"
import { toggleReminders } from "@/app/settings/actions"
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-subscribe"

type PermissionState = "unsupported" | "default" | "granted" | "denied"
// Whether the browser has an actual, live PushSubscription object right now
// - "unknown" until checked (requires an async serviceWorker.getRegistration
// call, can't be read synchronously like Notification.permission).
// Notification.permission === "granted" is NOT the same thing as being
// subscribed: permission is a one-time OS-level grant that persists forever
// once given, while the subscription itself is a separate step
// (pushManager.subscribe()) that can fail (e.g. a misconfigured VAPID key)
// independently and silently, with no way to tell from permission state
// alone. Confirmed as a real bug: a first subscribeToPush() attempt threw
// (stale NEXT_PUBLIC_VAPID_PUBLIC_KEY not yet in the deployed build),
// permission was already "granted" from that same attempt's prompt, and
// every visit after that showed no error and no retry button - the
// permission-only check had no way to notice the subscription never
// actually got created server-side.
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

// iOS Safari has Notification and serviceWorker available even in a plain
// browser tab, but PushManager.subscribe() is only reachable once the site
// has been added to the Home Screen and is running in that installed
// ("standalone") context - confirmed against Apple's own WebKit release
// notes (Safari 16.4+). A plain Safari tab will otherwise fail the
// subscribe call with a confusing error, or on older iOS just do nothing,
// so this needs its own detection ahead of the normal permission flow
// rather than falling through to "unsupported" (Notification does exist,
// so readPermission() alone can't tell these two cases apart).
function needsIosInstall(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  if (!isIos) return false

  // Standalone mode = launched from a Home Screen icon, not a Safari tab.
  // iOS Safari doesn't support the standard `display-mode` media query
  // reliably in all versions, so also check the older non-standard
  // navigator.standalone flag Apple has supported since early iOS.
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  return !isStandalone
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
