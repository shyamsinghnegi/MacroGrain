"use client"

import { savePushSubscription, removePushSubscription } from "@/app/settings/actions"

// Web Push's subscribe() call needs the VAPID public key as a Uint8Array,
// not the base64url string it's stored/transmitted as - this is the
// standard conversion (see MDN's push notification guides), not something
// specific to this app.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

// Full subscribe flow: register the service worker (idempotent - re-
// registering an already-registered SW is a no-op, not a duplicate),
// request Notification permission if needed, subscribe to push with the
// browser's PushManager, and persist the subscription server-side so
// api/cron/water-reminder can find it later. Throws with a message meant
// to be shown directly to the user on failure.
export async function subscribeToPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("This browser doesn't support notifications.")
  }
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    throw new Error("Push notifications aren't configured yet.")
  }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.")
  }

  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready

  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }))

  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Could not create a push subscription.")
  }

  await savePushSubscription({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  })
}

// Unsubscribes this browser both from the push service itself (so it stops
// being a valid target at all) and removes the saved row server-side.
export async function unsubscribeFromPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

  const registration = await navigator.serviceWorker.getRegistration("/sw.js")
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await removePushSubscription(endpoint)
}
