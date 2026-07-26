import { db } from "@/db"
import { pushSubscriptions, profiles } from "@/db/schema"
import { eq, and, or, isNull, lt } from "drizzle-orm"
import { NextRequest } from "next/server"
import webpush from "web-push"
import { hourInTimezone } from "@/lib/dates"
import { timingSafeEqual } from "crypto"

function isValidCronSecret(authHeader: string | null): boolean {
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!authHeader) return false
  const a = Buffer.from(authHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

// Triggered externally by cron-job.org every ~15min (Vercel's free-tier
// cron is capped at once/day). Protected by CRON_SECRET bearer token.
const REMINDER_INTERVAL_MS = 60 * 60 * 1000

// No reminder between midnight and 6am in the user's own timezone.
const QUIET_HOUR_END = 6

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!isValidCronSecret(authHeader)) {
    return new Response(null, { status: 401 })
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublicKey || !vapidPrivateKey) {
    return Response.json({ error: "VAPID keys not configured" }, { status: 500 })
  }

  webpush.setVapidDetails("mailto:noreply@macrograin.app", vapidPublicKey, vapidPrivateKey)

  const cutoff = new Date(Date.now() - REMINDER_INTERVAL_MS)

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
