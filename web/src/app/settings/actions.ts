"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, pushSubscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function toggleReminders(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const enabled = formData.get("enabled") === "true"

  await db
    .update(profiles)
    .set({ remindersEnabled: enabled, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id))

  redirect("/settings")
}

// Saves a browser's Web Push subscription so api/cron/water-reminder can
// later push to it even when no tab is open. Called from push-subscribe.tsx
// right after the browser grants a PushSubscription - not a form action
// (no page navigation should happen here, this runs silently in the
// background right after the user allows notifications).
export async function savePushSubscription(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const session = await auth()
  if (!session?.user?.id) return

  await db
    .insert(pushSubscriptions)
    .values({
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: session.user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    })
}

// Called when the user turns reminders off, or a subscribe attempt fails
// after previously succeeding - removes this browser's row so the cron
// route stops trying to push to it (a push to a since-unsubscribed
// endpoint just errors out otherwise, harmless but wasted work).
export async function removePushSubscription(endpoint: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
}
