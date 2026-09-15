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

const CACHE_NAME = "macrograin-cache-v1"

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (
    event.request.method === "GET" &&
    (url.pathname.startsWith("/_next/image") ||
      url.pathname.startsWith("/_next/static") ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/))
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const clone = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone)
              })
            }
            return networkResponse
          })
          .catch(() => null)

        return cachedResponse || fetchPromise
      })
    )
  }
})
