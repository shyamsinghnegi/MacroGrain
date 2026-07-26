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
