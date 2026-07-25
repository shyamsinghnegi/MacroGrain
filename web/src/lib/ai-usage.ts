import "server-only"
import { db } from "@/db"
import { aiUsageLogs } from "@/db/schema"
import { and, eq, gte, count } from "drizzle-orm"
import { dayBounds } from "@/lib/dates"

// Hard daily ceiling for AI vision calls, well under Gemini's free-tier
// quota (1,500 requests/day as of writing) - this isn't a cost control
// (the free tier can't overspend; Google just 429s past its own quota),
// it's a clean in-app "you've hit today's limit" message instead of a raw
// API error, and a hard stop against any bug that could loop-call the
// endpoint. Counts both scan kinds (photo + label) against the same pool,
// since they hit the same underlying API/quota.
const DAILY_LIMIT = 25

export async function checkAndRecordAiUsage(
  userId: string,
  kind: "photo" | "label",
  timezone: string
): Promise<{ allowed: true } | { allowed: false; usedToday: number }> {
  const { startOfDay } = dayBounds(new Date(), timezone)

  const [{ value: usedToday }] = await db
    .select({ value: count() })
    .from(aiUsageLogs)
    .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, startOfDay)))

  if (usedToday >= DAILY_LIMIT) {
    return { allowed: false, usedToday }
  }

  await db.insert(aiUsageLogs).values({ userId, kind })
  return { allowed: true }
}
