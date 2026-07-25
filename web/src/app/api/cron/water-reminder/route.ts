import { db } from "@/db"
import { pushSubscriptions, profiles } from "@/db/schema"
import { eq, and, or, isNull, lt } from "drizzle-orm"
import { NextRequest } from "next/server"
import webpush from "web-push"
import { hourInTimezone } from "@/lib/dates"

// Triggered by an external free scheduler (cron-job.org) hitting this URL
// every ~15-20 minutes - Vercel's own Cron is capped at once/day on the
// free Hobby tier, too coarse for an hourly reminder, so this route is the
// thing actually being scheduled rather than Vercel's own cron config. See
// build_log.md / the README for the exact cron-job.org setup steps.
//
// Protected by a shared-secret bearer token (CRON_SECRET) rather than
// being open - without this, anyone who found this URL could trigger a
// push send to every subscribed user.
const REMINDER_INTERVAL_MS = 60 * 60 * 1000

// Quiet hours: no reminder between midnight and 6am *in the user's own
// timezone*, not server/UTC time - a blanket UTC cutoff would fire at
// completely wrong local hours for anyone not near UTC+0 (same reasoning
// as lib/dates.ts's whole timezone-aware system). Nobody wants a push at
// 2am because they happen to be logged in from India while the cron runs
// on UTC. Checked per-subscription below since each user can be in a
// different zone. Quiet window is [0, 6) - 6am is the first hour reminders
// resume.
const QUIET_HOUR_END = 6

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(null, { status: 401 })
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublicKey || !vapidPrivateKey) {
    return Response.json({ error: "VAPID keys not configured" }, { status: 500 })
  }

  webpush.setVapidDetails("mailto:noreply@macrograin.app", vapidPublicKey, vapidPrivateKey)

  const cutoff = new Date(Date.now() - REMINDER_INTERVAL_MS)

  // Only subscriptions belonging to a user who currently has reminders
  // enabled AND hasn't been notified in the last hour (or never has been) -
  // mirrors water-reminders.tsx's original client-side gate, enforced
  // server-side now that this can fire without a tab open.
  const dueIgnoringQuietHours = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      waterGoalMl: profiles.waterGoalMl,
      timezone: profiles.timezone,
    })
    .from(pushSubscriptions)
    .innerJoin(profiles, eq(profiles.userId, pushSubscriptions.userId))
    .where(
      and(
        eq(profiles.remindersEnabled, true),
        or(isNull(pushSubscriptions.lastNotifiedAt), lt(pushSubscriptions.lastNotifiedAt, cutoff))
      )
    )

  const due = dueIgnoringQuietHours.filter((sub) => {
    const localHour = hourInTimezone(new Date(), sub.timezone)
    return localHour >= QUIET_HOUR_END
  })
  const quieted = dueIgnoringQuietHours.length - due.length

  let sent = 0
  let expired = 0

  for (const sub of due) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: "Time to drink water",
          body: `Stay on track for your ${(sub.waterGoalMl / 1000).toFixed(1)} L daily goal.`,
          tag: "water-reminder",
        })
      )
      await db
        .update(pushSubscriptions)
        .set({ lastNotifiedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id))
      sent++
    } catch (e) {
      // 404/410 means the push service (browser/OS) has invalidated this
      // subscription (user cleared site data, uninstalled, etc.) - clean it
      // up rather than retrying it forever. Any other error (network blip,
      // push service hiccup) is left alone to retry next run.
      const status = (e as { statusCode?: number })?.statusCode
      if (status === 404 || status === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        expired++
      } else {
        console.error("[cron/water-reminder] push failed:", e)
      }
    }
  }

  return Response.json({ due: due.length, sent, expired, quieted })
}
