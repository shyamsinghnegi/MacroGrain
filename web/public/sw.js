// Minimal service worker whose only job is to receive Web Push events and
// show a notification - this is the piece that makes reminders survive a
// closed tab/app, which nothing in the main React app can do (that code
// only runs while a tab is open). No caching/offline logic here - this
// project isn't trying to be a full offline-capable PWA, just needs a
// registered SW as Web Push's technical prerequisite.

self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    return
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "/api/icon?size=192",
    })
  )
})

// Tapping the notification focuses an existing MacroGrain tab if one is
// open, or opens a new one - without this, tapping a push notification on
// most platforms just dismisses it with no action.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) return client.focus()
      }
      return self.clients.openWindow("/")
    })
  )
})
