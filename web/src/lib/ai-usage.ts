import "server-only"
import { db } from "@/db"
import { aiUsageLogs } from "@/db/schema"
import { and, eq, gte, count } from "drizzle-orm"
import { dayBounds } from "@/lib/dates"

const DAILY_LIMIT = 50

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
